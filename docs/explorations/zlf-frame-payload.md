Alright — let's walk through this carefully and **build exactly the parser you
need** for this payload.

---

## Your raw payload:

```
02002b21030bc4a815cd0a03050b01744e
```

### Which splits into:

| Part         | Hex                      | Meaning                                  |
| :----------- | :----------------------- | :--------------------------------------- |
| **Prefix**   | `02002b21030b`           | Metadata header that Zniffer adds        |
| **Hex Data** | `c4a815cd0a03050b01744e` | Actual sniffed Z-Wave RF packet contents |

---

## Observations based on Zniffer tools and payloads

Zniffer adds a **12-byte prefix** to each packet:

| Offset (byte) | Size | Field                                       | Example Value |
| :------------ | :--- | :------------------------------------------ | :------------ |
| 0             | 1    | Speed indicator (e.g., 0x02 = 100kbps)      | `0x02`        |
| 1             | 1    | Unknown/future use (often 0x00)             | `0x00`        |
| 2             | 2    | Delta time (ms) between packets (uint16 LE) | `0x2B21`      |
| 4             | 1    | Channel (0–2 usually for Z-Wave)            | `0x03`        |
| 5             | 1    | RSSI (Received Signal Strength Indicator)   | `0x0B`        |
| 6..11         | 6    | Sniffed Z-Wave RF header or HomeID          | Depends       |

**⚡ Important:**

- `c4a815cd` looks like a **Home ID** (Z-Wave networks are identified by 4
  bytes: 32 bits).
- The rest is probably the beginning of the real **application data**.

---

## Parsing Plan

**1. Parse and strip the first 12 bytes:**

- They are not part of the captured Z-Wave payload.

**2. Retain the real Z-Wave payload:**

- The `hex data` you care about: `c4a815cd0a03050b01744e`

**3. Further parsing Z-Wave payload:**

- If needed, _after_ you have the real RF payload, you can parse it deeper into:
  - Home ID
  - Source Node
  - Destination Node
  - Frame type
  - Command Class, etc.

---

## ✨ So: the parser for a `ZlfFrame.payload` should do:

```plaintext
1. Read first 12 bytes:
   - Extract speed, delta time, channel, RSSI
   - (optionally) save them in metadata

2. Remaining bytes:
   - This is the real sniffed Z-Wave RF packet (exactly what devices sent)
```

---

## Example Code (Draft)

Here’s how we could implement the first step:

```javascript
export class ZlfPayload {
  constructor({ speed, channel, rssi, delta, data }) {
    this.speed = speed; // e.g., 100 kbps
    this.channel = channel; // e.g., 0, 1, or 2
    this.rssi = rssi; // raw RSSI
    this.delta = delta; // ms delta from previous frame
    this.data = data; // Buffer containing real RF data
  }

  static fromBuffer(buffer) {
    if (buffer.length < 12) {
      throw new Error("Payload too short, expected at least 12 bytes");
    }

    const speed = buffer.readUInt8(0);
    const delta = buffer.readUInt16LE(2);
    const channel = buffer.readUInt8(4);
    const rssi = buffer.readUInt8(5);
    const data = buffer.subarray(12); // Remaining buffer is the real Z-Wave data

    return new ZlfPayload({ speed, delta, channel, rssi, data });
  }
}
```

---

## Example Usage:

```javascript
const payload = ZlfPayload.fromBuffer(zlfFrame.payload);

console.log(payload.speed); // e.g., 0x02 (100 kbps)
console.log(payload.delta); // 8481 ms (from 2B21h)
console.log(payload.channel); // 3
console.log(payload.rssi); // 11
console.log(payload.data.toString("hex")); // c4a815cd0a03050b01744e
```

✅ Now `payload.data` is your _actual_ sniffed Z-Wave frame (HomeID + rest).

---

# ✅ Summary

| Step | Action                                            |
| :--- | :------------------------------------------------ |
| 1    | Read + strip 12-byte prefix                       |
| 2    | Expose channel, speed, RSSI, delta                |
| 3    | Real application data = everything after 12 bytes |

---

Would you like me to **continue** by parsing the **application data inside
`payload.data`**, i.e., Home ID, source node ID, destination node ID, command
class, etc.?  
(We can build a full parser stack easily from here if you want!) 🚀
