import {
  LitElement,
  css,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./zwave-field.js";

// Field definitions with exact bit widths (offsets will be calculated dynamically)
const fields = [
  ["Home ID", 32], // 4 bytes
  ["Source Node ID", 8], // 1 byte
  ["Frame Control", 16], // 2 bytes
  ["Length", 8], // 1 byte
  ["Dest Node ID", 8], // 1 byte
];

export default class ZwaveFrame extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family:
        -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .frame-layout {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 20px 0;
      border: 2.5px solid #1976d2;
      border-radius: 14px;
      background: #f7fbff;
      box-shadow: 0 2px 8px 0 rgba(25, 118, 210, 0.07);
      padding: 18px 18px 8px 18px;
    }
    .groups-row {
      display: flex;
      gap: 8px;
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
  };

  render() {
    if (!this.hex) return html``;
    const totalWidth = fields.reduce((sum, [, width]) => sum + width, 0);
    let offset = 0;
    const labelHexFlexPairs = fields.map(([label, width]) => {
      const numBytes = width / 8;
      const hexVal = subhex(this.hex, offset, numBytes);
      const flex = width / totalWidth;
      offset += numBytes;
      return [label, hexVal, flex];
    });

    return html`
      <div class="frame-layout">
        <div class="groups-row">
          ${labelHexFlexPairs.map(
            ([label, hexVal, flex]) => html`
              <zwave-field
                label=${label}
                hex=${hexVal}
                style="flex: ${flex} 1 0%"
              ></zwave-field>
            `,
          )}
        </div>
      </div>
      <div class="width-label">${totalWidth} bits</div>
    `;
  }
}

customElements.define("zwave-frame", ZwaveFrame);

// Utility to extract a substring representing bytes from a hex string
export function subhex(hex, offset, numBytes) {
  return hex.substring(offset * 2, (offset + numBytes) * 2);
}
