# Z-Wave MAC Protocol Data Unit (MPDU) Specification

## Definitions

- **PHY (Physical Layer)**: The PHY (Physical Layer) is the lowest layer in the
  Z-Wave protocol stack responsible for modulation, encoding, transmission, and
  reception of data over RF channels, including channel access (CCA), preamble
  generation, and PHY header construction according to the current RF profile.
- **MAC (Medium Access Control) Layer**: The MAC (Medium Access Control) Layer
  is the data link layer in the Z-Wave stack that manages access to the physical
  medium, frame validation, addressing, retransmissions, acknowledgments, and
  construction of MPDUs; it interfaces with both the PHY layer below and higher
  protocol layers above.
- **MPDU (MAC Protocol Data Unit)**: The MPDU (MAC Protocol Data Unit) is the
  complete data unit exchanged between MAC entities and passed to the PHY for
  transmission; it consists of the MAC Header (MHR), optional header extensions,
  MAC Payload (MSDU), and a Frame Check Sequence (FCS).
- **MAC Header (MHR)**: The MAC Header (MHR) is the leading portion of the MPDU
  that contains MAC-layer control information such as Home ID, Source and
  Destination Node IDs, Length, Frame Control, Sequence Number, Noise Floor, and
  TX Power; it ensures proper addressing, frame type identification, and
  link-layer coordination.
- **MAC Payload (MSDU)**: The MAC Payload (MSDU, MAC Service Data Unit) is the
  data carried within the MPDU and delivered to higher layers; it typically
  consists of a Z-Wave Command Class and its parameters, and its structure is
  opaque to the MAC layer.
- **FCS (Frame Check Sequence)**: The FCS (Frame Check Sequence) is an integrity
  checksum appended to the MPDU to detect transmission errors; it is a 1-byte
  XOR checksum for legacy 9.6 kbps and 40 kbps modes, and a 2-byte CRC-16-CCITT
  checksum for 100 kbps and Long Range (LR) modes.

## Layout

```
+-------------------------------------------------------+
|                  MPDU (14-255 bytes)                  |
+----------------+--------------------+-----------------+
| MHR (13 bytes) | MSDU (0-240 bytes) | FCS (1-2 bytes) |
+----------------+--------------------+-----------------+
```

## MAC Header (MHR)

This section describes the MAC Header portion (MHR) of a Z-Wave MAC Protocol
Data Unit (MPDU). The header precedes the MAC Payload and FCS and is consistent
across all channel configurations, including Long Range (LR).

| Offset | Size | Field               | Description                                                     |
| -----: | ---: | ------------------- | --------------------------------------------------------------- |
|      0 |    4 | Home ID             | 32-bit domain identifier (same for all nodes in a network)      |
|      4 |    2 | Source Node ID      | 12-bit node identifier of the sender; encoded as two bytes      |
|      6 |    2 | Destination Node ID | 12-bit node identifier of the receiver (0xFFF = broadcast)      |
|      8 |    1 | Length              | Total length of the MPDU including FCS (Frame Check Sequence)   |
|      9 |    1 | Frame Control       | Contains control flags (Ack Req, Extend, Header Type, Reserved) |
|     10 |    1 | Sequence Number     | 8-bit sequence number for retransmission and deduplication      |
|     11 |    1 | Noise Floor         | Signed RSSI (dBm) measured on the channel when idle             |
|     12 |    1 | TX Power            | Signed transmit power (dBm) of this frame                       |

### Frame Control Field

| Bits | Field       | Description                                                 |
| ---- | ----------- | ----------------------------------------------------------- |
| 7    | Ack Req     | `1` = Acknowledgment requested; `0` = No acknowledgment     |
| 6    | Extend      | `1` = Header extension present; `0` = No extension          |
| 5..3 | Reserved    | Must be transmitted as 0, ignored on reception              |
| 2..0 | Header Type | `0x1` = Singlecast, `0x3` = Acknowledgment, others reserved |
