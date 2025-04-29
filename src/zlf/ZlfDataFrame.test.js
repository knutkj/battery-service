import assert from "node:assert";
import { describe, test } from "node:test";
import ZlfFrame from "./ZlfFrame.js";
import ZlfDataFrame from "./ZlfDataFrame.js";

describe("ZlfDataFrame", () => {
  describe("fromFrame", () => {
    test("Parses correctly #1.", () => {
      const hexFrame =
        "41f1d75c4369dd8801170000002101000002003221030dc4a815cd0141040d0a8408ec85fe";

      const frame = ZlfFrame.fromBuffer(Buffer.from(hexFrame, "hex"));
      const dataFrame = ZlfDataFrame.fromFrame(frame);
      assert.strictEqual(dataFrame.ch, 0);
      assert.strictEqual(dataFrame.speed, "100K");
      assert.strictEqual(dataFrame.rssi, 50);
      assert.strictEqual(dataFrame.home, "C4A815CD");
      assert.strictEqual(dataFrame.src, 1);
      assert.strictEqual(dataFrame.dst, 10);
      assert(dataFrame.payload instanceof Buffer);
    });

    test("Parses correctly #2.", () => {
      const hexFrame =
        "c98274d94369dd8801140000002101000021003121030ac4a815cd0113010a0654fe";

      const frame = ZlfFrame.fromBuffer(Buffer.from(hexFrame, "hex"));
      const dataFrame = ZlfDataFrame.fromFrame(frame);
      assert.strictEqual(dataFrame.ch, 1);
      assert.strictEqual(dataFrame.speed, "40K");
      assert.strictEqual(dataFrame.rssi, 49);
      assert.strictEqual(dataFrame.home, "C4A815CD");
      assert.strictEqual(dataFrame.src, 1);
      assert.strictEqual(dataFrame.dst, 6);
      assert(dataFrame.payload instanceof Buffer);
    });
  });
});
