# ZlfReader Specification

## Introduction

`ZlfReader` is a utility class for reading and processing `.zlf` (Z-Wave Log
File) files. It supports structured, efficient, and resilient access to Z-Wave
sniffed traffic recorded by the Silicon Labs Zniffer tool or compatible systems.
`ZlfReader` manages file access, parsing state, and recovery metadata in a way
that enables users to perform controlled reads, seeking, and resumption of work
across service restarts.

The class operates on the principle of controlled, incremental reading of binary
data streams, with a focus on maintaining file reading correctness over
long-running operations and interruptions. It supports both static `.zlf` files
and files that grow over time during active Zniffer sessions.

In addition to basic frame extraction capabilities, `ZlfReader` integrates with
a status tracking system that logs detailed information about read sessions,
including start and end times, number of frames processed, and final file
positions. This enables robust recovery strategies and auditable processing
history.

`ZlfReader` is designed for modern asynchronous JavaScript environments, using
Promise-based patterns and Node.js file system primitives for high performance
and clean resource management.

### Silicon Labs Z-Wave Zniffer

A development tool for capturing the Z-Wave network communications within direct
Z-Wave RF range and presenting the frames in a graphical user interface. Note
please, that it is a passive listener that can occasionally miss some RF
communication even from Z-Wave nodes that are within direct range.

### ZLF Trace File Format

The **ZLF Trace File Format** (Z-Wave Log File Format) is the standard format
used by Silicon Labs Zniffer tool versions 4.x and newer. It records captured
Z-Wave over-the-air frames into a binary file for later analysis.

Each `.zlf` file consists of:

- A **2048-byte static header** containing session metadata.
- A sequence of **frames**, each structured as:
  - 8-byte timestamp (FILETIME ticks)
  - 1-byte control (direction + session ID)
  - 4-byte little-endian payload length
  - N-byte captured payload
  - 1-byte end marker

Frames represent **individual RF capture events**, not host-controller Serial
API communications.

## Node.js APIs Used

`ZlfReader` is built on a minimal, focused set of Node.js core APIs to balance
performance, clarity, and simplicity. Understanding these APIs is essential for
grasping how `ZlfReader` interacts with the file system and processes binary
data:

- **`fs.createReadStream`:** Creates a stream that reads data incrementally from
  a file without loading it fully into memory. `ZlfReader` uses
  `for await (const chunk of stream)` to consume data asynchronously.

- **`fs.promises.readFile`** and **`fs.promises.writeFile`:** Promise-based APIs
  used for reading and writing small status metadata files fully into memory.
  They manage persisted reading progress between runs.

- **`Buffer`:** Node.js binary data structure. `ZlfReader` manages an internal
  receive buffer to assemble complete ZLF frames from potentially fragmented
  file reads.

By relying only on these APIs, `ZlfReader` remains lightweight, efficient, and
easy to maintain.

## API Overview

`ZlfReader` provides a structured, Promise-based interface for incrementally
reading frames from Z-Wave Log Files (`.zlf`). It ensures file integrity,
correct positioning, and efficient resource management.

Available methods:

- **`constructor(filePath: string)`:** Creates a new `ZlfReader` targeting the
  specified `.zlf` file. Reading is lazy and performed only when needed.

- **`seek(position: number): Promise<void>`:** Moves the reading cursor to a
  specific byte offset. Future operations continue from this position.

- **`continue(): Promise<void>`:** Resumes reading from the last recorded
  position in a status file associated with the `.zlf` file. Falls back to the
  start of the file if no valid status exists.

- **`frame(): Promise<Buffer | null>`:** Reads and resolves with the next
  complete ZLF frame as a `Buffer`. Resolves with `null` if the end of file is
  reached.

- **`frames(count: number): Promise<Buffer[]>`:** Reads up to `count` frames
  into an array. Resolves early if the end of file is reached.

- **`skip(count: number): Promise<number>`:** Skips over the next `count` frames
  without returning them. Resolves with the number actually skipped.

- **`end(): Promise<void>`:** Safely closes the file stream and releases
  resources. Idempotent.

All read operations operate at **full frame granularity**. No raw byte reads are
exposed directly.

## Operations

An **operation** in `ZlfReader` represents an isolated reading behavior, such as
reading a frame, skipping frames, or reading multiple frames sequentially.

Operations:

- Are invoked internally by public methods.
- Manipulate the stream and receive buffer.
- Are stateless between invocations but work on the mutable internal state.

### Common Operation Interface

```typescript
interface ZlfReaderOperation {
  run(stream: ReadStream, receiveBuffer: Buffer): Promise<OperationResult>;
}

interface OperationResult {
  receiveBuffer: Buffer; // updated buffer after operation
  output?: any; // operation-specific output, such as frames read
}
```

Operations consume stream chunks, update the receive buffer, and extract output
without managing files or error recovery themselves.

## Frame Operation

The **Frame Operation** is responsible for **reading exactly one full ZLF
frame** from the file, ensuring all parts of the frame are available before
returning.

### Step-by-Step Process

1. **Ensure minimum bytes are available:** At least 13 bytes (timestamp +
   control + payload length) must be buffered.

2. **Parse header fields:**

   - **Timestamp** (8 bytes): Stored in Windows FILETIME / .NET ticks format.
   - **Control byte** (1 byte):
     - Bit 7 = direction (incoming = 0, outgoing = 1)
     - Bits 0-6 = session ID (usually 0)
   - **Payload length** (4 bytes, little-endian): Number of payload bytes to
     follow.

3. **Calculate complete frame length:** `14 + payloadLength` bytes (13 bytes
   header + payload + 1 byte trailing marker).

4. **Ensure full frame is available:** Accumulate more stream data if needed.

5. **Extract and return the frame:** Once the complete frame is buffered, return
   it as a `Buffer`. Retain remaining unprocessed bytes.

### Core Concepts

| Field              | Description                                                       |
| :----------------- | :---------------------------------------------------------------- |
| **Timestamp**      | Capture time of frame, stored as .NET ticks.                      |
| **Direction**      | Whether the frame was incoming or outgoing.                       |
| **Session ID**     | Logical stream ID for multi-source captures (usually 0).          |
| **Payload Length** | Size of the payload in bytes.                                     |
| **Frame Size**     | Full frame size including metadata, payload, and trailing marker. |

## Summary

`ZlfReader` is a specialized, incremental, frame-based reader for `.zlf` files
generated by Silicon Labs Zniffer. It enables safe, efficient reading and
recovery of Z-Wave sniffed traffic, adhering to clean asynchronous coding
principles, and aligning with official terminology and structure.
