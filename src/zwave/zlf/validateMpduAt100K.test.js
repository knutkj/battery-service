import { describe, test } from "node:test";
import assert from "node:assert";
import validateMpduAt100K from "./validateMpduAt100K.js";

describe("validateMpduAt100K", () => {
  test("Validates a known good MPDU.", () => {
    const mpdu = Buffer.from("0FC4A815CD0A41010F013003FF0C87F3", "hex");
    assert.strictEqual(validateMpduAt100K(mpdu), true);
  });

  test("Throws if too short.", () => {
    const mpdu = Buffer.from("0102", "hex");
    assert.throws(() => validateMpduAt100K(mpdu), /Invalid MPDU buffer/);
  });

  test("Returns false if length field doesn't match.", () => {
    const mpdu = Buffer.from("0EC4A815CD0A41010F013003FF0C87F3", "hex");
    assert.strictEqual(validateMpduAt100K(mpdu), false);
  });

  test("Throws for non-Buffer input.", () => {
    assert.throws(() => validateMpduAt100K("buffer"), /Invalid MPDU buffer/);
  });
});
