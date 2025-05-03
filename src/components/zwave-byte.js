import {
  LitElement,
  css,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export default class ZwaveByte extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      min-width: 0;
    }
    .hex-group {
      display: flex;
      flex-direction: row;
      gap: 0.7em;
      width: 100%;
    }
    .hex-block {
      display: flex;
      flex-direction: column;
      gap: 0.3em;
      flex: 1 1 0%;
    }
    .hex-row,
    .bit-row {
      display: flex;
      flex-direction: row;
      width: 100%;
      min-width: 0;
    }
    .hex-cell,
    .bit-cell {
      flex: 1 1 0%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: monospace;
      min-width: 0;
    }
    .hex-cell {
      font-size: 1.1em;
      font-weight: bold;
      color: #0066cc;
      letter-spacing: 0.1em;
    }
    .bit-cell {
      font-size: 0.95em;
      color: #666;
      letter-spacing: 1px;
    }
  `;

  static properties = {
    hex: { type: String },
  };

  render() {
    let value;
    if (this.hex) {
      value = parseInt(this.hex, 16);
    }
    const hex = this.hex ? this.hex.toUpperCase().padStart(2, "0") : "00";
    const nibbles = hex.split("");
    const bits =
      value != null
        ? value.toString(2).padStart(8, "0").split("")
        : Array(8).fill("0");
    return html`
      <div class="hex-group">
        ${nibbles.map(
          (n, i) => html`
            <div class="hex-block">
              <div class="hex-row">
                <span class="hex-cell">${n}</span>
              </div>
              <div class="bit-row">
                ${bits
                  .slice(i * 4, i * 4 + 4)
                  .map((b) => html`<span class="bit-cell">${b}</span>`)}
              </div>
            </div>
          `,
        )}
      </div>
    `;
  }
}

customElements.define("zwave-byte", ZwaveByte);
