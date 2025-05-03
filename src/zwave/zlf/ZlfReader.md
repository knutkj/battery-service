# ZlfReader Specification

## Introduction

`ZlfReader` is a low-level, asynchronous utility for reading `.zlf` and `.zwlf`
binary trace files produced by
[the Simplicity Studio Z-Wave Zniffer tool](../tools/zniffer.md). It enables
incremental, frame-accurate access to Z-Wave capture data.

The `ZlfReader` provides:

- Sequential, resumable access to raw ZLF frames.
- Integration points for higher-level tooling to perform semantic decoding.

It is designed for Node.js environments using the native `fs` module and
`Buffer` APIs.

## Node.js APIs Used

`ZlfReader` relies on a minimal, focused set of Node.js core APIs to balance
performance, clarity, and simplicity:

- **`fs.createReadStream`:** Creates a stream that reads data incrementally from
  a file without loading it fully into memory. `ZlfReader` uses
  `for await (const chunk of stream)` to consume data asynchronously.
- **`fs.promises.readFile`** and **`fs.promises.writeFile`:** Promise-based APIs
  for reading and writing small metadata/status files fully into memory.
- **`Buffer`:** Node.js binary data structure. `ZlfReader` manages an internal
  receive buffer to assemble complete ZLF frames from potentially fragmented
  file reads.

By relying only on these APIs, `ZlfReader` remains lightweight, efficient, and
easy to maintain.

## ZLF Format Overview

ZLF files are structured as:

- 2048-byte static header (must be skipped).
- Sequence of timestamped frames, each with:
  - 8-byte Windows FILETIME timestamp.
  - 1-byte control field (direction + session ID).
  - 4-byte little-endian payload length.
  - Payload (Command Frame `0x23`, Data Frame `0x21`, or continuation).
  - 1-byte trailing marker (ignored).

Refer to the full [ZLF Format Specification](zlf.md) for field definitions.

## Frame Types

- **Command Frame (`0x23`)**: Tool/device communication (e.g., Start, Stop,
  SetFrequency).
- **Data Frame (`0x21`)**: Captured RF data (Z-Wave MAC frames).
- **Continuation Frame**: No known type byte; treated as a continuation of the
  previous Data Frame.
- **Logical Data Frame (LDF)**: One base Data Frame + zero or more
  continuations, merged into a complete RF transmission.

## Functional Abstraction: Operation Interface

All frame reading behaviors are encapsulated as operations conforming to a pure
functional interface:

```ts
type ZlfReaderOperation = (args: {
  stream: ReadStream;
  buffer: Buffer;
}) => Promise<{
  buffer: Buffer;
  output?: any;
}>;
```

This interface:

- Accepts a stream and current receive buffer.
- Produces an updated buffer and optional result.
- Is stateless between invocations.

Examples include reading a frame or skipping N frames.

## API Surface

```ts
class ZlfReader {
  constructor(filePath: string);
  seek(position: number): Promise<void>;
  continue(): Promise<void>;
  frame(): Promise<Buffer | null>;
  frames(count: number): Promise<Buffer[]>;
  skip(count: number): Promise<number>;
  end(): Promise<void>;
}
```

- `frame()`: Returns next raw ZLF frame (`Buffer`) including timestamp, control,
  and payload.
- `continue()`: Restores position from persisted metadata (optional).
- All methods handle buffer management and chunking transparently.

## Operational Semantics

All read methods operate at full frame granularity. Partial or mid-payload reads
are not supported. Internal buffering ensures correctness across chunk
boundaries. Frames are decoded lazily and only when fully assembled.

## Compliance

This specification adheres to:

- [ZLF Format Specification](zlf.md)
- [ZLF Data Frame Specification](zlf-data-frame.md)
- [ZLF Command Frame Specification](zlf-command-frame.md)
- [ZLF Logical Data Frame Specification](zlf-logical-data-frame.md)
