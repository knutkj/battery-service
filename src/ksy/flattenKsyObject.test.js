import flattenKsyObject, { inlineType } from "./flattenKsyObject.js";
import { describe, it } from "node:test";
import assert from "node:assert";
import yaml from "js-yaml";

describe("inlineType", () => {
  it("inlines a simple type with one field", () => {
    const types = { foo: { seq: [{ id: "bar", type: "u1" }] } };
    const usedTypes = new Set();
    const enumsOut = {};
    const enumsPrefix = (id) => `test_${id}`;
    const result = inlineType(
      "foo",
      "prefix_",
      types,
      "root",
      usedTypes,
      enumsOut,
      enumsPrefix,
    );

    assert.strictEqual(result, [{ id: "prefix_bar", type: "u1" }]);
  });
});

describe("flattenKsyObject", () => {
  it("flattens a simple ksy object with one type and one field", () => {
    const ksyObj = {
      meta: { id: "foo" },
      types: { bar: { seq: [{ id: "baz", type: "u1" }] } },
      seq: [{ id: "barfield", type: "bar" }],
    };

    const result = flattenKsyObject(ksyObj);
    assert.strictEqual(result.meta.id, "foo_flat");
    assert.deepStrictEqual(result.seq, [{ id: "barfield_baz", type: "u1" }]);
    assert.strictEqual(result.types, undefined);
  });
});

describe("flattenKsyObject (YAML string input)", () => {
  it("flattens a real-world KSY YAML string (sky)", () => {
    const parsed = yaml.load(sky);
    const flat = flattenKsyObject(parsed);
    // Basic checks
    assert.strictEqual(flat.meta.id, "zwave_mpdu_mhr_flat");
    assert.ok(Array.isArray(flat.seq));
    assert.ok(flat.seq.some((f) => f.id === "frame_control_routed"));
    assert.ok(flat.enums["zwave_mpdu_mhr_header_type"]);
    assert.ok(flat.enums["zwave_mpdu_mhr_beaming_info"]);
    assert.strictEqual(flat.types, undefined);

    // Print the flattened YAML for manual inspection
    //console.log(yaml.dump(flat));
  });
});

// Test data.
const sky = `
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
    "2": long`;
