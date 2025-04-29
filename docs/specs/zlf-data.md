# ZLF Data Frame Specification

## Overview

A **ZLF Data Frame** is a specific type of frame found in `.zlf` files as
described in the [ZLF Specification](../zlf.md). The payload of a ZLF frame may
contain a **Data Frame**, which encodes metadata and the captured Z-Wave RF
packet from the Zniffer tool. This document describes the structure and
semantics of the **payload** portion of such Data Frames.

> ℹ️ For frame wrapping (timestamp, control byte, length, etc.), refer to the
> [ZLF Specification](../zlf.md).

## Payload Structure (Data Frame)

| Field              | Offset | Size         | Description                                     |
| ------------------ | ------ | ------------ | ----------------------------------------------- |
| **Message Type**   | 0      | 1 byte       | Must be `0x21` (Data Frame marker).             |
| **Frame Type**     | 1      | 1 byte       | 0x01 = Z-Wave Data Frame.                       |
| **Reserved**       | 2      | 2 bytes      | Always `0x00 0x00`.                             |
| **Channel/Speed**  | 4      | 1 byte       | 9.6 kbps/40 kbps/100 kbps/Long Range (100k).    |
| **Region**         | 5      | 1 byte       | RF region code used during capture.             |
| **RSSI**           | 6      | 1 byte       | Raw RSSI value or error code (125–127).         |
| **Length Marker**  | 7–8    | 2 bytes      | Used to validate structure.                     |
| **Z-Wave Payload** | 9+     | Variable     | MAC Protocol Data Unit (MPDU).                  |
| **Checksum**       | Tail   | 1 or 2 bytes | XOR (if ≤40k) or CRC-16-CCITT (if ≥100k or LR). |

### Message Type (`0x21`)

- Identifies the payload as a **Data Frame**.
- Always the first byte in a valid Data Frame payload.

### Frame Type

- **0x01:** Z-Wave MAC Data Frame (most common).
- **0x04:** Beam Start (used by FLiRS devices).
- **0x05:** Beam Stop.
- Other values may exist in vendor-defined scenarios.

### Channel & Protocol Speed

Extracted from **payload[4]**:

```ts
const channel = payload[4] >>> 5;
const speed = payload[4] & 0b00011111;
```

| Speed Code | Description       |
| ---------- | ----------------- |
| 0x00       | 9.6 kbps          |
| 0x01       | 40 kbps           |
| 0x02       | 100 kbps          |
| 0x03       | Long Range (100k) |

Speed affects the **checksum type**.

### RSSI

| Value Range | Interpretation        |
| ----------- | --------------------- |
| 0–124       | RSSI in dBm           |
| 125         | No signal detected    |
| 126         | Receiver saturated    |
| 127         | Not available (error) |

### MPDU (Z-Wave Payload)

MPDU begins at byte **9** and includes:

- Home ID (4 bytes)
- Source Node ID (1 byte)
- Destination Node ID (1 byte)
- MAC header type, flags, payload, etc.

Actual format matches the Z-Wave over-the-air MAC frame.

### Checksum

Located at the **end of the payload**, determined by speed:

- **9.6 kbps / 40 kbps:** 1-byte XOR
- **100 kbps / LR:** 2-byte CRC-16-CCITT

Checksum is computed over the MPDU section only (excluding Zniffer metadata
prefix).

## Summary

- A **ZLF Data Frame** is identified by `payload[0] === 0x21`.
- It contains channel/speed metadata, RSSI, RF region, and the full Z-Wave MPDU.
- **Parsing depends on correctly separating the 9-byte Zniffer header from the
  MPDU.**
- Frame type `0x01` is the primary format for captured RF communication.
