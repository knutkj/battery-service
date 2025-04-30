# ZLF Data Frame Specification

## Overview

A **ZLF Data Frame** is a specific type of frame found in `.zlf` files as
defined in the [ZLF Specification](../zlf.md). The payload of a ZLF frame may
contain a **Data Frame**, which captures the full Z-Wave RF communication along
with metadata such as signal quality, channel, region, and network context. This
document defines the structure and semantics of the **payload** portion of such
Data Frames.

> ℹ️ For outer frame structure (timestamp, control byte, length, etc.), refer to
> the [ZLF Specification](../zlf.md).

## Payload Structure (ZLF Data Frame)

| Field             | Offset | Size         | Description                                  |
| ----------------- | ------ | ------------ | -------------------------------------------- |
| **Message Type**  | 0      | 1 byte       | Must be `0x21` (Data Frame identifier).      |
| **Frame Type**    | 1      | 1 byte       | `0x01` = MAC Data, `0x04` = Beam Start, etc. |
| **Reserved**      | 2      | 2 bytes      | Always `0x00 0x00`.                          |
| **Channel/Speed** | 4      | 1 byte       | Encodes both RF channel and data rate.       |
| **Region**        | 5      | 1 byte       | RF region where capture occurred.            |
| **RSSI**          | 6      | 1 byte       | Received Signal Strength Indicator.          |
| **Length Marker** | 7–8    | 2 bytes      | Optional length indicator for sanity check.  |
| **Z-Wave MPDU**   | 9+     | Variable     | Z-Wave MAC Payload. Includes Home ID, etc.   |
| **Checksum**      | Tail   | 1 or 2 bytes | Depends on transmission speed.               |

### Message Type (`0x21`)

- Indicates this payload is a Data Frame.
- Always the first byte in the payload.

### Frame Type

- **0x01:** Standard Z-Wave RF Data Frame (most common).
- **0x04:** Beam Start Frame (FLiRS devices wakeup indication).
- **0x05:** Beam Stop Frame.

Other values may exist in future or proprietary use cases.

### Channel and Protocol Speed

Derived from byte at offset 4:

```ts
const channel = payload[4] >>> 5;
const speed = payload[4] & 0b00011111;
```

| Speed Code | Data Rate        | Notes                  |
| ---------- | ---------------- | ---------------------- |
| `0x00`     | 9.6 kbps         | Low-rate legacy frames |
| `0x01`     | 40 kbps          | Legacy high-rate       |
| `0x02`     | 100 kbps         | Modern speed           |
| `0x03`     | Z-Wave LR (100k) | Long range, high power |

Speed value affects checksum type.

### RF Region

Encoded RF region byte matches configured Zniffer setting (e.g., EU, US, ANZ).
Not standardized in the payload, usage is implementation-defined.

### RSSI

RSSI value is recorded from the capturing interface:

| Value | Meaning                                             |
| ----- | --------------------------------------------------- |
| 0–124 | RSSI in dBm (PTI mode) or encoded RSSI (500-series) |
| 125   | No signal detected                                  |
| 126   | Receiver saturated                                  |
| 127   | Not available or error                              |

- **500-series** Zniffer sticks use 1.5 dB/LSB:
  `RF_input_dBm ≈ RSSI * 1.5 - 153.5`
- **PTI-based (700/800)** report native dBm.

### Z-Wave MAC Payload (MPDU)

Begins at byte offset **9**:

| Field                | Size     | Notes                                       |
| -------------------- | -------- | ------------------------------------------- |
| **Home ID**          | 4 bytes  | Unique 32-bit network ID                    |
| **Source Node**      | 1 byte   | Sending node (originator)                   |
| **Destination Node** | 1 byte   | Intended recipient (direct or routed)       |
| **Payload**          | Variable | Protocol layer data including command class |

The format closely follows Z-Wave over-the-air MAC format. Zniffer parses it
using the XML Command Class definitions for further decoding.

### Checksum

The checksum is located at the end of the payload:

| Speed           | Checksum Type       |
| --------------- | ------------------- |
| ≤ 40 kbps       | 1-byte XOR          |
| ≥ 100 kbps / LR | 2-byte CRC-16-CCITT |

It is computed over the Z-Wave MPDU portion only (excluding the Zniffer header).

### Notes on Frame Routing

- Routed frames may show `xx(yy)` notation for nodes: `xx` is current forwarder,
  `yy` is the originator or final target.
- This is interpreted by Zniffer UI but not directly encoded in binary.

## Summary

- ZLF Data Frames start with `0x21` and contain full Z-Wave RF packet captures.
- Metadata includes speed, region, channel, RSSI, and frame type.
- Z-Wave packet is preserved in its original MAC format with checksum.
- Parsing requires extracting Zniffer metadata (first 9 bytes) to access MPDU.
- Use frame type `0x01` for RF data analysis.
- Decryption (Security/S2) may require external key input if frame is encrypted.

## See Also

- [ZLF Specification](../zlf.md)
- [ZLF Command Frame](zlf-command.md)
- [ZlfReader](ZlfReader.md)
- INS10249 – Z-Wave Zniffer User Guide
