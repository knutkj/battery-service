import Ack12FC from "./Ack12FC.js";
import Base12MHR from "./Base12MHR.js";

export default class Ack12MHR extends Base12MHR {
  constructor(buffer) {
    super();
    this.init(buffer, Ack12FC);
  }
}
