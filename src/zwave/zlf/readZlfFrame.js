const FRAME_HEADER_SIZE = 13;

/**
 * Functional operation for reading a single complete ZLF frame from a trace
 * file stream.
 *
 * This conforms to the `ZlfReaderOperation` interface defined in the ZlfReader
 * specification. It guarantees full frame integrity: only returns a frame when
 * all bytes are available, otherwise returns null without blocking.
 *
 * A ZLF frame consists of:
 *
 * - 8 bytes: Timestamp (Windows FILETIME)
 * - 1 byte: Control byte (Direction + Session ID)
 * - 4 bytes: Little-endian payload length
 * - N bytes: Payload (Command/Data/Continuation Frame)
 * - 1 byte: Trailing marker (reserved; ignored)
 */
export default async function readZlfFrame({ stream, buffer }) {
  buffer = await ensureBytes(stream, buffer, FRAME_HEADER_SIZE);
  if (buffer.length < FRAME_HEADER_SIZE) {
    return { buffer, output: null };
  }

  const payloadLength = buffer.readUInt32LE(9);
  const totalFrameSize = FRAME_HEADER_SIZE + payloadLength + 1;

  buffer = await ensureBytes(stream, buffer, totalFrameSize);
  if (buffer.length < totalFrameSize) {
    return { buffer, output: null };
  }

  const frame = buffer.subarray(0, totalFrameSize);
  const remaining = buffer.subarray(totalFrameSize);
  return { buffer: remaining, output: frame };
}

/**
 * Ensures the buffer has at least `minBytes` by consuming chunks from the
 * stream. Returns early if the stream is exhausted.
 *
 * @param {AsyncIterable<Buffer>} stream - Source of file chunks.
 * @param {Buffer} buffer - Current accumulated buffer.
 * @param {number} minBytes - Minimum number of bytes needed.
 * @returns {Promise<Buffer>} - Buffer extended to satisfy the byte requirement.
 */
async function ensureBytes(stream, buffer, minBytes) {
  if (buffer.length >= minBytes) return buffer;

  for await (const chunk of stream) {
    buffer = buffer.length === 0 ? chunk : Buffer.concat([buffer, chunk]);
    if (buffer.length >= minBytes) break;
  }

  return buffer;
}
