# Z-Wave MAC Protocol Data Unit (MPDU) Specification

The Z-Wave MAC Protocol Data Unit (MPDU), as defined in the ITU-T G.9959
specification, is the core transmission unit exchanged between nodes at the MAC
layer in a Z-Wave network. It encapsulates the payload (MSDU) along with a
compact, structured MAC Header (MHR) and a trailing MAC Footer (MFR) for
integrity checking. The MPDU format is optimized for low-bandwidth, low-power
communication and supports various addressing modes, including singlecast,
multicast, and broadcast, with optional acknowledgment and routing features
embedded in control flags. Its size and structure vary slightly depending on
channel configuration and data rate, but always respect the strict upper bounds
imposed by the physical layer (64 bytes at low rates, 170 bytes at high rate).
This efficient framing ensures reliable and interoperable communication in
dense, constrained wireless environments.

## Data Rates and Channel Configurations

Z-Wave networks, as defined by the ITU-T G.9959 specification, support three
standardized data rates and multiple channel configurations designed to optimize
communication for different regional and application requirements. These
configurations influence the maximum frame size, modulation scheme, latency, and
power efficiency.

### Supported Data Rates

Z-Wave defines three PHY data rates:

| Data Rate |   Bit Rate | Symbol Rate | Modulation    | Coding     | Max Frame Size |
| --------- | ---------: | ----------: | ------------- | ---------- | -------------: |
| R1        | 9.6 kbit/s |  19.2 kbaud | FSK           | Manchester |       64 bytes |
| R2        |  40 kbit/s |    40 kbaud | FSK           | NRZ        |       64 bytes |
| R3        | 100 kbit/s |   100 kbaud | GFSK (BT=0.6) | NRZ        |      170 bytes |

- **R1** and **R2** operate using Frequency Shift Keying (FSK); R1 uses
  Manchester encoding for symbol reliability, while R2 uses Non-Return to Zero
  (NRZ).
- **R3** uses Gaussian FSK for higher efficiency and supports a larger MAC frame
  (MPDU) size, enabling up to 158 bytes of payload.

### Channel Configurations

A Z-Wave transceiver can be configured to operate using one, two, or three
channels. The selected configuration dictates the number of available
frequencies and supported data rates:

| Config | Channels Used | Supported Data Rates            |
| -----: | ------------- | ------------------------------- |
|      1 | Ch B          | R1, R2                          |
|      2 | Ch A, Ch B    | R3 (Ch A), R1/R2 (Ch B)         |
|      3 | Ch A, B, C    | R3 (Ch A), R2 (Ch B), R1 (Ch C) |

These configurations enable flexible deployment:

- **Single-channel** mode prioritizes simplicity and low-cost hardware.
- **Two-channel** mode allows devices to switch between high-speed (R3) and
  lower-speed (R1/R2) communication.
- **Three-channel** mode maximizes compatibility across node types (e.g.,
  battery-powered FL vs always-on AL nodes).

## MPDU Layout

```
+---------------------------------------------------------+
|                    MPDU (10-170 bytes)                  |
+------------------+--------------------+-----------------+
| MHR (9-39 bytes) | MSDU (0-158 bytes) | FCS (1-2 bytes) |
+------------------+--------------------+-----------------+
```

## MPDU Layout Size Limits

| Element | Contents                   |  Min |   Max | Source of limit                    |
| ------- | -------------------------- | ---: | ----: | ---------------------------------- |
| MHR     | Address & control fields   |  9 B |  39 B | Varies by frame type and channel   |
| MSDU    | Payload from higher layers |  0 B | 158 B | Limited by available frame space   |
| MFR     | Frame integrity check      |  1 B |   2 B | Depends on data rate               |
| MPDU    | Complete MAC frame         | 10 B | 170 B | Limited by physical layer capacity |

### MHR (MAC Header)

The MAC header includes fields for addressing, network domain, frame control,
and (in some cases) a multicast bitmask. Its size varies:

- **Minimum** (9 bytes): A basic singlecast frame with compact addressing and
  control.
- **Maximum** (39 bytes): A multicast frame that includes a full 29-byte
  recipient mask.

### MSDU (MAC Service Data Unit)

This is the payload being transported:

- **Minimum**: 0 bytes — for example, ACK frames that carry no data.
- **Maximum**: Determined by how much room is left after the header and footer.
  In ideal cases:
  - At low data rates (R1/R2), the payload can be up to \~54 bytes for
    singlecast.
  - At the highest data rate (R3), up to \~158 bytes can be used for data.

### MFR (MAC Footer)

Used for error checking:

