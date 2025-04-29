# ZLF Command Frame Specification

## Overview

A **ZLF Command Frame** is a type of payload found in `.zlf` files, as described
in the [ZLF Specification](../zlf.md). It represents internal communication
between the Zniffer software and the Zniffer device during a capture session.
Command frames are used for control and configuration purposes (e.g., starting
capture, setting frequency, requesting status).

## Payload Structure (Command Frame)

| Field             | Offset | Size     | Description                            |
| ----------------- | ------ | -------- | -------------------------------------- |
| **Message Type**  | 0      | 1 byte   | Must be `0x23` (Command Frame marker). |
| **Function Type** | 1      | 1 byte   | Identifies the specific command.       |
| **Length**        | 2      | 1 byte   | Number of payload bytes that follow.   |
| **Payload**       | 3+     | Variable | Function-specific parameters or data.  |

### Message Type (`0x23`)

- Constant `0x23`, identifying the frame as a **Command Frame**.
- Always the first byte of the Command Frame payload.

### Function Type

Specifies the type of control operation.

| Code | Meaning                |
| ---- | ---------------------- |
| 0x01 | GetVersion             |
| 0x02 | SetFrequency           |
| 0x03 | GetFrequencies         |
| 0x04 | Start                  |
| 0x05 | Stop                   |
| 0x06 | SetLRChannelConfig     |
| 0x07 | GetLRChannelConfigs    |
| 0x08 | GetLRRegions           |
| 0x0E | SetBaudRate            |
| 0x13 | GetFrequencyInfo       |
| 0x14 | GetLRChannelConfigInfo |

Unknown or vendor-specific function codes are allowed and should not cause
parsing failures.

### Length

- Indicates how many bytes of actual payload data immediately follow.
- Must match the real number of payload bytes for correct parsing.

### Payload

- **Meaning depends on the Function Type**.
- For simple control operations (e.g., Start, Stop), it may be empty
  (`Length = 0`).
- For more complex commands (e.g., SetFrequency), it carries specific
  parameters.
- Parsing the payload is **function-specific** and usually optional unless
  implementing full Zniffer device emulation.

## Parsing Strategy

1. Confirm **payload[0] === 0x23**.
2. Read **Function Type** (payload[1]).
3. Read **Length** (payload[2]).
4. Read exactly `Length` bytes starting at `payload[3]`.
5. Optionally, interpret the payload depending on the Function Type.

## Summary

- A **ZLF Command Frame** is identified by `payload[0] === 0x23`.
- It contains a control operation indicator and optional parameters.
- Payload semantics vary depending on Function Type.
- Command frames do **not** encapsulate Z-Wave RF frames; they relate to Zniffer
  management.
