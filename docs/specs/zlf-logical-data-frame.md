# ZLF Logical Data Frame Specification

## 1. Purpose

This specification defines how to reconstruct the **logical frames shown as
single rows** in the Simplicity Studio Z-Wave Zniffer tool from the underlying
**ZLF physical frames**. Specifically, it describes how the tool merges payloads
from **multiple ZLF frames**, which appear as one row in the UI.

The goal is to enable developers to:

- Replicate GUI behavior for automated analysis and trace tooling.
- Delay parsing until the **full payload** is assembled.
- Build unit-testable logic with **data-level fidelity** to the GUI.

## 2. Scope

This spec **only covers ZLF frame reassembly prior to payload parsing**. It does
**not** attempt to decode:

- MAC/PHY headers
- Application Command Class fields
- RSSI or metadata fields

Instead, it defines a layer that produces **merged payloads**, suitable for
passing into a parser once enough bytes are available.

## 3. Definitions

| Term                            | Definition                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ZLF Frame**                   | A single frame in a `.zlf` file                                                                                                                              |
| **ZLF Data Frame**              | A ZLF frame which can be identified as a frame of type data from the payload                                                                                 |
| **ZLF Data Continuation Frame** | A ZLF frame that the GUI does **not** show as a separate row, but which **extends the payload** of the preceding frame data frame or data continuation frame |
| **ZLF Data Logical Frame**      | A virtual frame built by merging a data frame with its continuation frames. Corresponds 1:1 with a row in the GUI                                            |

## 4. Concatenation Behavior

### 4.1 Detection Rules

Start a new **logical frame group** when you see a ZLF frame of type `data`.
Then, scan forward and:

- Include all **immediately following** ZLF frames of type `unknown`
- Stop merging when the next frame is **not `unknown`**

These `unknown` frames are called **ZLF Data Continuation Frames**. Their
contents have no standalone meaning; their payload only makes sense **when
appended** to the payloads of the previous frames.

> **No assumptions are made about payload length** — continuation frames may be
> short or long.

### 4.2 Merging Rules

Once a group has been formed:

- **Payload**: Concatenate all `payload` byte arrays in capture order
- **Timestamp**: Taken from the **last frame** in the group
- **Parsing**: Only done _after_ concatenation is complete
- **Other fields**: Disregarded during this phase

## 5. Examples

### Example 1: Single Continuation Frame

| #   | Timestamp    | Type    | Payload (hex)                                |
| --- | ------------ | ------- | -------------------------------------------- |
| 12  | 14:13:34,337 | data    | `2101000021002C21030DC4A815CD0651010D012001` |
| 13  | 14:13:34,339 | unknown | `FFCF`                                       |

→ GUI shows one row with hex data: `C4A815CD0651010D012001FFCF`

- Frame 12 is a `data` frame → start a group
- Frame 13 is `unknown` → continuation
- Merge payloads: GUI extracts from home ID onward
- Timestamp: from frame 13

### Example 2: Multiple Continuation Frames

| #   | Timestamp    | Type    | Payload (hex)                                    |
| --- | ------------ | ------- | ------------------------------------------------ |
| 20  | 14:13:37,182 | data    | `21`                                             |
| 21  | 14:13:37,184 | unknown | `01000002002A21030FC4A815CD0A41010F013003FF0C87` |
| 22  | 14:13:37,185 | unknown | `F3`                                             |

→ GUI shows one row with timestamp = frame 22

- Frame 20 is a `data` frame → group start
- Frames 21 and 22 are `unknown` → merged
- Concatenated payload:  
  `21 01000002002A21030FC4A815CD0A41010F013003FF0C87 F3`
- Timestamp from frame 22

### 6. Output Format

After post-processing, each logical frame includes:

```ts
interface ZlfLogicalDataFrame {
  readonly payload: Buffer; // merged payload
  readonly timestamp: Date; // from last frame in group
  readonly sourceFrames: readonly ZlfFrame[]; // for debugging/reference
}
```

No parsing is performed at this stage. The output is meant to be passed to the
payload parser once the frame is complete.
