import assert from "node:assert";
import { describe, test } from "node:test";
import ZlfLogicalDataFrame from "./ZlfLogicalDataFrame.js";

describe("ZlfDataFrame", () => {
  describe("fromFrame", () => {
    test("Parses correctly #1.", () => {
      const hexFrame =
        "41f1d75c4369dd8801170000002101000002003221030dc4a815cd0141040d0a8408ec85fe";

      const ldf = new ZlfLogicalDataFrame([Buffer.from(hexFrame, "hex")]);
      assert.strictEqual(ldf.channel, 0);
      assert.strictEqual(ldf.destinationNodeId, 10);
      assert.strictEqual(ldf.homeId, "C4A815CD");
      assert.strictEqual(ldf.speed, "100K");
      assert.strictEqual(ldf.rssi, 50);
      assert.strictEqual(ldf.sourceNodeId, 1);
      assert(ldf.payload instanceof Buffer);
    });

    test("Parses correctly #2.", () => {
      const hexFrame =
        "c98274d94369dd8801140000002101000021003121030ac4a815cd0113010a0654fe";

      const ldf = new ZlfLogicalDataFrame([Buffer.from(hexFrame, "hex")]);
      assert.strictEqual(ldf.channel, 1);
      assert.strictEqual(ldf.destinationNodeId, 6);
      assert.strictEqual(ldf.homeId, "C4A815CD");
      assert.strictEqual(ldf.speed, "40K");
      assert.strictEqual(ldf.rssi, 49);
      assert.strictEqual(ldf.sourceNodeId, 1);
      assert(ldf.payload instanceof Buffer);
    });
  });
});
