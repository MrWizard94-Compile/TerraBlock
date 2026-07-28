import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Achievements } from "../src/game/Achievements.js";

describe("Achievements", () => {
  it("unlocks once", () => {
    const a = new Achievements();
    let n = 0;
    a.onUnlock = () => {
      n++;
    };
    assert.equal(a.unlock("first_blood"), true);
    assert.equal(a.unlock("first_blood"), false);
    assert.equal(n, 1);
    assert.equal(a.has("first_blood"), true);
  });

  it("miner after 100 breaks", () => {
    const a = new Achievements();
    for (let i = 0; i < 99; i++) a.onBreak();
    assert.equal(a.has("miner"), false);
    a.onBreak();
    assert.equal(a.has("miner"), true);
  });

  it("serializes", () => {
    const a = new Achievements();
    a.unlock("builder");
    const data = a.serialize();
    const b = new Achievements();
    b.deserialize(data);
    assert.equal(b.has("builder"), true);
  });
});
