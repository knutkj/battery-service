export default class Base12FC {
  init(buffer, headerType) {
    if (!(buffer instanceof Uint8Array) || buffer.length !== 2) {
      throw new Error("Frame control must be a Uint8Array of length 2.");
    }

    this.buffer = buffer;
    const actualHeaderType = (buffer[0] >> 0) & 0x0f;
    if (actualHeaderType !== headerType) {
      throw new Error("Invalid header type.");
    }
  }

  get routed() {
    return !!(this.buffer[0] & 0b10000000);
  }

  get ack() {
    return !!(this.buffer[0] & 0b01000000);
  }

  get lowPower() {
    return !!(this.buffer[0] & 0b00100000);
  }

  get speedModified() {
    return !!(this.buffer[0] & 0b00010000);
  }

  get beaming() {
    const bits = (this.buffer[1] >> 5) & 0b11;
    switch (bits) {
      case 0b00:
        return "no";
      case 0b01:
        return "short";
      case 0b10:
        return "long";
      default:
        return "reserved"; // 0b11
    }
  }

  get sequenceNumber() {
    return this.buffer[1] & 0x0f;
  }

  // Added getters for raw control bytes
  get controlByte1() {
    return this.buffer[0];
  }

  get controlByte2() {
    return this.buffer[1];
  }
}
