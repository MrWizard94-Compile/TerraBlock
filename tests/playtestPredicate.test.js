import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evalPredicate } from "../src/game/PlaytestBridge.js";

describe("evalPredicate", () => {
  const state = {
    playing: true,
    player: { hp: 80, maxHp: 100, y: 40 },
    look: { name: "Dirt" },
    nearby: [{ type: "slime" }],
    boss: null,
  };

  it("path truthiness", () => {
    assert.equal(evalPredicate("playing", state), true);
    assert.equal(evalPredicate("look", state), true);
    assert.equal(evalPredicate("boss", state), false);
  });

  it("comparisons", () => {
    assert.equal(evalPredicate("player.hp>50", state), true);
    assert.equal(evalPredicate("player.hp<50", state), false);
    assert.equal(evalPredicate("player.y<20", state), false);
    assert.equal(evalPredicate("nearby.length>0", state), true);
  });

  it("AND compounds", () => {
    assert.equal(evalPredicate("playing && player.hp>0", state), true);
    assert.equal(evalPredicate("playing && boss", state), false);
  });
});
