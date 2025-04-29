# README

## About

See [`docs/project/poc.md`](/docs/project/poc.md) for now.

## Specifications

- **Z-Wave:**
  - [Z-Wave Log File (ZLF)](docs/specs/zlf.md): Defines the binary structure of
    .zlf files, including a static 2048-byte header and a sequence of
    timestamped frames containing opaque payloads.
    - [ZLF Command Frame](docs/specs/zlf-command.md): Specifies the structure of
      a Command Frame payload, representing control messages between the Zniffer
      software and device, identified by function types and optional parameters.
    - [ZLF Data Frame](docs/specs/zlf-data.md): Specifies the structure of a
      Data Frame payload, which includes Zniffer capture metadata (channel,
      speed, region, RSSI) and the raw Z-Wave MPDU extracted from the air.
- **Code:**
  - [ZlfReader](docs/specs/ZlfReader.md): Describes the ZlfReader utility class
    that provides incremental, asynchronous reading of full frames from .zlf
    files, with position tracking and recovery capabilities.

## Tools

- **Unit testing:** This project uses Node.js's built-in test runner
  (`node:test`) for unit testing. It requires no additional dependencies. To
  learn how to write and run tests in this project, see
  [the full testing guide](./docs/tools/unit-testing.md).
