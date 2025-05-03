import {
  LitElement,
  css,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./zwave-byte.js";
import "./zwave-bytegroup.js";

export default class ZwaveField extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      position: relative;
      flex: 1 1 0%; /* Make field fluid in parent flex row */
      min-width: 0;
    }
    .group-label {
      font-size: 0.8em;
      color: #666;
      margin-bottom: 4px;
    }
    .width-label {
      font-size: 0.8em;
      color: #666;
      text-align: center;
      margin-top: 4px;
    }
  `;

  static properties = {
    hex: { type: String },
    label: { type: String },
  };

  render() {
    if (!this.hex) return html``;
    return html`
      <span class="group-label">${this.label}</span>
      <zwave-bytegroup hex=${this.hex}></zwave-bytegroup>
      <div class="width-label">${this.hex.length * 4} bits</div>
    `;
  }
}

customElements.define("zwave-field", ZwaveField);
