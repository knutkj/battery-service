import { describe, it } from "node:test";
import assert from "node:assert";
import MHR from "./Singlecast12MHR.js";
import { hexToUint8Array } from "./hexUtils.js";

describe("Singlecast12MHR", () => {
  it("Ack and speed modification.", () => {
    const buffer = hexToUint8Array("C4A815CD0651010D012001FFCF");
    const mhr = new MHR(buffer.slice(0, 9));
    assert.strictEqual(mhr.homeId, 0xc4a815cd);
    assert.strictEqual(mhr.sourceNodeId, 6);
    assert.strictEqual(mhr.frameControl.routed, false);
    assert.strictEqual(mhr.frameControl.ack, true);
    assert.strictEqual(mhr.frameControl.lowPower, false);
    assert.strictEqual(mhr.frameControl.speedModified, true);
    assert.strictEqual(mhr.frameControl.headerType, "singlecast");
    assert.strictEqual(mhr.frameControl.beaming, "no");
    assert.strictEqual(mhr.frameControl.sequenceNumber, 1);
    assert.strictEqual(mhr.length, 13);
    assert.strictEqual(mhr.destinationNodeId, 1);
  });

  it("Routed.", () => {
    const buffer = hexToUint8Array("C4A815CD0481011201002014103003FF0A3E");
    const mhr = new MHR(buffer.slice(0, 9));
    assert.strictEqual(mhr.homeId, 0xc4a815cd);
    assert.strictEqual(mhr.sourceNodeId, 4);
    assert.strictEqual(mhr.frameControl.routed, true);
    assert.strictEqual(mhr.frameControl.ack, false);
    assert.strictEqual(mhr.frameControl.lowPower, false);
    assert.strictEqual(mhr.frameControl.speedModified, false);
    assert.strictEqual(mhr.frameControl.headerType, "singlecast");
    assert.strictEqual(mhr.frameControl.beaming, "no");
    assert.strictEqual(mhr.frameControl.sequenceNumber, 1);
    assert.strictEqual(mhr.length, 18);
    assert.strictEqual(mhr.destinationNodeId, 1);
  });

  it("100K.", () => {
    const buffer = hexToUint8Array("C4A815CD0A41010F013003FF0C87F3");
    const mhr = new MHR(buffer.slice(0, 9));
    assert.strictEqual(mhr.homeId, 0xc4a815cd);
    assert.strictEqual(mhr.sourceNodeId, 10);
    assert.strictEqual(mhr.frameControl.routed, false);
    assert.strictEqual(mhr.frameControl.ack, true);
    assert.strictEqual(mhr.frameControl.lowPower, false);
    assert.strictEqual(mhr.frameControl.speedModified, false);
    assert.strictEqual(mhr.frameControl.headerType, "singlecast");
    assert.strictEqual(mhr.frameControl.beaming, "no");
    assert.strictEqual(mhr.frameControl.sequenceNumber, 1);
    assert.strictEqual(mhr.length, 15);
    assert.strictEqual(mhr.destinationNodeId, 1);
  });

  it("Sequence number.", () => {
    const buffer = hexToUint8Array("C4A815CD0A41030D018407C160");
    const mhr = new MHR(buffer.slice(0, 9));
    assert.strictEqual(mhr.homeId, 0xc4a815cd);
    assert.strictEqual(mhr.sourceNodeId, 10);
    assert.strictEqual(mhr.frameControl.routed, false);
    assert.strictEqual(mhr.frameControl.ack, true);
    assert.strictEqual(mhr.frameControl.lowPower, false);
    assert.strictEqual(mhr.frameControl.speedModified, false);
    assert.strictEqual(mhr.frameControl.headerType, "singlecast");
    assert.strictEqual(mhr.frameControl.beaming, "no");
    assert.strictEqual(mhr.frameControl.sequenceNumber, 3);
    assert.strictEqual(mhr.length, 13);
    assert.strictEqual(mhr.destinationNodeId, 1);
  });
});
