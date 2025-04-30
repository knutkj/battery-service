# ZLF Data Frame Specification (Improved)

## Overview

A **ZLF Data Frame** is a binary payload type found in `.zlf`/`.zwlf` files that
encapsulates a full **Z-Wave RF transmission capture**, including metadata about
RF characteristics and network context. These frames are critical for
post-analysis of Z-Wave protocol behavior.

> For the outer structure of a ZLF frame (timestamp, control byte, payload
> length, etc.), see the [ZLF Format Specification](zlf.md).

## Payload Layout

| Offset | Field         | Size      | Description                                              |
| ------ | ------------- | --------- | -------------------------------------------------------- |
| 0      | Message Type  | 1 byte    | Must be `0x21` (identifies a Data Frame)                 |
| 1      | Frame Type    | 1 byte    | RF frame type: `0x01` = MAC Data, `0x04` = Beam Start    |
| 2      | Reserved      | 2 bytes   | Always `0x00 0x00`; reserved for alignment               |
| 4      | Channel/Speed | 1 byte    | Encodes RF channel (bits 7–5) and speed (bits 4–0)       |
| 5      | Region        | 1 byte    | Captured RF region (e.g., EU, US, ANZ)                   |
| 6      | RSSI          | 1 byte    | Received Signal Strength Indicator                       |
| 7      | Length Marker | 2 bytes   | Optional MPDU length for integrity check (little-endian) |
| 9      | Z-Wave MPDU   | Variable  | Captured Z-Wave MAC frame (starts with Home ID)          |
| Tail   | Checksum      | 1–2 bytes | 1-byte XOR (≤40 kbps) or 2-byte CRC16 (≥100 kbps/LR)     |

## Field Descriptions

### Message Type (`0x21`)

Constant byte that identifies this payload as a ZLF Data Frame.

### Frame Type (Offset 1)

Identifies the specific nature of the RF capture:

| Value  | Meaning    | Notes                        |
| ------ | ---------- | ---------------------------- |
| `0x01` | MAC Data   | Standard Z-Wave transmission |
| `0x04` | Beam Start | FLiRS wakeup indication      |
| `0x05` | Beam Stop  | FLiRS wakeup end             |

Other values are reserved or proprietary.

### Channel / Speed (Offset 4)

Encodes both RF channel and protocol speed:

```ts
const channel = byte >>> 5;
const speed = byte & 0x1f;
```

| Speed  | Data Rate | Notes                  |
| ------ | --------- | ---------------------- |
| `0x00` | 9.6 kbps  | Legacy                 |
| `0x01` | 40 kbps   | Improved legacy        |
| `0x02` | 100 kbps  | Standard Z-Wave Plus   |
| `0x03` | Z-Wave LR | Long Range, High Power |

> Determines the **checksum type** used at the end of the frame.

### Region (Offset 5)

Encodes RF region based on Zniffer’s capture settings (not standardized in
Z-Wave spec):

- **EU** = 868.42 MHz
- **US** = 908.42 MHz
- See INS10249 – Z-Wave Zniffer User Guide for full regional codes.

### RSSI (Offset 6)

Received signal strength, in dBm or encoded units:

| Value | Meaning                                                 |
| ----- | ------------------------------------------------------- |
| 0–124 | Signal strength (PTI = native dBm, 500-series = scaled) |
| 125   | No signal detected                                      |
| 126   | Receiver saturated                                      |
| 127   | Invalid or unavailable                                  |

- For **500-series**:  
  `RF_dBm ≈ RSSI * 1.5 - 153.5`
- For **PTI (700/800-series)**: native dBm is used.

### Length Marker (Offsets 7–8)

- **Type**: Little-endian 16-bit
- **Usage**: Optional sanity check (not always used)
- **Contents**: Length of Z-Wave MPDU + checksum

### Z-Wave MPDU (Offset 9+)

This is the raw captured Z-Wave over-the-air frame, including:

| Subfield           | Size     | Notes                            |
| ------------------ | -------- | -------------------------------- |
| **Home ID**        | 4 bytes  | 32-bit Z-Wave network identifier |
| **Source Node ID** | 1 byte   | Originating node                 |
| **Destination ID** | 1 byte   | Target node                      |
| **Payload**        | Variable | Command Class and application    |

Zniffer uses its XML Command Class database to decode this content.

### Checksum (Last 1–2 bytes)

Validates MPDU content integrity:

| Speed           | Type         | Size |
| --------------- | ------------ | ---- |
| ≤ 40 kbps       | XOR checksum | 1    |
| ≥ 100 kbps / LR | CRC-16-CCITT | 2    |

> Only covers MPDU, not Zniffer-specific metadata.

## Additional Notes

- **Encrypted frames** require manual decryption in Zniffer using S0/S2 keys.
- **Frame routing info** (e.g., `xx(yy)`) is parsed and shown by Zniffer UI, not
  present in binary payload.
- **ZLF Data Frames are not command frames** — see
  [ZLF Command Frame Spec](zlf-command.md) for control-level messages.

## Summary

- Starts with `0x21` message type.
- Captures Z-Wave RF frames with full MAC-level payload.
- Includes RF environment metadata: channel, speed, region, RSSI.
- Ends with speed-dependent checksum.
- Cross-referenced via timestamp and control byte from outer ZLF frame.

## See Also

- [ZLF Specification](../zlf.md)
- [ZLF Command Frame](zlf-command.md)
- [ZlfReader](ZlfReader.md)
- INS10249 – Z-Wave Zniffer User Guide
