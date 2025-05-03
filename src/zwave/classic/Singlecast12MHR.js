import Singlecast12FC from "./Singlecast12FC.js";
import Base12MHR from "./Base12MHR.js";

export default class Singlecast12MHR extends Base12MHR {
  constructor(buffer) {
    super();
    this.init(buffer, Singlecast12FC);
  }
}
