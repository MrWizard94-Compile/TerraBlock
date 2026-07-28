import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Progression, DIFFICULTY, BOSS_CHAIN } from "../src/game/Progression.js";

describe("Progression", () => {
  it("has 18 bosses in chain", () => {
    assert.equal(BOSS_CHAIN.length, 18);
  });

  it("wall unlocks hardmode", () => {
    const p = new Progression();
    assert.equal(p.hardmode, false);
    p.onBossKill("wall");
    assert.equal(p.hardmode, true);
  });

  it("difficulty multipliers exist", () => {
    assert.ok(DIFFICULTY.classic.enemyHp === 1);
    assert.ok(DIFFICULTY.classic.playerDmgTaken < 1);
    assert.ok(DIFFICULTY.expert.enemyHp > 1);
    assert.ok(DIFFICULTY.master.playerDmgTaken > DIFFICULTY.expert.playerDmgTaken);
    assert.ok(DIFFICULTY.classic.invuln > DIFFICULTY.master.invuln);
  });

  it("hardmode bosses locked until wall", () => {
    const p = new Progression();
    const twins = p.bossProgress().find((b) => b.id === "twins");
    assert.equal(twins.locked, true);
    p.onBossKill("wall");
    const twins2 = p.bossProgress().find((b) => b.id === "twins");
    assert.equal(twins2.locked, false);
  });
});
