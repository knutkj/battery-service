import ZlfFrame from "./ZlfFrame.js";

/**
 * Represents a Logical Data Frame (LDF), a reassembled RF capture formed by
 * merging a base ZLF Data Frame with its continuation frames.
 */
export default class ZlfLogicalDataFrame {
  /**
   * @param {readonly Buffer[]} frameBuffers - Ordered frame buffers: [base
   *   frame, ...continuations]
   * @throws {Error} If empty or first frame is not a ZLF Data Frame.
   */
  constructor(frameBuffers) {
    if (!Array.isArray(frameBuffers) || frameBuffers.length === 0) {
      throw new Error(
        "ZlfLogicalDataFrame requires at least one frame buffer.",
      );
    }

    this._frames = frameBuffers.map((buf) => new ZlfFrame(buf));
    if (this._frames[0].type !== "data") {
      throw new Error('First frame must be a ZLF Data Frame (type="data").');
    }

    this._parsed = {};
  }

  /**
   * RF channel used (bits 7–5 of byte 4).
   *
   * @returns {number}
   */
  get channel() {
    return (this._parsed.channel ||= channel(this.payload[4]));
  }

  /**
   * Control byte from the first frame. Bits 7: direction, 0–6: session ID.
   *
   * @returns {number}
   */
  get control() {
    return this._frames[0].control;
  }

  /**
   * Direction from control byte: 0 = incoming, 1 = outgoing.
   *
   * @returns {number}
   */
  get direction() {
    return this._frames[0].direction;
  }

  /**
   * Destination node ID (byte 18).
   *
   * @returns {number}
   */
  get destinationNodeId() {
    return (this._parsed.destinationNodeId ||= this.payload[18]);
  }

  /**
   * Underlying frame objects contributing to this logical frame.
   *
   * @returns {ZlfFrame[]}
   */
  get frames() {
    return this._frames;
  }

  /**
   * Home ID (bytes 10–13), as uppercase hex string.
   *
   * @returns {string}
   */
  get homeId() {
    return (this._parsed.homeId ||= this.payload
      .subarray(10, 14)
      .toString("hex")
      .toUpperCase());
  }

  /**
   * Not implemented: Region info (byte 5) not visible in Zniffer UI.
   *
   * @throws {Error}
   */
  get region() {
    throw new Error("Not implemented.");
  }

  /**
   * RSSI value (byte 6).
   *
   * @returns {number}
   */
  get rssi() {
    return (this._parsed.rssi ||= this.payload[6]);
  }

  /**
   * Session ID from control byte.
   *
   * @returns {number}
   */
  get sessionId() {
    return this._frames[0].sessionId;
  }

  /**
   * Source node ID (byte 14).
   *
   * @returns {number}
   */
  get sourceNodeId() {
    return (this._parsed.sourceNodeId ||= this.payload[14]);
  }

  /**
   * All frames contributing to this logical frame.
   *
   * @returns {ZlfFrame[]}
   */
  get sourceFrames() {
    return this._frames;
  }

  /**
   * Speed (decoded from byte 4).
   *
   * @returns {string}
   */
  get speed() {
    return (this._parsed.speed ||= speed(speedCode(this.payload[4])));
  }

  /**
   * Message type identifier.
   *
   * @returns {string}
   */
  get type() {
    return "ldf";
  }

  /**
   * Timestamp of the last contributing frame (Zniffer UI convention).
   *
   * @returns {Date}
   */
  get timestamp() {
    return this._frames[this._frames.length - 1].timestamp;
  }

  /**
   * Reassembled payload (Z-Wave MPDU + checksum).
   *
   * @returns {Buffer}
   */
  get payload() {
    return (this._parsed.payload ||= payload(this._frames));
  }

  /**
   * Not implemented: Length marker (bytes 7–8) not reliably shown.
   *
   * @throws {Error}
   */
  get lengthMarker() {
    throw new Error("Not implemented.");
  }
}

/**
 * Concatenates payloads from all source ZlfFrames.
 *
 * @param {ZlfFrame[]} frames
 * @returns {Buffer}
 */
export function payload(frames) {
  return Buffer.concat(frames.map((f) => f.payload));
}

/**
 * Extracts RF channel from channel/speed byte (bits 7–5).
 *
 * @param {number} byte
 * @returns {number}
 */
export function channel(byte) {
  return byte >>> 5;
}

/**
 * Extracts speed code from channel/speed byte (bits 4–0).
 *
 * @param {number} byte
 * @returns {number}
 */
export function speedCode(byte) {
  return byte & 0x1f;
}

/**
 * Maps speed code to human-readable Z-Wave speed string.
 *
 * @param {number} code
 * @returns {string}
 */
export function speed(code) {
  switch (code) {
    case 0:
      return "9K6";
    case 1:
      return "40K";
    case 2:
      return "100K";
    case 3:
      return "LR";
    default:
      return "";
  }
}
