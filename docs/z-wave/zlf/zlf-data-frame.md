# ZLF Data Frame Specification

## Overview

A **ZLF Data Frame** is a binary payload used in `.zlf`/`.zwlf` files to
represent a complete **Z-Wave RF transmission**, including both metadata about
the RF environment and the captured **Z-Wave MAC Protocol Data Unit (MPDU)**.
These frames are essential for RF-layer analysis using tools such as Zniffer.
For the outer container (timestamp, control byte, payload length), see the
[ZLF Format Specification](zlf.md).

## Frame Structure

Each ZLF Data Frame consists of three parts:

1. **ZLF Frame Header** – Metadata about the RF environment and basic frame
   properties
2. \*\*\*\* – The raw captured over-the-air MAC-layer frame

## ZLF Frame Header

| Offset | Size    | Field           | Description                                                                |
| -----: | ------- | --------------- | -------------------------------------------------------------------------- |
|      0 | 1 byte  | Message Type    | Constant `0x21` – identifies a Data Frame                                  |
|      1 | 1 byte  | Frame Type      | RF frame type (`0x01` = MAC Data, `0x04` = Beam Start, `0x05` = Beam Stop) |
|      2 | 2 bytes | Reserved        | Always `0x00 0x00` – reserved for alignment or future use                  |
|      4 | 1 byte  | Channel / Speed | Encodes RF channel (bits 7–5) and protocol speed (bits 4–0)                |
|      5 | 1 byte  | Region          | RF region code (Zniffer-specific; e.g., EU, US)                            |
|      6 | 1 byte  | RSSI            | Received Signal Strength Indicator                                         |
|      7 | 2 bytes | Length Marker   | Optional; little-endian 16-bit value = MPDU length + checksum length       |
|      9 | 1 byte  | MPDU Length     | Number of bytes in the MPDU (not including header or checksum)             |

## Z-Wave MAC Protocol Data Unit (MPDU)

### MAC Header (MHR)

This section describes the MAC Header portion (MHR) of a . The header precedes
the payload and FCS and is consistent across all channel configurations,
including Long Range (LR).

| Offset | Size    | Field               | Description                                                     |
| -----: | ------- | ------------------- | --------------------------------------------------------------- |
|      0 | 4 bytes | Home ID             | 32-bit domain identifier (same for all nodes in a network)      |
|      4 | 2 bytes | Source Node ID      | 12-bit node identifier of the sender; encoded as two bytes      |
|      6 | 2 bytes | Destination Node ID | 12-bit node identifier of the receiver (0xFFF = broadcast)      |
|      8 | 1 byte  | Length              | Total length of the MPDU including FCS (Frame Check Sequence)   |
|      9 | 1 byte  | Frame Control       | Contains control flags (Ack Req, Extend, Header Type, Reserved) |
|     10 | 1 byte  | Sequence Number     | 8-bit sequence number for retransmission and deduplication      |
|     11 | 1 byte  | Noise Floor         | Signed RSSI (dBm) measured on the channel when idle             |
|     12 | 1 byte  | TX Power            | Signed transmit power (dBm) of this frame                       |

**Frame Control Field (1 byte):**

| Bits | Field       | Description                                                 |
| ---- | ----------- | ----------------------------------------------------------- |
| 7    | Ack Req     | `1` = Acknowledgment requested; `0` = No acknowledgment     |
| 6    | Extend      | `1` = Header extension present; `0` = No extension          |
| 5..3 | Reserved    | Must be transmitted as 0, ignored on reception              |
| 2..0 | Header Type | `0x1` = Singlecast, `0x3` = Acknowledgment, others reserved |

**Notes:**

- All MPDUs include this header format, regardless of whether they are
  singlecast, broadcast, or acknowledgment frames.
- Broadcasts are encoded as `Header Type = 0x1` with
  `Destination Node ID = 0xFFF`.
- Header extension support is optional and covered separately in the header
  extension specification.

---

Would you like the `zlf-data-frame.md` file updated to reflect this corrected
section?

### Checksum

| Location  | Size         | Type                | Notes                                                           |
| --------- | ------------ | ------------------- | --------------------------------------------------------------- |
| MPDU Tail | 1 or 2 bytes | XOR or CRC-16-CCITT | XOR (1 byte) for ≤40 kbps; CRC-16 (2 bytes) for ≥100 kbps or LR |

- **Covers only the MPDU**, not the ZLF Frame Header.
- **Checksum type is determined by the protocol speed** in the Channel/Speed
  field. XOR for 9.6 and 40 kbps. CRC-16-CCITT for 100 kbps or Long Range (LR).

## Field Details

### Message Type (`0x21`)

- Identifies this payload as a ZLF Data Frame.
- Other message types correspond to command/control frames.

### Frame Type

Indicates the nature of the RF capture:

| Value  | Meaning    | Description                  |
| ------ | ---------- | ---------------------------- |
| `0x01` | MAC Data   | Standard Z-Wave transmission |
| `0x04` | Beam Start | FLiRS wakeup beam start      |
| `0x05` | Beam Stop  | FLiRS wakeup beam stop       |

All other values are reserved.

### Channel / Speed

```ts
const channel = byte >>> 5;
const speed = byte & 0x1f;
```

| Speed Code |      Rate | Description             |
| ---------: | --------: | ----------------------- |
|     `0x00` |  9.6 kbps | Legacy                  |
|     `0x01` |   40 kbps | Improved legacy         |
|     `0x02` |  100 kbps | Z-Wave Plus             |
|     `0x03` | Z-Wave LR | Long Range (high power) |

### Region

Zniffer-specific RF region setting (not part of Z-Wave standard):

- **EU** = 868.42 MHz
- **US** = 908.42 MHz
- See _INS10249 – Zniffer User Guide_ for full list

### RSSI

|   Value | Meaning                                                    |
| ------: | ---------------------------------------------------------- |
| `0–124` | Signal strength (scaled on 500-series, native dBm on 700+) |
|   `125` | No signal detected                                         |
|   `126` | Receiver saturated                                         |
|   `127` | Invalid/unavailable                                        |

- Conversion for 500-series: `RSSI_dBm ≈ RSSI × 1.5 − 153.5`
- For PTI-based 700/800-series: RSSI is already in dBm

### Length Marker

- Little-endian 16-bit
- Often used as a sanity check to match expected length:  
  `Length Marker = MPDU Length + Checksum Length`

### Frame Control

Encodes MAC-level behaviors like:

- Routing mode (single-hop, multi-hop)
- ACK requested/expected
- Frame type and priority

Interpretation of individual bits depends on the Z-Wave MAC specification.

## References

- [ZLF Format Specification](../zlf.md)
- [ZLF Command Frame Specification](zlf-command.md)
- [Zniffer User Guide – INS10249](https://www.silabs.com/documents/public/user-guides/INS10249-Z-Wave-Zniffer-User-Guide.pdf)