- **1 byte** when using an 8-bit checksum (low data rates).
- **2 bytes** when using a 16-bit CRC (high data rate, R3).

### MPDU (MAC Protocol Data Unit)

This is the complete data frame sent over the air, including the header,
payload, and footer.

- **Minimum** size (ACK frame): 10–12 bytes depending on configuration.
- **Maximum** size:

  - 64 bytes at low data rates (R1/R2).
  - 170 bytes at the highest rate (R3).

Let me know if you want a visual version of this or an example frame layout.

## MAC Header (MHR)

The MAC Header (MHR) in the ITU-T G.9959 protocol is a compact, variable-format
structure that precedes every MAC Protocol Data Unit (MPDU) and provides
essential metadata for addressing, control, and routing within a low-power,
short-range wireless network. It typically includes a domain identifier (home
ID), source and destination node identifiers (node ID), frame control flags
(e.g., for acknowledgments, routing, or power mode), and a sequence number for
tracking transmission order. The specific structure of the MHR depends on the
type of communication—singlecast, multicast, broadcast, or acknowledgment—and is
optimized to minimize overhead while supporting mesh networking, device
inclusion, and robust communication across overlapping radio domains.

## Singlecast MHR Channel 1/2

| Offset | Size | Field               | Description            |
| -----: | ---: | ------------------- | ---------------------- |
|      0 |  4 B | Home ID             | Domain identifier      |
|      4 |  1 B | Source node ID      | Address of sender node |
|      5 |  2 B | Frame control       | Bitfield               |
|      7 |  1 B | Length              | MPDU length in bytes   |
|      8 |  1 B | Destination node ID | Address of target node |

### Frame Control Field

#### First Byte

| Offset | Length | Name           | Description                     |
| -----: | -----: | -------------- | ------------------------------- |
|      0 |      1 | Routed         | Routed via intermediate node    |
|      1 |      1 | ACK Requested  | Request acknowledgment          |
|      2 |      1 | Low-Power      | Sent at FL node TX power        |
|      3 |      1 | Speed Modified | Sent at reduced data rate       |
|      4 |      4 | Header Type    | Frame type (`0x1` = singlecast) |

#### Second Byte

| Offset | Length | Name            | Description           |
| -----: | -----: | --------------- | --------------------- |
|      0 |      1 | Reserved        | Always `0`            |
|      1 |      2 | Beaming Info    | Beaming mode          |
|      3 |      1 | Reserved        | Always `0`            |
|      4 |      4 | Sequence Number | Frame sequence number |

#### Field Descriptions

- **Routed:** Indicates whether the frame was relayed by an intermediate node
  rather than sent directly from the source. When set, it signals that the frame
  has been forwarded within the mesh network, allowing receivers to distinguish
  routed traffic from direct transmissions.
- **ACK Requested:** Specifies whether the sender requests an acknowledgment
  from the receiver. When set, the receiving node must respond with an ACK frame
  if the message is received correctly. This mechanism ensures reliable delivery
  by enabling retransmissions when no acknowledgment is received.
- **Low-Power**: Indicates that the frame was transmitted using reduced power
  suitable for communication with frequently listening (FL) nodes. When set, it
  informs the receiver that the sender is a low-power device and that any
  acknowledgment must also be transmitted at low power, ensuring reciprocity in
  FL-to-FL communication.
- **Speed Modified**: Signals that the frame was transmitted at a lower data
  rate than the receiver is capable of handling. When set, it allows devices to
  dynamically reduce transmission speed—typically for compatibility, range
  extension, or communication with older or less capable nodes—without
  renegotiating link settings.
- **Header Type:** Defines the overall frame category, determining how the frame
  should be interpreted and processed. It distinguishes between types such as
  singlecast (`0x1`), multicast (`0x2`), and acknowledgment (`0x3`), with
  additional values reserved for future use. This classification is essential
  for correctly parsing the rest of the MPDU and handling routing, delivery, and
  response behavior.
- **Beaming Info:** Encodes how the frame is repeated for beamforming purposes,
  primarily to reach sleeping nodes that periodically wake to receive beamed
  messages. The values indicate whether no beaming (`00`), short continuous
  beaming (`01`), or long continuous beaming (`10`) is used, allowing the sender
  to ensure that the message is available during the target node’s listening
  window.
- **Sequence Number:** A 4-bit value used to uniquely identify the frame within
  a short time window. It enables the receiver to detect duplicates and match
  acknowledgment (ACK) frames to their corresponding transmissions. The sender
  increments this value with each new frame, while the receiver echoes it back
  in the ACK, supporting reliable, low-overhead communication in constrained
  wireless environments.
