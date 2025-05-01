/**
 * Represents a single ZLF (Z-Wave Log File) frame from a .zlf or .zwlf capture
 * file. Each frame corresponds to one RF capture event recorded by the Silicon
 * Labs Zniffer tool.
 *
 * ZLF frames are structured as:
 *
 * - Timestamp (8 bytes, FILETIME, masked to 62 bits)
 * - Control byte (1 byte: direction + session ID)
 * - Payload length (4 bytes, LE)
 * - Payload (variable size, either a ZLF Command Frame or Data Frame)
 * - Trailing marker (1 byte, usually 0x00, ignored)
 */
export default class ZlfFrame {
  /**
   * @param {Buffer} buffer - A raw ZLF frame, including timestamp, control
   *   byte, payload length, payload, and trailing marker. Must be at least 14
   *   bytes.
   * @throws {Error} If the buffer is too short to contain a valid ZLF frame.
   */
  constructor(buffer) {
    if (buffer.length < 14) {
      throw new Error("ZLF frame too short to parse.");
    }
    this._buffer = buffer;
    this._parsed = {};
  }

  /**
   * Returns the capture timestamp as a JavaScript Date object. The timestamp is
   * based on Windows FILETIME (100ns ticks since 1601-01-01 UTC), and must be
   * masked to 62 bits before conversion.
   *
   * @returns {Date}
   */
  get timestamp() {
    return (this._parsed.timestamp ||= timestamp(this._buffer));
  }

  /**
   * Returns the raw control byte (direction + sessionId) at offset 8.
   *
   * @returns {number} The control byte value.
   */
  get control() {
    return (this._parsed.control ||= controlByte(this._buffer));
  }

  /**
   * Direction of the frame as determined by the control byte.
   *
   * - `"incoming"` = received from RF
   * - `"outgoing"` = sent by controller
   *
   * @returns {"incoming" | "outgoing"}
   */
  get direction() {
    return (this._parsed.direction ||= direction(this.control));
  }

  /**
   * Logical session ID for the capture stream (0–127). Allows distinguishing
   * multiple capture sessions in a single file.
   *
   * @returns {number}
   */
  get sessionId() {
    return (this._parsed.sessionId ||= sessionId(this.control));
  }

  /**
   * The declared length of the payload in bytes, as a 32-bit little-endian
   * integer. Does not include the trailing marker byte.
   *
   * @returns {number}
   */
  get payloadLength() {
    return (this._parsed.payloadLength ||= payloadLength(this._buffer));
  }

  /**
   * The raw payload bytes following the frame header. Payloads can be either
   * ZLF Command Frames (tool control) or ZLF Data Frames (Z-Wave RF traffic).
   *
   * For decoding structure, see:
   *
   * - ZLF Command Frame: starts with 0x23
   * - ZLF Data Frame: starts with 0x21
   *
   * @returns {Buffer}
   */
  get payload() {
    return (this._parsed.payload ||= payload(this._buffer));
  }

  /**
   * Type of ZLF frame payload.
   *
   * - "command" → Frame starts with 0x23 (host↔controller command)
   * - "data" → Frame starts with 0x21 (captured RF data)
   * - "unknown" → Unrecognized message type
   *
   * @returns {"command" | "data" | "unknown"}
   */
  get type() {
    return (this._parsed.type ||= type(this.payload));
  }
}

/**
 * Parses the direction from a ZLF frame control byte.
 *
 * @param {number} controlByte
 * @returns {"incoming" | "outgoing"}
 */
export function direction(controlByte) {
  return (controlByte & 0x80) !== 0 ? "outgoing" : "incoming";
}

/**
 * Parses the session ID from a ZLF frame control byte.
 *
 * @param {number} controlByte
 * @returns {number}
 */
export function sessionId(controlByte) {
  return controlByte & 0x7f;
}

/**
 * Parses a ZLF frame buffer and extracts the timestamp as a JavaScript Date.
 *
 * @param {Buffer} buffer
 * @returns {Date}
 */
export function timestamp(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8) {
    throw new Error("Buffer too short for ZLF timestamp");
  }
  const rawTicks = buffer.readBigUInt64LE(0);
  const maskedTicks = rawTicks & ((1n << 62n) - 1n);
  const epochOffset = 621355968000000000n;
  const msSinceEpoch = Number((maskedTicks - epochOffset) / 10000n);
  return new Date(msSinceEpoch);
}

/**
 * Extracts the raw control byte from a ZLF frame buffer.
 *
 * @param {Buffer} buffer
 * @returns {number}
 */
export function controlByte(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 9) {
    throw new Error("Buffer too short for ZLF control byte");
  }
  return buffer[8];
}

/**
 * Extracts the payload length from a ZLF frame buffer.
 *
 * @param {Buffer} buffer
 * @returns {number}
 */
export function payloadLength(buffer) {
  return buffer.readUInt32LE(9);
}

/**
 * Extracts the payload Buffer from a ZLF frame buffer.
 *
 * @param {Buffer} buffer
 * @returns {Buffer}
 */
export function payload(buffer) {
  const start = 13;
  const length = payloadLength(buffer);
  return buffer.subarray(start, start + length);
}

/**
 * Determines the ZLF frame type from the payload's first byte.
 *
 * @param {Buffer} payload
 * @returns {"command" | "data" | "unknown"}
 */
export function type(payload) {
  const firstByte = payload[0];
  return firstByte === 0x23
    ? "command"
    : firstByte === 0x21
      ? "data"
      : "unknown";
}
