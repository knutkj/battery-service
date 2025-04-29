# Z-Wave Log File (ZLF) Specification

## Overview

The **ZLF (Z-Wave Log File)** format is a binary recording format used by
[the Silicon Labs Zniffer tool](../tools/zniffer.md) to store passively captured
Z-Wave RF traffic. The file consists of a fixed-size header followed by a
sequence of frames. Each frame encapsulates a single RF capture event with
timestamp, direction, session ID, and payload data. ZLF and ZWLF file extensions
represent the same format.

```plaintext
+-----------------------------+
| 2048 bytes header (static)  |
+-----------------------------+
| Frame 0                     |
| Frame 1                     |
| Frame 2                     |
| ...                         |
+-----------------------------+
```

## 1. Header Section

- **Size:** 2048 bytes (fixed).
- **Contents:** Session metadata (Zniffer tool version, device info, RF region,
  start timestamp, etc.).
- **Parsing:** Application-specific; frame readers **MUST skip** the first 2048
  bytes without processing.

## 2. Frame Section

Each frame records exactly one Z-Wave RF capture event.

| Field               | Size    | Description                          |
| :------------------ | :------ | :----------------------------------- |
| **Timestamp**       | 8 bytes | Windows FILETIME.                    |
| **Control**         | 1 byte  | Direction and session id.            |
| **Payload Length**  | 4 bytes | Number of bytes in the payload.      |
| **Payload**         | N bytes | Capture metadata and Z-Wave RF data. |
| **Trailing Marker** | 1 byte  | Reserved; Read but ignored.          |

### Timestamp

- **Format:** 64-bit unsigned integer (FILETIME standard).
- **Conversion:**
  - Mask to 62 bits: `(ticks & ((1n << 62n) - 1n))`
  - Subtract FILETIME epoch offset: `621355968000000000n`
  - Divide by `10000n` to get milliseconds since Unix epoch (1970-01-01 UTC).
- **Notes:** Upper two bits may encode non-time information; **masking is
  mandatory** before timestamp conversion.

### Control Byte

- **Bit 7:** Direction:
  - `0` = Frame captured as incoming from RF.
  - `1` = Frame captured as outgoing from local controller.
- **Bits 0–6:** Session ID:
  - Used for differentiating logical capture streams.
  - Typically `0` for single-session captures.

### Payload Length

- **Endianess:** Little-endian (LE32).
- **Meaning:** Exact size of payload bytes immediately following the length
  field.

### Payload

- **Content:** Opaque binary blob containing frame-specific capture metadata and
  RF packet bytes.
- **Interpretation:** Application-specific.

### Trailing Marker

- **Usage:** 1 byte read after the payload.
- **Typical Value:** `0x00`.
- **Action:** Always read, but **no semantic meaning** defined.  
  **Ignored** during payload extraction.

## Reading Frames (Processing Logic)

1. **Skip 2048-byte header.**
2. **Read frame header:**
   - 8 bytes timestamp
   - 1 byte control
   - 4 bytes payload length
3. **Read payload:**
   - N bytes (payload length from step 2)
4. **Read trailing marker:** 1 byte
5. **Frame complete.** Repeat for next frame.

## Guarantees

- Frame boundaries are deterministic based on payload length.
- No additional file-level markers exist between frames.
- Frames are self-contained: no external synchronization needed if file is read
  sequentially.

## See

- **[ZLF Command Frame](zlf-command.md):** Specifies the structure of a Command
  Frame payload, representing control messages between the Zniffer software and
  device, identified by function types and optional parameters.
- **[ZLF Data Frame](zlf-data.md):** Specifies the structure of a Data Frame
  payload, which includes Zniffer capture metadata (channel, speed, region,
  RSSI) and the raw Z-Wave MPDU extracted from the air.
- **[ZlfReader](ZlfReader.md):** Describes the ZlfReader utility class that
  provides incremental, asynchronous reading of full frames from .zlf files,
  with position tracking and recovery capabilities.
