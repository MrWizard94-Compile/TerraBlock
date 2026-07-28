import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateGameData } from "../src/game/dataIntegrity.js";

describe("dataIntegrity", () => {
  it("validates all content tables with zero errors", () => {
    const result = validateGameData();
    if (!result.ok) {
      assert.fail(`Data integrity failed:\n${result.errors.join("\n")}`);
    }
    assert.equal(result.ok, true);
    assert.equal(result.errors.length, 0);
  });
});
