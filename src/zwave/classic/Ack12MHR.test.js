import { describe, it } from "node:test";
import assert from "node:assert";
import MHR from "./Ack12MHR.js";
import { hexToUint8Array } from "./hexUtils.js";

describe("Ack12MHR", () => {
  it("Speed modification.", () => {
    const buffer = hexToUint8Array("C4A815CD0113010A0654");
    const mhr = new MHR(buffer.slice(0, 9));
    assert.strictEqual(mhr.homeId, 0xc4a815cd);
    assert.strictEqual(mhr.sourceNodeId, 1);
    assert.strictEqual(mhr.frameControl.routed, false);
    assert.strictEqual(mhr.frameControl.ack, false);
    assert.strictEqual(mhr.frameControl.lowPower, false);
    assert.strictEqual(mhr.frameControl.speedModified, true);
    assert.strictEqual(mhr.frameControl.headerType, "ack");
    assert.strictEqual(mhr.frameControl.beaming, "no");
    assert.strictEqual(mhr.frameControl.sequenceNumber, 1);
    assert.strictEqual(mhr.length, 10);
    assert.strictEqual(mhr.destinationNodeId, 6);
  });
});
