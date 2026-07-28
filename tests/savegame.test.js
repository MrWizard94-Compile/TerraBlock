import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SAVE_VERSION, validateSave, migrateSave } from "../src/game/SaveGame.js";

describe("SaveGame", () => {
  it("rejects missing data", () => {
    assert.equal(validateSave(null).ok, false);
  });

  it("rejects broken shells", () => {
    assert.equal(validateSave({ version: 4, seed: "nope" }).ok, false);
  });

  it("accepts valid shell", () => {
    const v = validateSave({
      version: SAVE_VERSION,
      seed: 42,
      player: { x: 0, y: 1, z: 0 },
      modifications: [[1, 2, 3, 0]],
    });
    assert.equal(v.ok, true);
  });

  it("is version 4", () => {
    assert.equal(SAVE_VERSION, 4);
  });

  it("migrates v2 saves", () => {
    const m = migrateSave({
      version: 2,
      seed: 7,
      player: { x: 1, y: 2, z: 3, bossesDefeated: ["eye"] },
      modifications: [],
      achievements: ["first_blood"],
    });
    assert.equal(m.version, 4);
    assert.equal(m.seed, 7);
    assert.ok(m.progression);
  });
});
