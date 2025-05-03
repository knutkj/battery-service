import Base12FC from "./Base12FC.js";

export default class Ack12FC extends Base12FC {
  constructor(buffer) {
    super();
    this.init(buffer, 0x3);
  }

  get headerType() {
    return "ack"; // hardcoded
  }
}
