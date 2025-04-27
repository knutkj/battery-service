# ZLF Frame

## Authoritative reference to read

- **“INS10249 – Z-Wave Zniffer User Guide” (pages 18-19)** – list of all
  frame-list columns and their meanings.  
   ([INS10249: Z-Wave Zniffer User Guide](https://www.silabs.com/documents/public/user-guides/INS10249-Z-Wave-Zniffer-User-Guide.pdf))

That PDF is the only official place Silicon Labs documents these fields.

---

## Column-by-column origin map

| Column (Zniffer GUI)                 | Where the value ultimately comes from                                                                                           | Part of ZLF frame header? | Inside ZLF payload?   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | --------------------- |
| **Line**                             | Just a running row counter added by the GUI                                                                                     | ❌ (GUI only)             | —                     |
| **Date / Time**                      | Derived from the 8-byte FILETIME **timestamp field in the ZLF header**                                                          | ✅                        | —                     |
| **Delta**                            | Calculated by Zniffer = time diff to previous frame (not in file)                                                               | ❌                        | —                     |
| **Speed** (`100 K`, `40 K`, `9.6 K`) | PHY bitrate flag inserted by the sniffer firmware _ahead_ of the RF bytes; stored as a 1-byte meta-tag just before the RF frame | ❌                        | ✅ (metadata prefix)  |
| **RSSI**                             | Same 1-byte meta-tag region (received signal strength)                                                                          | ❌                        | ✅ (metadata prefix)  |
| **Ch** (channel)                     | Same meta-tag region (channel number 0/1/2)                                                                                     | ❌                        | ✅ (metadata prefix)  |
| **Src / Dst / Home**                 | Parsed from the **first bytes of the captured RF frame** (HomeID + SourceID + DestID)                                           | ❌                        | ✅ (inside RF header) |
| **Data**                             | Frame-type classification (Singlecast, Multicast, ACK, etc.) extracted from RF **MAC header bits**                              | ❌                        | ✅                    |
| **Application**                      | Human-readable Z-Wave Command-Class/Command, decoded from the **application layer** inside the RF payload                       | ❌                        | ✅                    |
| **Hex Data**                         | Raw hex dump of the entire captured RF frame (same bytes as in “payload” your code exposes)                                     | ❌                        | ✅                    |

**Key take-aways**

1. **Only the timestamp** (Date/Time) sits in the **ZLF wrapper header**.
2. **Speed / RSSI / Channel** are tiny **metadata fields the firmware prepends**
   to the real RF bytes, so they travel inside the “payload” section of a ZLF
   frame.
3. Everything else (HomeID, Src, Dst, Data, Application, Hex) is parsed from the
   actual Z-Wave RF frame that follows those metadata bytes.
4. `Line` and `Delta` are computed on-the-fly by the Zniffer GUI and never
   stored in the file.

With the user-guide PDF above you can see exact byte layouts and value ranges if
you need to pull Speed/RSSI/Channel out of the payload programmatically.

✅ I read all your provided code carefully.  
Here’s a **summary of what we can now infer about the ZLF payload structure**
based on it:

## Inferred ZLF Frame Payload Specification

After you parse the `.zlf` **frame header** (timestamp, control, length), the
**payload** (inside the frame) conforms to a Zniffer-specific protocol:

| Part                        | Size      | Description                                                                                 | Related code              |
| :-------------------------- | :-------- | :------------------------------------------------------------------------------------------ | :------------------------ |
| **Type**                    | 1 byte    | Zniffer message type: 0x23 = Command frame, 0x21 = Data frame                               | `ZnifferMessageType`      |
| **FunctionType** (optional) | 1 byte    | Only for Command frames (type 0x23); identifies the command (e.g., GetVersion, Start, Stop) | `ZnifferFunctionType`     |
| **Length** (optional)       | 1 byte    | Only for Command frames; payload length                                                     | `ZnifferMessage.parse`    |
| **Payload**                 | Variable  | For Data frames (type 0x21): carries real sniffed Z-Wave RF frames + metadata               | `ZnifferDataMessage.from` |
| **Checksum**                | 1-2 bytes | CRC-8 or CRC-16 checksum, depending on PHY (9.6k, 40k → 1 byte; 100k, LR → 2 bytes)         | `ZnifferDataMessage.from` |

### Structure of the Zniffer **Data** Frame Payload (0x21)

The actual RF-related payload follows this layout:

| Field               | Size                    | Description                                                        |
| :------------------ | :---------------------- | :----------------------------------------------------------------- |
| **FrameType**       | 1 byte                  | 0x01 = normal Z-Wave Data frame, 0x04 = BeamStart, 0x05 = BeamStop |
| **0x00 bytes**      | 2 bytes                 | Always 0x00, 0x00                                                  |
| **Channel & Speed** | 1 byte                  | High 3 bits = Channel, Low 5 bits = Speed                          |
| **Region**          | 1 byte                  | Z-Wave RF region code                                              |
| **RSSI**            | 1 byte                  | Signal strength of captured frame                                  |
| **Control fields**  | Several bytes (depends) | Length byte, header validation                                     |
| **MPDU Payload**    | Variable                | Actual sniffed Z-Wave wireless packet                              |
| **Checksum**        | 1 or 2 bytes            | CRC based on Speed                                                 |

These are parsed by `ZnifferDataMessage.from()`.

### Interpretation based on your original question

- `speed` = parsed from payload byte 3 (low 5 bits).
- `rssi` = parsed from payload byte 5.
- `ch` (channel) = parsed from payload byte 3 (high 3 bits).
- `src`, `dst`, `home` = parsed from MPDU payload (after Zniffer metadata).
- `application`, `data`, `hex data` = parsed by inspecting MPDU fields (depends
  on Z-Wave command class/command ID inside payload).

## Important Notes

- **Zniffer messages** inside `.zlf` are **not pure Z-Wave frames** — they are
  **encapsulated in Zniffer-specific metadata**.
- Only **inside** the payload after metadata stripping you get the **real Z-Wave
  RF frame**.
- For **BeamStart**, **BeamStop**, etc., the payload is special and short (no
  Z-Wave packet inside).
- **Command Frames (type 0x23)** represent control messages exchanged with the
  Zniffer device itself — _they do not contain RF frames_.

## Visual Summary

```text
ZLF frame:
  [timestamp][control][length][ZnifferMessage][trailing byte]

ZnifferMessage (Data):
  [FrameType][00][00][Channel/Speed][Region][RSSI][MPDU+ControlFields][Checksum]

MPDU:
  [Home ID][Src ID][Dst ID][Cmd Classes etc.]
```
