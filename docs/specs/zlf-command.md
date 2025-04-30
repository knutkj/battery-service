# ZLF Command Frame Specification

## Overview

A **ZLF Command Frame** is a type of payload found in `.zlf` files, as described
in the [ZLF Specification](../zlf.md). These frames represent communication from
the Zniffer **software to the hardware interface** or vice versa. They are used
for configuring, controlling, or querying the Zniffer capture device and do not
represent Z-Wave RF traffic.

> Command Frames are typically not shown in the Zniffer UI unless the “All Frame
> Types” view is enabled.

## Payload Structure

| Field             | Offset | Size     | Description                                |
| ----------------- | ------ | -------- | ------------------------------------------ |
| **Message Type**  | 0      | 1 byte   | Constant `0x23` = Command Frame identifier |
| **Function Type** | 1      | 1 byte   | Identifies the specific command or request |
| **Length**        | 2      | 1 byte   | Number of following bytes in payload       |
| **Payload**       | 3+     | Variable | Optional, meaning depends on Function Type |

### Message Type (`0x23`)

- Indicates this frame is a **Command Frame**.
- Always at byte offset `0`.

### Function Type

Specifies the operation. Values known from Zniffer v4+ include:

| Code   | Command Name             | Description                            |
| ------ | ------------------------ | -------------------------------------- |
| `0x01` | `GetVersion`             | Request firmware version from device.  |
| `0x02` | `SetFrequency`           | Change RF frequency for capture.       |
| `0x03` | `GetFrequencies`         | Request list of supported frequencies. |
| `0x04` | `Start`                  | Start capture session.                 |
| `0x05` | `Stop`                   | Stop capture session.                  |
| `0x06` | `SetLRChannelConfig`     | Configure long-range channel settings. |
| `0x07` | `GetLRChannelConfigs`    | Retrieve available long-range configs. |
| `0x08` | `GetLRRegions`           | Request LR region info.                |
| `0x0E` | `SetBaudRate`            | Adjust serial communication speed.     |
| `0x13` | `GetFrequencyInfo`       | Query current frequency and region.    |
| `0x14` | `GetLRChannelConfigInfo` | Fetch extended config for LR channel.  |

Other codes may exist and should be preserved when reading unknown values.

### Length

- Indicates how many bytes of actual command payload follow.
- Starts at byte offset `3`.
- **MUST match** the size of the trailing payload for successful parsing.

### Payload

- Contents are **function-specific**.
- Many commands (like `Start`/`Stop`) carry no payload (`Length = 0`).
- Others (e.g., `SetFrequency`) carry values such as region or channel.

Examples:

- `SetFrequency` payload might be:  
  `0x02` → Select EU frequency  
  `0x00` → Select US frequency

## Parsing Strategy

```ts
if (payload[0] !== 0x23) throw Error("Not a Command Frame");

const funcType = payload[1];
const length = payload[2];
const data = payload.slice(3, 3 + length);
```

- Unknown `funcType` values are valid.
- Command frames should not be interpreted as Z-Wave traffic.

## Practical Notes

- Appears when using PC Controller features like port detection, frequency
  switching, etc.
- May be useful when simulating Zniffer output or emulating capture via
  software.
- These frames are typically generated only once during startup, configuration,
  or shutdown.

## Summary

- ZLF Command Frames begin with `0x23`.
- They define control or configuration commands between Zniffer software and
  hardware.
- The payload is short and tightly scoped to a single purpose.
- No Z-Wave traffic is carried in these frames.
