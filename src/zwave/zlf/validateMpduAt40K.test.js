import { describe, it } from "node:test";
import assert from "node:assert";
import validateMpduAt40K from "./validateMpduAt40K.js";

describe("validateMpduAt40K", () => {
  it("returns true for a valid MPDU", () => {
    const hex = "0DC4A815CD0651010D012001FFCF";
    const mpdu = Buffer.from(hex, "hex");
    assert.strictEqual(validateMpduAt40K(mpdu), true);
  });

  it("Returns false for MPDU with bad FCS.", () => {
    const hex = "13C4A815CD06510213017105000000FF07080089"; // last byte corrupted
    const mpdu = Buffer.from(hex, "hex");
    assert.strictEqual(validateMpduAt40K(mpdu), false);
  });

  it("Returns false when length byte mismatches actual buffer length.", () => {
    const hex = "12C4A815CD06510213017105000000FF07080088";
    const mpdu = Buffer.from(hex, "hex");
    assert.strictEqual(validateMpduAt40K(mpdu), false);
  });

  it("Throws for buffers shorter than minimum.", () => {
    const mpdu = Buffer.from("010203", "hex"); // only 3 bytes
    assert.throws(() => validateMpduAt40K(mpdu), /Invalid MPDU buffer/);
  });
});
