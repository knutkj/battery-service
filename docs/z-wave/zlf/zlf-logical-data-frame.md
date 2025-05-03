# ZLF Logical Data Frame Specification

## 1. Purpose

This specification defines how to reconstruct **Logical Data Frames (LDFs)**
from raw `.zlf` or `.zwlf` files captured by the **Simplicity Studio Z-Wave
Zniffer tool**. Each LDF represents a complete, semantically meaningful unit of
Z-Wave traffic—**equivalent to a row in the Zniffer UI**.

ZLF files store Z-Wave RF traffic as raw binary fragments, but some over-the-air
transmissions span multiple physical frames (e.g. due to USB transport, high
frame size, or packet chunking). LDFs merge these fragments into **fully
reassembled protocol units** to enable safe decoding and meaningful analysis.

## 2. Scope

This document covers only:

- Identification and grouping of **ZLF Data Frames** and their **continuation
  frames**.
- Rules for merging these into **Logical Data Frames**.

It does **not** cover:

- MAC/PHY-layer parsing (see [ZLF Data Frame](zlf-data-frame.md)).
- Zniffer tool commands or serial protocol (see
  [ZLF Command Frame](zlf-command-frame.md)).
- Decryption or semantic decoding of Command Class contents.
- Visualization or GUI-specific metadata (e.g., routing info).

## 3. Key Definitions

| Term                             | Description                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| **ZLF File**                     | A `.zlf` or `.zwlf` binary capture from Zniffer.                                    |
| **ZLF Frame**                    | A unit in the file, includes timestamp, control byte, and typed payload.            |
| **ZLF Data Frame**               | A frame with `payload[0] == 0x21`, representing RF-captured traffic.                |
| **ZLF Continuation Frame**       | A frame with unrecognized type, assumed to continue the prior Data Frame.           |
| **ZLF Logical Data Frame (LDF)** | A reconstructed payload formed by joining a base Data Frame with its continuations. |

## 4. Grouping Rules

### 4.1 Start Condition

An LDF starts when a ZLF frame has a **Message Type byte (`payload[0]`) of
`0x21`** — i.e., a valid ZLF Data Frame.

### 4.2 Continuation Detection

Subsequent frames with unknown `payload[0]` values (i.e., not `0x21` or `0x23`)
and **no valid Data or Command message types** are assumed to be
**continuations** of the preceding Data Frame.

### 4.3 Termination Condition

Continuation ends when:

- A frame is encountered with a known `payload[0]` (`0x21` or `0x23`).
- End-of-file is reached.

### 4.4 Validity Rules

- The initial frame must be a valid Data Frame.
- Any "continuation" must **immediately follow** the base frame or another
  continuation (no unrelated frame types in between).

## 5. Merging Behavior

### 5.1 Timestamp

Use the **timestamp of the last frame** in the group for the LDF. This
corresponds to what Zniffer UI displays as the time of the complete
transmission.

### 5.2 Payload

Concatenate the raw payloads (excluding outer ZLF frame headers) in order of
appearance:

```ts
ldfPayload = Buffer.concat([frame0.payload, frame1.payload, ..., frameN.payload])
```

This forms a single binary blob representing the original Z-Wave MAC frame
(including checksum).

### 5.3 Source Tracking

Retain the list of contributing frames:

```ts
interface ZlfLogicalDataFrame {
  readonly payload: Buffer; // Combined Z-Wave MPDU + checksum
  readonly timestamp: Date; // Timestamp from last continuation
  readonly sourceFrames: ZlfFrame[]; // Ordered contributing ZLF frames
}
```

## 6. Practical Considerations

- **Do not decode or decrypt payloads** until after logical frame assembly.
- **Validate checksum** (XOR or CRC16) only after reassembly.
- Continuations are **opaque** — they carry no type info, and the only safe
  signal is position in the frame sequence.

## 7. Example Scenarios

### Case A: Single Continuation

| Index | Message Type | Payload (hex)                                |
| ----- | ------------ | -------------------------------------------- |
| 0012  | `0x21`       | `2101000021002C21030DC4A815CD0651010D012001` |
| 0013  | Unknown      | `FFCF`                                       |

→ LDF payload = `2101000021002C21030DC4A815CD0651010D012001FFCF`  
→ Timestamp = frame 13

### Case B: Multiple Continuations

| Index | Message Type | Payload (hex)                                    |
| ----- | ------------ | ------------------------------------------------ |
| 0020  | `0x21`       | `21`                                             |
| 0021  | Unknown      | `01000002002A21030FC4A815CD0A41010F013003FF0C87` |
| 0022  | Unknown      | `F3`                                             |

→ LDF payload = `2101000002002A21030FC4A815CD0A41010F013003FF0C87F3`  
→ Timestamp = frame 22

## 8. Integration Notes

- Zniffer UI uses **logical data frames** as primary units for display.
- Logical assembly is essential for:
  - XML-based Command Class decoding
  - GUI routing/path representation
  - Consistent timestamps and frame filtering
- Use the control byte from the **first frame** to infer direction and session
  ID.

## 9. References

- [ZLF Format Specification](zlf.md)
- [ZLF Data Frame Specification](zlf-data-frame.md)
- [ZLF Command Frame Specification](zlf-command-frame.md)
- [Zniffer User Guide – INS10249](https://www.silabs.com/documents/public/user-guides/INS10249-Z-Wave-Zniffer-User-Guide.pdf)
