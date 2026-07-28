import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  randomPrefix,
  applyPrefixToWeapon,
  reforgeCost,
  reforgeSlotSync,
  getPrefix,
} from "../src/game/Prefixes.js";
import { Inventory } from "../src/game/Inventory.js";

describe("Prefixes", () => {
  it("randomPrefix returns weapon prefix", () => {
    const p = randomPrefix("weapon", () => 0.5);
    assert.ok(p);
    assert.ok(p.slot === "weapon" || p.slot === "any");
  });

  it("applyPrefixToWeapon scales damage", () => {
    const base = { damage: 10, cooldown: 0.4, knockback: 4 };
    const legendary = getPrefix("legendary");
    assert.ok(legendary);
    const mod = applyPrefixToWeapon(base, "legendary");
    assert.ok(mod.damage >= 10);
    assert.equal(mod.prefixName, "Legendary");
  });

  it("reforgeCost minimum 100", () => {
    assert.equal(reforgeCost(10), 100);
    assert.ok(reforgeCost(1000) >= 100);
  });

  it("reforgeSlotSync mutates prefix with coins", () => {
    const inv = new Inventory();
    inv.add("wood_sword", 1);
    inv.add("copper_coin", 500);
    const r = reforgeSlotSync(inv, 0, (cost) => {
      if (inv.count("copper_coin") < cost) return false;
      inv.remove("copper_coin", cost);
      return true;
    });
    assert.equal(r.ok, true);
    assert.ok(inv.slots[0].prefix);
  });
});
