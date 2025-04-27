/**
 * Minimum number of bytes required to parse the frame header fields of a ZLF
 * frame.
 *
 * Frame header fields:
 *
 * - 8 bytes: Timestamp (FILETIME ticks)
 * - 1 byte: Control (Direction + Session ID)
 * - 4 bytes: Payload length (little-endian unsigned integer)
 */
const FRAME_HEADER_SIZE = 13;

/**
 * FrameOperation for ZlfReader.
 *
 * Extracts exactly one complete frame from a ZLF Trace File. Each frame
 * consists of:
 *
 * - 8 bytes: Timestamp (FILETIME ticks)
 * - 1 byte: Control (Direction + Session ID)
 * - 4 bytes: Payload length (unsigned, little-endian)
 * - N bytes: Captured payload
 * - 1 byte: Trailing marker
 *
 * FrameOperation ensures full frame granularity: no partial frames are ever
 * emitted. If insufficient data is available to assemble a complete frame, the
 * operation returns immediately with `output: null` without blocking, retrying,
 * or throwing. This behavior enables correct handling of both static files and
 * actively growing capture files.
 *
 * In case of end-of-file with an incomplete frame, recovery logic must be
 * handled by the caller.
 */
export default class ZlfReadFrameOperation {
  /**
   * Attempts to read exactly one complete ZLF frame from the stream and receive
   * buffer.
   *
   * @param {AsyncIterable<Buffer>} stream - Async iterable source of file
   *   chunks.
   * @param {Buffer} receiveBuffer - Buffer holding accumulated unprocessed
   *   bytes.
   * @returns {Promise<{ receiveBuffer: Buffer; output: Buffer | null }>}
   *   Updated receive buffer and the extracted frame buffer, or null if
   *   unavailable.
   */
  async run(stream, receiveBuffer) {
    // Ensure enough data to parse the frame header fields.
    receiveBuffer = await ensureBytes(stream, receiveBuffer, FRAME_HEADER_SIZE);

    if (receiveBuffer.length < FRAME_HEADER_SIZE) {
      return { receiveBuffer, output: null }; // Header not complete yet.
    }

    // Parse the payload length field.
    const payloadLength = receiveBuffer.readUInt32LE(9);

    // A complete frame consists of header + payload + trailing marker.
    const fullFrameSize = FRAME_HEADER_SIZE + payloadLength + 1;

    // Ensure the entire frame is buffered.
    receiveBuffer = await ensureBytes(stream, receiveBuffer, fullFrameSize);

    if (receiveBuffer.length < fullFrameSize) {
      return { receiveBuffer, output: null }; // Frame still incomplete.
    }

    // Extract the complete frame.
    const frame = receiveBuffer.subarray(0, fullFrameSize);
    const newBuffer = receiveBuffer.subarray(fullFrameSize);

    return { receiveBuffer: newBuffer, output: frame };
  }
}

/**
 * Utility function to ensure the receive buffer contains at least the requested
 * number of bytes. Pulls additional chunks from the async stream as needed, or
 * returns early if the stream is exhausted.
 *
 * @param {AsyncIterable<Buffer>} stream - Async iterable producing Buffer
 *   chunks.
 * @param {Buffer} receiveBuffer - Current buffer of unprocessed data.
 * @param {number} minBytes - Minimum required buffer size in bytes.
 * @returns {Promise<Buffer>} Buffer extended to satisfy or exceed the minimum
 *   size.
 */
async function ensureBytes(stream, receiveBuffer, minBytes) {
  if (receiveBuffer.length >= minBytes) return receiveBuffer;

  for await (const chunk of stream) {
    receiveBuffer =
      receiveBuffer.length === 0
        ? chunk
        : Buffer.concat([receiveBuffer, chunk]);
    if (receiveBuffer.length >= minBytes) break;
  }

  return receiveBuffer;
}
