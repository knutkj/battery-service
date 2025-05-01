# Simplicity Studio Z-Wave Zniffer

- **Version described:** 4.69.1 © 2018 Silicon Labs.
- **About:** The Zniffer tool is used to capture and analyze Z-Wave RF
  communication within direct range. It acts as a **passive listener**—frames
  may be missed due to RF conditions, and only traffic within direct radio range
  is captured. Captured data is stored in `.zlf` or `.zwlf` binary files for
  offline inspection.

## Table View

Example capture shown in Zniffer UI:

| Line | Date     | Time         | Speed | RSSI |   C |   Δ |   S |   D | Home       | Data       | Application         | Hex Data                                 |
| ---: | :------- | :----------- | ----: | ---: | --: | --: | --: | --: | :--------- | ---------- | ------------------- | ---------------------------------------- |
|    1 | 22.03.25 | 14:13:34.339 |   40K |   44 |   1 |   0 |   6 |   1 | `C4A815CD` | Singlecast | Basic Set           | `C4A815CD0651010D012001FFCF`             |
|    2 | 22.03.25 | 14:13:34.348 |   40K |   50 |   1 |   9 |   1 |   6 | `C4A815CD` | Ack        |                     | `C4A815CD0113010A0654`                   |
|    3 | 22.03.25 | 14:13:34.655 |   40K |   45 |   1 | 306 |   6 |   1 | `C4A815CD` | Singlecast | Notification Report | `C4A815CD06510213017105000000FF07080088` |

### Column Explanations

- **Line:** Line number in the capture log.
- **Date/Time:** Timestamp (UTC-based) extracted from the ZLF FILETIME format.
- **Speed:** Transmission rate inferred from the RF metadata (9.6/40/100 kbps or
  LR).
- **RSSI:** Signal strength of the frame, as reported by the capturing device.
- **C (Channel):** Logical capture session identifier from ZLF Control byte
  (bits 0–6).
- **Δ (Delta):** Milliseconds since the previous frame (local computation).
- **S (Source):** Source Node ID (extracted from decoded Z-Wave MPDU).
- **S (Destination):** Destination Node ID (extracted from decoded Z-Wave MPDU).
- **Home:** 4-byte Home ID from the Z-Wave MPDU.
- **Data:** Frame delivery type: Singlecast, Broadcast, Multicast, Ack, etc.
  This value is derived from parsed Z-Wave protocol metadata within the MPDU.
- **Application:** Application-level decoding of the Z-Wave command class and
  command, using Zniffer’s XML database.
- **Hex Data:** Raw hex dump of the Z-Wave MPDU, starting with the Home ID.

ℹ️ Only logical data frames are shown—see section on **Logical Data Frames** for
reconstruction rules.

## Details View (for Row #1)

Zniffer provides a decoded breakdown of the Z-Wave frame using its XML-based
Command Class database. Below is a decoded example:

ℹ️ Zniffer uses XML files (Command Classes XML) to interpret and display the
application section. These files are maintained under `Zniffer install dir\xml\`
and can be reloaded if updated.

### Singlecast

- **Home ID:** C4A815CD
- **Source Node ID:** 6
- **Properties1:** 0x51
  - **Header Type:** 0x01
  - **Speed Modified:** true
  - **Low Power:** false
  - **Ack:** true
  - **Routed:** false
- **Properties2:** 0x01
  - **Sequence Number:** 1
  - **Reserved:** false
  - **Source Wakeup Beam 250ms:** false
  - **Wakeup Source Beam 1000ms:** false
  - **SUC Present:** false
- **Length:** 13
- **Destination Node ID:** 1

### Application

#### Command Class Basic ver.2

- Basic Set: Value: 0xFF

#### Command Class Basic ver.1

- Basic Set: Value: 0xFF

## Underlying Data Model: Logical Data Frames

What Zniffer shows in the UI is not always a direct one-to-one representation of
captured physical frames. Many transmissions span multiple physical ZLF frames,
which Zniffer **merges into Logical Data Frames (LDFs)**:

- Each LDF begins with a valid **ZLF Data Frame** (payload[0] = `0x21`)
- Continuation frames immediately following with unrecognized message types are
  appended
- The final LDF timestamp corresponds to the **last physical frame**
- LDFs are the fundamental unit for display, filtering, searching, and
  interpretation in the UI

🔗 Refer to the
[ZLF Logical Data Frame Specification](zlf-logical-data-frame.md) for merging
rules.

## ZLF File Format

Captured data in Zniffer can be stored in `.zlf` or `.zwlf` files. These
contain:

1. **2048-byte static header** (metadata: firmware, frequency, timestamps)
2. **Sequence of frames**:
   - Timestamp (FILETIME)
   - Control byte (direction/session ID)
   - Payload length
   - Payload (Command or Data Frame)
   - Trailing marker byte

ZLF parsing and decoding should follow the frame-level specs:

- [ZLF Specification](zlf.md): Container format.
- [ZLF Data Frame](zlf-data-frame.md): Actual Z-Wave MAC-layer traffic.
- [ZLF Command Frame](zlf-command-frame.md): Tool/device instructions (not RF).

> Zniffer UI displays only **Logical Data Frames**.

## Command Frames

ZLF Command Frames are special payloads (type `0x23`) used to configure the
Zniffer device (e.g. set frequency, start capture). They are not part of the
Z-Wave RF traffic and are **not displayed**.

Examples include:

- `SetFrequency`, `Start`, `Stop`
- `GetVersion`, `GetFrequencyInfo`
- See [ZLF Command Frame Spec](zlf-command-frame.md) for more information.
