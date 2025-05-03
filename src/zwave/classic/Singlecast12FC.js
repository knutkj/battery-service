import Base12FC from "./Base12FC.js";

export default class Singlecast12FC extends Base12FC {
  constructor(buffer) {
    super();
    this.init(buffer, 0x1);
  }

  get headerType() {
    return "singlecast"; // hardcoded
  }
}
