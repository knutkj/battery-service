import readZlfFrame from "./readZlfFrame.js";

const FRAME_HEADER_SIZE = 13;

/** Ensures the buffer has at least `minBytes` by reading from stream. */
async function ensureBytes(stream, buffer, minBytes) {
  if (buffer.length >= minBytes) return buffer;
  for await (const chunk of stream) {
    buffer = buffer.length === 0 ? chunk : Buffer.concat([buffer, chunk]);
    if (buffer.length >= minBytes) break;
  }
  return buffer;
}

/**
 * Reads the next Logical Data Frame (LDF) from the ZLF stream.
 *
 * Returns all contributing raw ZLF frame buffers (base + continuations).
 *
 * @param {Object} args
 * @param {AsyncIterable<Buffer>} args.stream
 * @param {Buffer} args.buffer
 * @returns {Promise<{ buffer: Buffer; output: readonly Buffer[] | null }>}
 */
export default async function readZlfLogicalDataFrame({ stream, buffer }) {
  let result;
  let frame;

  // Step 1: skip until we find a base Data Frame
  while (true) {
    result = await readZlfFrame({ stream, buffer });
    buffer = result.buffer;
    frame = result.output;
    if (!frame) return { buffer, output: null };
    const type = frame[FRAME_HEADER_SIZE];
    if (type === 0x21) break;
  }

  const sourceFrames = [frame];

  // Step 2: gather any continuation frames
  while (true) {
    buffer = await ensureBytes(stream, buffer, FRAME_HEADER_SIZE + 1);
    if (buffer.length < FRAME_HEADER_SIZE + 1) break;

    const type = buffer[FRAME_HEADER_SIZE];
    if (type === 0x21 || type === 0x23) break;

    result = await readZlfFrame({ stream, buffer });
    buffer = result.buffer;
    if (!result.output) break;

    sourceFrames.push(result.output);
  }

  return {
    buffer,
    output: sourceFrames,
  };
}
