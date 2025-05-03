# Z-Wave Log File Format (ZLF) Specification

## 1. Overview

The **ZLF** (Z-Wave Log File) format is a **binary trace format** used by
Silicon Labs' **Zniffer** tool to record captured Z-Wave RF communication. Each
`.zlf` or `.zwlf` file contains:

- A fixed-size metadata header (2048 bytes).
- A sequential stream of timestamped frames, each encapsulating one capture
  event.
- Two main payload types:
  - **Command Frames** (`0x23`) – control messages from host to capture
    hardware.
  - **Data Frames** (`0x21`) – RF-captured Z-Wave frames.
- Optionally, **continuation frames** used to reconstruct large **Logical Data
  Frames (LDFs)**.

## 2. File Structure

```plaintext
+------------------------------+
| 2048-byte Header             |
+------------------------------+
| Frame 0                      |
| Frame 1                      |
| Frame 2                      |
| ...                          |
+------------------------------+
```

### 2.1 Header (2048 bytes)

- **Static size**: Always 2048 bytes.
- **Contains**: Zniffer version, firmware version, controller details,
  frequency, region, timestamps, user comments.
- **Action**: **Must be skipped** by all parsers. Not decoded at runtime.

## 3. Frame Structure

Each frame has the following outer structure:

| Field           | Size    | Description                              |
| --------------- | ------- | ---------------------------------------- |
| Timestamp       | 8 bytes | Windows FILETIME (mask upper 2 bits)     |
| Control Byte    | 1 byte  | Bit 7 = Direction, Bits 0–6 = Session ID |
| Payload Length  | 4 bytes | LE32 encoded payload length              |
| Payload         | N bytes | Typed content: Command or Data frame     |
| Trailing Marker | 1 byte  | Reserved; read and ignored               |

### Timestamp Details

- **Format**: Windows FILETIME (64-bit ticks since 1601-01-01 UTC).
- **Conversion**:
  ```ts
  unixMillis =
    ((timestamp & ((1n << 62n) - 1n)) - 621355968000000000n) / 10000n;
  ```
- **Reason for Masking**: Upper bits may carry non-time metadata.

### Control Byte

| Bit | Meaning                                   |
| --- | ----------------------------------------- |
| 7   | Direction: `0` = incoming, `1` = outgoing |
| 0–6 | Logical session ID                        |

## 4. Payload Types

### 4.1 Command Frame (`payload[0] == 0x23`)

**Purpose**: Configuration and status communication with Zniffer hardware.

| Offset | Field         | Size    | Description                     |
| ------ | ------------- | ------- | ------------------------------- |
| 0      | Message Type  | 1 byte  | Always `0x23`                   |
| 1      | Function Type | 1 byte  | Command type (e.g. Start, Stop) |
| 2      | Length        | 1 byte  | Length of following payload     |
| 3+     | Payload       | N bytes | Function-specific arguments     |

**Known Commands**:

- `0x01`: `GetVersion`
- `0x02`: `SetFrequency`
- `0x04`: `Start`
- `0x05`: `Stop`
- `0x0E`: `SetBaudRate`
- `0x13`: `GetFrequencyInfo`

Command frames are not RF traffic and are hidden in the
[Simplicity Studio Z-Wave Zniffer](../tools/zniffer.md).

### 4.2 Data Frame (`payload[0] == 0x21`)

**Purpose**: Represents a captured Z-Wave RF transmission.

| Offset | Field         | Size      | Description                                  |
| ------ | ------------- | --------- | -------------------------------------------- |
| 0      | Message Type  | 1 byte    | Always `0x21`                                |
| 1      | Frame Type    | 1 byte    | `0x01`=MAC Data, `0x04`=Beam Start, etc.     |
| 2      | Reserved      | 2 bytes   | `0x0000`                                     |
| 4      | Channel/Speed | 1 byte    | Upper 3 bits: RF Channel; Lower 5: Data Rate |
| 5      | Region        | 1 byte    | RF Region (e.g. EU, US)                      |
| 6      | RSSI          | 1 byte    | Signal strength                              |
| 7–8    | Length Marker | 2 bytes   | Expected MPDU+checksum length                |
| 9+     | Z-Wave MPDU   | variable  | Actual over-the-air packet incl. Home ID     |
| Tail   | Checksum      | 1–2 bytes | XOR or CRC16 depending on speed              |

**Checksum Type**:

- `≤40 kbps`: XOR (1 byte)
- `≥100 kbps` / LR: CRC-16-CCITT (2 bytes)

---

## 5. Logical Data Frames (LDFs)

**Motivation**: Large or chunked RF transmissions may span multiple ZLF frames.

### Construction Rules

1. **Start**: Frame with `payload[0] == 0x21` (ZLF Data Frame).
2. **Continuation**: Frames that follow immediately with unknown `payload[0]`.
3. **End**: When another known frame type (`0x21` or `0x23`) is found.

### Merging Logic

```ts
ldfPayload = Buffer.concat([f0.payload, f1.payload, ..., fn.payload]);
ldfTimestamp = fn.timestamp;
controlByte = f0.control;
```

- Use timestamp of **last** frame in the group.
- Use **first** frame's control byte to infer direction/session.
- Validate checksum **after** merging.

## 6. Implementation Guidelines

- Always parse with support for **continuation frames**.
- Discard command frames during RF traffic analysis unless debugging setup.
- Validate checksum post-assembly.
- To reconstruct semantic meaning (Command Class decoding), defer decoding until
  LDF reassembly.

## 7. Compatibility

- `.zlf` and `.zwlf` files are equivalent in structure.
- Old formats (`.zbf`, `.znf`) require conversion tools.
- Logs are forward-compatible: unknown frame types should be skipped gracefully.

## 8. References

- [ZLF Command Frame Specification](zlf-command-frame.md)
- [ZLF Data Frame Specification](zlf-data-frame.md)
- [ZLF Logical Data Frame Specification](zlf-logical-data-frame.md)
- [INS10249 – Zniffer User Guide](https://www.silabs.com/documents/public/user-guides/INS10249-Z-Wave-Zniffer-User-Guide.pdf)
- [Simplicity Studio Z-Wave Zniffer](../tools/zniffer.md)
