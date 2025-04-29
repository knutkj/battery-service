export default class ZlfDataFrame {
  /**
   * Parses a ZLF data frame.
   *
   * @param {object} frame - The ZlfFrame instance returned by
   *   ZlfFrame.fromBuffer.
   * @returns {object} An object with fields ch, speed, rssi, home, src, dst,
   *   and payload.
   */
  static fromFrame(frame) {
    const payload = frame.payload;
    if (!Buffer.isBuffer(payload) || payload.length < 19) {
      throw new Error("Invalid ZLF Data Frame payload length.");
    }

    // Byte 4 holds channel (bits 5–7) and speed code (bits 0–4)
    const ctl = payload[4];
    const ch = ctl >>> 5;
    const rateCode = ctl & 0b00011111;
    const speedMap = {
      0: "9K6",
      1: "40K",
      2: "100K",
    };
    const speed = speedMap[rateCode] ?? "";

    // RSSI is at byte 6
    const rssi = payload[6];

    // Home ID is four bytes at offsets 10–13
    const home = payload.slice(10, 14).toString("hex").toUpperCase();

    // Source node is at offset 14
    const src = payload[14];

    // Destination node is at offset 18
    const dst = payload[18];

    return { ch, speed, rssi, home, src, dst, payload };
  }
}
