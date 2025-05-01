# README

## About

See [`docs/project/poc.md`](/docs/project/poc.md) for now.

## Specifications

- **Z-Wave:**
  - **[Z-Wave Log File Format (ZLF) Specification)](docs/specs/zlf.md):**
    Defines the binary structure of .zlf files, including a static 2048-byte
    header and a sequence of timestamped frames containing opaque payloads.
    - **[ZLF Command Frame Specification](docs/specs/zlf-command-frame.md):**
      Specifies the structure of a Command Frame payload, representing control
      messages between the Zniffer software and device, identified by function
      types and optional parameters. -
    - **[ZLF Data Frame Specification](docs/specs/zlf-data-frame.md):**
      Specifies the structure of a Data Frame payload, which includes Zniffer
      capture metadata (channel, speed, region, RSSI) and the raw Z-Wave MPDU
      extracted from the air. -
    - **[ZLF Logical Data Frame Specification](docs/specs/zlf-logical-data-frame.md):**
      Defines how to reconstruct **Logical Data Frames (LDFs)**. Each LDF
      represents a complete, semantically meaningful unit of Z-Wave traffic.
- **Code:**
  - **[ZlfReader](docs/specs/ZlfReader.md):** Describes the ZlfReader utility
    class that provides incremental, asynchronous reading of full frames from
    .zlf files, with position tracking and recovery capabilities.

## Tools

- [**Simplicity Studio Z-Wave Zniffer**](docs/tools/zniffer.md): Used to capture
  and analyze Z-Wave RF communication within direct range.
- **Unit testing:** This project uses Node.js's built-in test runner
  (`node:test`) for unit testing. It requires no additional dependencies. To
  learn how to write and run tests in this project, see
  [the full testing guide](docs/tools/unit-testing.md).
