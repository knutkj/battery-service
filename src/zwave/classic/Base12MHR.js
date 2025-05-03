export default class Base12MHR {
  init(buffer, FCCtor) {
    if (!(buffer instanceof Uint8Array)) {
      throw new Error("Buffer must be a Uint8Array.");
    }

    if (buffer.length !== 9) {
      throw new Error("Buffer must have length 9.");
    }

    this.buffer = buffer;

    // Validate header type inside the frame control field (bytes 6–7).
    const fcBytes = buffer.slice(5, 7);
    this._frameControl = new FCCtor(fcBytes);
  }

  get homeId() {
    return (
      ((this.buffer[0] << 24) |
        (this.buffer[1] << 16) |
        (this.buffer[2] << 8) |
        this.buffer[3]) >>>
      0
    ); // Ensure unsigned
  }

  get sourceNodeId() {
    return this.buffer[4];
  }

  get frameControl() {
    return this._frameControl;
  }

  get length() {
    return this.buffer[7];
  }

  get destinationNodeId() {
    return this.buffer[8];
  }
}
