meta:
  id: zwave_mpdu_mhr
  title: Z-Wave MPDU MAC Header (MHR)
  endian: le
doc: "Z-Wave singlecast MAC header: Home ID, node IDs, frame control, length."
seq:
  - id: home_id
    type: u4
    doc: Home ID
  - id: src_node_id
    type: u1
    doc: Source node ID
  - id: frame_control
    type: frame_control
    doc: Frame control flags
  - id: length
    type: u1
    doc: MPDU length
  - id: dst_node_id
    type: u1
    doc: Target node ID
types:
  frame_control:
    seq:
      - id: routed
        type: b1
        doc: Routed frame
      - id: ack_requested
        type: b1
        doc: ACK requested
      - id: low_power
        type: b1
        doc: Low power
      - id: speed_modified
        type: b1
        doc: Speed modified
      - id: header_type
        type: b4
        enum: header_type
        doc: Header type
      - id: beaming_info
        type: b2
        enum: beaming_info
        doc: Beaming info
      - id: reserved
        type: b2
        doc: Reserved
      - id: sequence_number
        type: b4
        doc: Sequence number
enums:
  header_type:
    "1": singlecast
    "2": multicast
    "3": ack
  beaming_info:
    "0": none
    "1": short
    "2": long
