# ZLF Logical Data Frame Specification

## 1. Purpose

This specification defines how to reconstruct **Logical Data Frames (LDFs)**
from raw `.zlf` files captured by the the Simplicity Studio Z-Wave Zniffer tool.
Each Logical Data Frame corresponds to a **complete and meaningful payload**, as
shown in the tool, and is formed by merging a base data frame with its
continuation frames. The goal is to enable developers to:

- Reconstruct the **same unit of information** shown per row in the Zniffer UI.
- Ensure that **payload parsing is only attempted** after the full logical frame
  is assembled.
- Provide a **robust foundation** for extracting and analyzing Z-Wave
  protocol-level data from Zniffer traces.

## 2. Scope

This spec focuses exclusively on **payload assembly** for Data Frames. It does
**not** define:

- MAC/PHY-level dissection (see
  [ZLF Data Frame Specification](zlf-data-frame.md)).
- Command Class parsing (see Zniffer’s XML decoder or S2/S0 decryption tools).
- Visualization or GUI decoration (e.g. routing info).

## 3. Terminology and Definitions

| Term                            | Description                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **ZLF File**                    | A binary capture file in `.zlf` or `.zwlf` format. See [ZLF Format](zlf.md).                                                                |
| **ZLF Frame**                   | A unit of binary data within a ZLF file; includes timestamp, type, payload.                                                                 |
| **ZLF Data Frame**              | A ZLF frame starting with `0x21` (Message Type = Data). See [ZLF Data Frame Spec](zlf-data-frame.md).                                       |
| **ZLF Data Continuation Frame** | A ZLF frame of type `unknown` (Message Type not known) that extends a preceding Data Frame.                                                 |
| **ZLF Logical Data Frame**      | A virtual frame built by merging one `data` frame with all its subsequent `unknown` continuation frames. Matches one row in the Zniffer UI. |

> Note: Command Frames (starting with `0x23`) are excluded. See
> [ZLF Command Frame Spec](zlf-command-frame.md).

## 4. Frame Grouping and Merging Rules

### 4.1 Grouping Logic

A new Logical Data Frame (LDF) starts when a ZLF frame of type `data` is
encountered (`Message Type = 0x21` at byte 0 of payload).

All immediately following `unknown`-type ZLF frames are considered
**continuation frames** and are included in the LDF.

Stop collecting continuation frames when the next frame is of any type other
than `unknown`.

### 4.2 Merging Behavior

For a given group:

- **Payload**: Concatenate the `payload` field from each frame in order of
  appearance.
- **Timestamp**: Taken from the **last** frame in the group.
- **Source Frames**: Retain list of original ZLF frames.

## 5. Output Interface

```ts
interface ZlfLogicalDataFrame {
  readonly payload: Buffer; // Merged payload (MPDU + checksum)
  readonly timestamp: Date; // Taken from last frame in group
  readonly sourceFrames: readonly ZlfFrame[]; // Ordered list of frames merged
}
```

Parsing the application payload (e.g., Command Classes) should occur _after_
this logical reassembly.

## 6. Extraction Examples

### Example 1: Single Continuation

| #   | Type    | Payload (hex)                                |
| --- | ------- | -------------------------------------------- |
| 12  | data    | `2101000021002C21030DC4A815CD0651010D012001` |
| 13  | unknown | `FFCF`                                       |

→ `payload = 2101000021002C21030DC4A815CD0651010D012001FFCF`  
→ `timestamp = frame 13`

### Example 2: Multiple Continuations

| #   | Type    | Payload (hex)                                    |
| --- | ------- | ------------------------------------------------ |
| 20  | data    | `21`                                             |
| 21  | unknown | `01000002002A21030FC4A815CD0A41010F013003FF0C87` |
| 22  | unknown | `F3`                                             |

→ `payload = 2101000002002A21030FC4A815CD0A41010F013003FF0C87F3`  
→ `timestamp = frame 22`

## 7. References

- [Z-Wave Log File Format (ZLF) Specification](zlf.md)
- [ZLF Data Frame Specification](zlf-data-frame.md)
- [ZLF Command Frame Specification](zlf-command-frame.md)
- [Simplicity Studio Z-Wave Zniffer](../tools/zniffer.md)
- [INS10249 – Z-Wave Zniffer User Guide]
