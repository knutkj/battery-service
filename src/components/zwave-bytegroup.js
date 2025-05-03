import {
  LitElement,
  css,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./zwave-byte.js";

export default class ZwaveByteGroup extends LitElement {
  static styles = css`
    .byte-group {
      display: flex;
      flex-direction: row;
      gap: 12px;
      border: 2px solid #e0e0e0;
      padding: 8px;
      border-radius: 4px;
      background: #fafafa;
      flex: 1 1 0%; /* Make byte group fluid in parent */
      min-width: 0;
    }
  `;

  static properties = {
    hex: { type: String },
  };

  render() {
    if (!this.hex) return html``;
    const hexPairs = this.hex.match(/.{1,2}/g) || [];
    return html`
      <div class="byte-group">
        ${hexPairs.map((hex) => html`<zwave-byte hex=${hex}></zwave-byte>`)}
      </div>
    `;
  }
}

customElements.define("zwave-bytegroup", ZwaveByteGroup);
