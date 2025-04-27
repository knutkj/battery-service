export default class ZlfFrame {
  /**
   * @param {Date} timestamp - The capture timestamp.
   * @param {"incoming" | "outgoing"} direction - Direction of the frame.
   * @param {number} session - Session ID (0-127).
   * @param {Buffer} payload - Raw Z-Wave payload.
   */
  constructor(timestamp, direction, session, payload) {
    this.timestamp = timestamp;
    this.direction = direction;
    this.session = session;
    this.payload = payload;
  }

  /**
   * Creates a ZlfFrame instance from a raw frame Buffer.
   *
   * @param {Buffer} frameBuffer - A full ZLF frame buffer.
   * @returns {ZlfFrame}
   */
  static fromBuffer(frameBuffer) {
    if (frameBuffer.length < 14) {
      throw new Error("Frame buffer too short to parse.");
    }

    // Define masks and offsets for FILETIME ticks conversion.
    const TICKS_MASK = (1n << 62n) - 1n; // Mask out high-order bits
    // Difference between 0001-01-01 and Unix epoch in .NET ticks.
    const EPOCH_OFFSET = 621355968000000000n;

    // Parse and mask timestamp (first 8 bytes, FILETIME ticks) to JS Date.
    const rawTicks = frameBuffer.readBigUInt64LE(0);
    const ticks = rawTicks & TICKS_MASK;
    const msSinceEpoch = Number((ticks - EPOCH_OFFSET) / 10000n);
    const timestamp = new Date(msSinceEpoch);

    // Parse control byte (direction + session ID).
    const control = frameBuffer[8];
    const direction = control & 0x80 ? "outgoing" : "incoming";
    const session = control & 0x7f;

    // Parse payload length and extract payload.
    const payloadLength = frameBuffer.readUInt32LE(9);
    const payload = frameBuffer.subarray(13, 13 + payloadLength);

    return new ZlfFrame(timestamp, direction, session, payload);
  }
}
