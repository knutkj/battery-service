# How MPDU, MAC Layer, and ZLF Frames Relate in Z-Wave

Z-Wave is a wireless protocol built for reliable communication between smart
home devices. Underneath the commands that turn on lights or report motion
events lies a complex layering of protocols and data structures. This article
walks through how **MPDU**, the **MAC Layer**, and **ZLF Frames** relate,
especially in the context of **RF analysis using Zniffer**.

## Layered Architecture: How a Z-Wave Message Moves Through the Stack

To understand how these parts fit together, let’s walk through the protocol
stack that transforms a high-level command into a raw over-the-air
transmission—and then back again as a captured diagnostic record.

### 📐 Conceptual Layer Stack

```
+--------------------------------+
| Application Layer              |  ← Z-Wave Command Class (e.g., "Switch ON").
+--------------------------------+
| MAC Payload (inside MPDU)      |  ← Command Class + Parameters.
|                                |
+--------------------------------+
| MAC Header (inside MPDU)       |  ← Source Node ID, Destination Node ID,
|                                |    Frame Control Flags
+--------------------------------+
| MPDU (MAC Protocol Data Unit)  |
| = Header + Payload + Checksum  |
+--------------------------------+
| RF Transmission (Physical)     |  ← Sent over radio frequencies.
+--------------------------------+
| ZLF Data Frame                 |  ← Captured RF frame from air.
| = ZLF Header + MPDU + Checksum |
+--------------------------------+
| ZLF Logical Data Frame         |  ← One or more ZLF frames merged together.
+--------------------------------+
```

## 🔍 Key Definitions

- **MPDU** (MAC Protocol Data Unit): The complete data packet used by the MAC
  Layer. Includes MAC headers (source, destination, control flags), the
  application payload, and a checksum.
- **MAC Layer** (Medium Access Control): The protocol layer responsible for
  managing access to the radio medium, ensuring messages are addressed,
  acknowledged, and routed correctly.
- **ZLF Frame** (Z-Wave Log File Frame): A binary representation of one RF
  capture event, recorded by Zniffer and stored in `.zlf` or `.zwlf` files.
- **ZLF Data Frame**: A ZLF frame where `payload[0] == 0x21`, indicating that it
  carries a captured MAC-layer transmission.
- **ZLF Logical Data Frame (LDF)**: One or more consecutive ZLF frames combined
  to reconstruct a complete transmission that was fragmented due to USB or
  timing limits.
- **Command Class**: The application-level Z-Wave instruction set (e.g., Basic,
  Switch Binary, Sensor Multilevel).

## 🔄 Lifecycle of a Transmission (Text + Visual)

### 1. **Application Layer**

An automation system or user initiates an action, such as "Turn on light."

➡️ This is encoded using a **Command Class**, e.g.:

```plaintext
Command Class: 0x25 (Switch Binary)
Command:       0x01 (ON)
```

### 2. **MAC Layer**

The MAC Layer wraps this application data in an **MPDU**, adding:

- **Home ID**: The 32-bit network ID.
- **Source Node ID**: The sending device (e.g., 0x0A).
- **Destination Node ID**: The target device (e.g., 0x05).
- **Frame Control Flags**: Indicate things like ACK requests or routing
  behavior.
- **Checksum**: Ensures transmission integrity.

➡️ All of this becomes a single **MPDU**, ready for RF transmission.

### 3. **Over-the-Air Transmission**

The MPDU is transmitted over the **RF medium**—the radio frequencies Z-Wave uses
(e.g., 868.42 MHz in Europe).

➡️ This is where the **physical layer** operates: bits over air.

### 4. **Zniffer Capture**

A Zniffer tool records this transmission in real time and creates a **ZLF Data
Frame**, which contains:

- A **ZLF Header** (with timestamp, control byte, etc.)
- The raw **MPDU**
- An RF-specific checksum (XOR or CRC-16)

If the transmission is split across multiple fragments, additional
**continuation frames** are used.

### 5. **Logical Reassembly**

In some cases (e.g., long messages, high-speed captures), a single transmission
spans multiple ZLF frames. These are merged into a **ZLF Logical Data Frame
(LDF)** by software.

```ts
ldfPayload = Buffer.concat([frame1.payload, frame2.payload, ...]);
ldfTimestamp = lastFrame.timestamp;
```

➡️ The result is a complete binary copy of the original over-the-air MPDU.

## 📦 End-to-End Example

Let’s follow one message from app to radio to capture:

```
"Turn On Light"
    ↓
Command Class: 0x25 0x01
    ↓
Wrapped by MAC Layer into MPDU:
  - Home ID: DEADBEEF
  - Src Node: 0A
  - Dst Node: 05
  - Frame Control: 0x81
  - Payload: 0x25 0x01
  - Checksum: 0x92
    ↓
Transmitted over RF
    ↓
Captured as ZLF Frame:
  payload[0] = 0x21
    ↓
If needed: Merged into LDF
    ↓
Parsed for analysis
```

## Why This Matters

Understanding this structure is essential for low-level debugging, reverse
engineering, or validating device behavior. Zniffer doesn’t just show what
command was sent—it shows how the command **moved through the MAC layer** and
**over the air**, exposing subtle timing issues, routing problems, or
frame-level anomalies.

By interpreting the **MPDU structure**, engineers can precisely correlate
application behavior with RF activity—and identify where things go wrong.
