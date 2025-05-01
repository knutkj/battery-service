# ZLF Command Frame Specification

## Overview

A **ZLF Command Frame** is a payload type found in `.zlf` and `.zwlf` files as
defined in the [ZLF Specification](zlf.md). These frames represent **control and
configuration communication between the Zniffer software and the hardware
capture device** (e.g., USB sniffer, WSTK board). Command frames are not related
to actual Z-Wave RF communication and are used internally for operations like
setting frequency, starting/stopping capture, or retrieving device information.

> 🔍 Command frames are only visible in the Zniffer UI if “All Frame Types” is
> enabled.

## Identification

| Field            | Offset | Value  | Description                            |
| ---------------- | ------ | ------ | -------------------------------------- |
| **Message Type** | 0      | `0x23` | Constant identifier for Command Frames |

## Frame Format

| Field             | Offset | Size     | Description                                |
| ----------------- | ------ | -------- | ------------------------------------------ |
| **Message Type**  | 0      | 1 byte   | `0x23` fixed value                         |
| **Function Type** | 1      | 1 byte   | Identifies the specific command or request |
| **Length**        | 2      | 1 byte   | Number of following bytes in payload       |
| **Payload**       | 3+     | variable | Optional parameters (function-specific)    |

### Function Types

Known function types (from Zniffer v4+) include:

| Code   | Name                     | Description                                         |
| ------ | ------------------------ | --------------------------------------------------- |
| `0x01` | `GetVersion`             | Query firmware version of the Zniffer device        |
| `0x02` | `SetFrequency`           | Set RF frequency or region                          |
| `0x03` | `GetFrequencies`         | Get list of supported frequency codes               |
| `0x04` | `Start`                  | Begin RF capture                                    |
| `0x05` | `Stop`                   | Stop RF capture                                     |
| `0x06` | `SetLRChannelConfig`     | Configure Long-Range channel settings               |
| `0x07` | `GetLRChannelConfigs`    | Retrieve available Long-Range channel configs       |
| `0x08` | `GetLRRegions`           | Retrieve info about Long-Range regions              |
| `0x0E` | `SetBaudRate`            | Change the serial communication baud rate           |
| `0x13` | `GetFrequencyInfo`       | Get current frequency, region, and channel info     |
| `0x14` | `GetLRChannelConfigInfo` | Detailed info for selected LR channel configuration |

Additional function types may be added by future Zniffer versions. Unknown codes
should not result in a decoding failure.

## Payload Details

- **Length field** at byte offset 2 must match the number of bytes in the
  command payload that follow.
- Most command frames have small or empty payloads (e.g., `Start`, `Stop` have
  `Length = 0`).
- Some (like `SetFrequency`) use 1-byte payloads to select a region or
  frequency.

### Example: SetFrequency

Payload example to change region:

```plaintext
0x23 0x02 0x01 0x02   // SetFrequency command, EU region (code 0x02)
```

## Parsing Strategy (Pseudocode)

```ts
if (payload[0] !== 0x23) throw Error("Not a Command Frame");

const funcType = payload[1];
const length = payload[2];
const data = payload.slice(3, 3 + length);
```

## Notes

- Command Frames provide operational context (port setup, frequency switch,
  session control).
- They are logged at startup, during manual actions (via GUI), or CLI session
  control.
- Never treated as Z-Wave RF traffic.
- May help with offline Zniffer trace emulation or debugging tool behavior.

## Summary

- Begins with `0x23` and used only for tool control/config.
- Encapsulates host ↔ capture device commands.
- Function type determines behavior.
- Only visible if Zniffer UI explicitly enables all frame types.
- Useful for understanding capture session state and device setup.
