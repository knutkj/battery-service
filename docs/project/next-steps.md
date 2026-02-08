# Battery Service — Next Steps

Tracks what has been implemented and what remains. Sections with a GitHub issue
are listed first.

## GitHub issues

### Z-Wave Alliance Product Catalog integration ([#2])

Enrich devices with product name, image, and specs by looking up their device ID
in the Z-Wave Alliance Product Catalog.

### zwave-js device configuration database integration ([#3])

Fetch device configuration JSON on demand from the zwave-js GitHub repository to
resolve product names, configuration parameters, association groups, and Z-Wave
Alliance certification IDs.

### SVG device icons for network graph ([#4])

Extract purpose-built SVG icons from manufacturer PDF quickguides for use as
network graph nodes. Every device type in the home network needs a dedicated
icon.

## Needs GitHub issue

### Command class decoding (`src/zwave/cc/`)

New module. Given an MPDU payload (after the MAC header), identifies and decodes
command classes. Three sub-layers:

**Identification** — read CC ID and command ID from the payload:

- [ ] Identify command classes from singlecast MPDU payload

**Encapsulation unwrapping** — peel a wrapper layer, hand back the inner payload
for another round of identification:

- [ ] Decode CRC-16 Encapsulation (CC 0x56) — unwrap to access the inner command
      class
- [ ] Decode Supervision CC (0x6C) encapsulation — unwrap to access the
      encapsulated command
- [ ] Decode Security 2 encapsulated frames (CC 0x9F) — at minimum identify that
      a frame is S2-wrapped (decryption is out of scope)

**Application decoders** — consume identified CC bytes, return structured data:

- [ ] Decode Battery Report (CC 0x80, cmd 0x03) with battery level
- [ ] Extract device ID from Manufacturer Specific CC (0x72) Report frames —
      parse manufacturer ID, product type, and product ID from NIF or
      Manufacturer Specific Report
- [ ] Extract wake-up interval from Wake Up CC (0x84) Interval Report (cmd 0x06)
      — parse seconds and target node ID

### MAC header parsing — remaining work (`src/zwave/classic/`)

- [ ] Parse routed singlecast frames (header type 0x04) — extract repeater node
      IDs from the routing header to build the routing topology
- [ ] Decode multicast frames (header type 0x02) — extract multicast group
      members

### NIF parsing

- [ ] Distinguish mains-powered from battery-powered nodes using the NIF
      listening bit (bit 7 of basic device class byte), not just heuristics

### File drop zone

- [ ] File drop zone with drag-and-drop ZLF loading
- [ ] Support dropping multiple ZLF files and merging their frames — scoped by
      home ID, deduplicate nodes seen across captures

### Network graph

- [ ] Render network graph with nodes and edges
- [ ] Show controller node as root
- [ ] Show direct vs. routed RF links as edges
- [ ] Distinguish mains-powered repeaters from battery-powered nodes visually
- [ ] Show battery level indicator on each node
- [ ] Make nodes clickable (opens detail panel)

### Detail panel

- [ ] Open detail panel on the side when a node is clicked
- [ ] Prompt for device ID entry when node has no device ID
- [ ] Persist entered device ID
- [ ] Display product catalog image
- [ ] Display product name and manufacturer
- [ ] Display device ID
- [ ] Display battery level, battery type, last change date
- [ ] Display user-supplied name, location, and notes
- [ ] Display supported command classes
- [ ] Allow editing of user-supplied metadata (name, location, battery type,
      last change date, notes)

### Data persistence

- [ ] Design data model scoped by home ID and node ID
- [ ] Store node-to-device-ID mapping
- [ ] Store user-supplied metadata per node
- [ ] Load persisted data on startup
- [ ] Merge persisted data with freshly parsed capture data

## Already implemented

### ZLF file reading (`src/zwave/zlf/`)

- [x] Read raw ZLF frames from stream (`readZlfFrame.js`)
- [x] Reassemble Logical Data Frames from base + continuation frames
      (`readZlfLogicalDataFrame.js`)
- [x] Parse ZLF frame header: timestamp, control byte, direction, session ID,
      payload (`ZlfFrame.js`)
- [x] Parse ZLF data frame: channel, speed, RSSI, home ID, source/destination
      node IDs (`ZlfDataFrame.js`, `ZlfLogicalDataFrame.js`)
- [x] Validate MPDU checksums at 40K and 100K (`validateMpduAt40K.js`,
      `validateMpduAt100K.js`)

### MAC header parsing (`src/zwave/classic/`)

- [x] Parse singlecast MHR: home ID, source/dest node, frame control with routed
      flag (`Singlecast12MHR.js`, `Base12MHR.js`)
- [x] Parse ACK MHR (`Ack12MHR.js`)
- [x] Parse frame control: routed, ack, low-power, speed-modified, beaming,
      sequence number (`Base12FC.js`)

[#2]: https://github.com/knutkj/battery-service/issues/2
[#3]: https://github.com/knutkj/battery-service/issues/3
[#4]: https://github.com/knutkj/battery-service/issues/4
