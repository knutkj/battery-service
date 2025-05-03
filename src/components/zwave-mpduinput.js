export default class ZwaveMpduinput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  render() {
    const style = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .input-container {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        input {
          flex: 1;
          padding: 10px;
          font-family: monospace;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        input:invalid {
          border-color: #ff4444;
        }
        button {
          padding: 10px 16px;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background: #0052a3;
        }
        .error {
          color: #ff4444;
          font-size: 0.9em;
          margin-top: 4px;
          min-height: 1.2em;
        }
      </style>
    `;

    this.shadowRoot.innerHTML = `
      ${style}
      <div class="input-container">
        <input 
          type="text" 
          placeholder="Enter MPDU hex data (e.g., C4A815CD0113010A0654)"
          pattern="[0-9A-Fa-f]+"
          title="Please enter valid hexadecimal characters (0-9, A-F)"
        />
        <button>Parse MPDU</button>
      </div>
      <div class="error"></div>
    `;
  }

  addEventListeners() {
    const input = this.shadowRoot.querySelector("input");
    const button = this.shadowRoot.querySelector("button");
    const error = this.shadowRoot.querySelector(".error");

    const validateAndEmit = () => {
      const hex = input.value.replace(/\s/g, "");

      // Clear previous error
      error.textContent = "";

      // Validate hex format
      if (!/^[0-9A-Fa-f]+$/.test(hex)) {
        error.textContent =
          "Invalid hex format. Use only 0-9 and A-F characters.";
        return;
      }

      // Validate minimum length for MPDU (10 bytes = 20 hex chars)
      if (hex.length < 20) {
        error.textContent =
          "MPDU must be at least 10 bytes (20 hex characters).";
        return;
      }

      // Dispatch custom event with the validated hex value
      this.dispatchEvent(
        new CustomEvent("zwave-input", {
          detail: {
            hex: hex.toUpperCase(),
          },
          bubbles: true,
          composed: true,
        }),
      );
    };

    // Handle button click
    button.addEventListener("click", validateAndEmit);

    // Handle Enter key in input
    input.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        validateAndEmit();
      }
    });

    // Handle input validation on change
    input.addEventListener("input", () => {
      const hex = input.value.replace(/\s/g, "");
      if (hex && !/^[0-9A-Fa-f]+$/.test(hex)) {
        input.setCustomValidity("Invalid hex format");
      } else {
        input.setCustomValidity("");
      }
    });
  }

  // Public method to get current value
  getValue() {
    return this.shadowRoot.querySelector("input").value.replace(/\s/g, "");
  }

  // Public method to set value
  setValue(hex) {
    this.shadowRoot.querySelector("input").value = hex;
  }

  // Public method to clear input
  clear() {
    this.shadowRoot.querySelector("input").value = "";
    this.shadowRoot.querySelector(".error").textContent = "";
  }
}

customElements.define("zwave-mpduinput", ZwaveMpduinput);
