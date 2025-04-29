# ZlfReader Specification

## Introduction

`ZlfReader` is a utility class for reading and processing `.zlf` (Z-Wave Log
File) files. It supports structured, efficient, and resilient access to Z-Wave
sniffed traffic recorded by the Silicon Labs Zniffer tool or compatible systems.
`ZlfReader` manages file access, parsing state, and recovery metadata in a way
that enables users to perform controlled reads, seeking, and resumption of work
across service restarts.

The class operates on the principle of controlled, incremental reading of binary
data streams, focusing on maintaining file reading correctness over long-running
operations and interruptions. It supports both static `.zlf` files and files
that grow over time during active Zniffer sessions.

In addition to basic frame extraction capabilities, `ZlfReader` integrates with
a status tracking system that logs detailed information about read sessions,
including start and end times, number of frames processed, and final file
positions. This enables robust recovery strategies and auditable processing
history.

`ZlfReader` is designed for modern asynchronous JavaScript environments, using
Promise-based patterns and Node.js file system primitives for high performance
and clean resource management.

### Silicon Labs Z-Wave Zniffer

A development tool for capturing Z-Wave network communications within direct RF
range and presenting the frames in a graphical user interface. Note that it is a
**passive listener** that can occasionally miss RF communication even from
nearby Z-Wave nodes.

### ZLF Trace File Format

For a detailed explanation of the ZLF file structure, fields, frame composition,
and parsing considerations, refer to the [ZLF Specification](../zlf.md).  
`ZlfReader` adheres to the structure defined there.

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

## API Overview

`ZlfReader` provides a structured, Promise-based interface for incrementally
reading frames from `.zlf` files while maintaining file integrity, correct
positioning, and efficient resource management.

Available methods:

- **`constructor(filePath: string)`:** Creates a new `ZlfReader` targeting the
  specified `.zlf` file. Reading is lazy and performed only when needed.
- **`seek(position: number): Promise<void>`:** Moves the reading cursor to a
  specific byte offset. Future operations continue from this position.
- **`continue(): Promise<void>`:** Resumes reading from the last recorded
  position (persisted in a status file). Falls back to file start if no valid
  status exists.
- **`frame(): Promise<Buffer | null>`:** Reads and resolves with the next
  complete ZLF frame as a `Buffer`. Resolves with `null` if end-of-file is
  reached.
- **`frames(count: number): Promise<Buffer[]>`:** Reads up to `count` frames
  into an array. Resolves early if end-of-file is reached.
- **`skip(count: number): Promise<number>`:** Skips over the next `count` frames
  without returning them.
- **`end(): Promise<void>`:** Safely closes the file stream and releases
  resources. Idempotent.

**Note:** All read operations work at **full frame granularity**. No partial or
raw byte reads are exposed.

## Operations

An **operation** in `ZlfReader` represents an isolated reading behavior, such as
reading a frame, skipping frames, or reading multiple frames sequentially.

Operations:

- Are invoked internally by public methods.
- Manipulate the file stream and internal receive buffer.
- Are stateless between invocations but operate on the shared internal buffer.

### Common Operation Interface

```typescript
interface ZlfReaderOperation {
  run(stream: ReadStream, receiveBuffer: Buffer): Promise<OperationResult>;
}

interface OperationResult {
  receiveBuffer: Buffer; // updated buffer after operation
  output?: any; // operation-specific output (e.g., frames read)
}
```

Operations consume stream chunks, update the receive buffer, and extract results
without managing file opening/closing or error recovery themselves.

## Frame Operation

The **Frame Operation** is responsible for **reading exactly one full ZLF
frame** from the file:

1. **Ensure minimum bytes are buffered:** At least 13 bytes (timestamp + control
   byte + payload length field).
2. **Parse header fields:** (Timestamp, Control byte, Payload length) — format
   fully detailed in [ZLF Specification](../zlf.md).
3. **Calculate complete frame size:** 13 bytes (header) + payload length + 1
   byte (trailing marker).
4. **Ensure full frame is buffered:** Fetch additional chunks if necessary.
5. **Extract and return frame:** When the complete frame is buffered, return it
   as a `Buffer`, and retain any remaining bytes for the next operation.

## Summary

`ZlfReader` is a specialized, incremental, frame-based reader for `.zlf` files
generated by Silicon Labs Zniffer. It enables robust, efficient reading and
recovery of Z-Wave sniffed traffic, fully aligned with modern asynchronous
coding standards and the [ZLF Specification](../zlf.md).
