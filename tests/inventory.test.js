import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Inventory } from "../src/game/Inventory.js";

describe("Inventory", () => {
  it("starts empty with hotbar selection 0", () => {
    const inv = new Inventory();
    assert.equal(inv.selected, 0);
    assert.equal(inv.selectedItem, null);
    assert.equal(inv.count("wood"), 0);
  });

  it("adds and stacks items up to max stack", () => {
    const inv = new Inventory();
    assert.equal(inv.add("wood", 50), 50);
    assert.equal(inv.count("wood"), 50);
    inv.add("wood", 10);
    assert.equal(inv.count("wood"), 60);
  });

  it("rejects unknown items", () => {
    const inv = new Inventory();
    assert.equal(inv.add("not_a_real_item", 5), 0);
    assert.equal(inv.count("not_a_real_item"), 0);
  });

  it("removes items and clears empty slots", () => {
    const inv = new Inventory();
    inv.add("stone", 5);
    assert.equal(inv.remove("stone", 3), true);
    assert.equal(inv.count("stone"), 2);
    assert.equal(inv.remove("stone", 5), false);
    assert.equal(inv.count("stone"), 2);
    assert.equal(inv.remove("stone", 2), true);
    assert.equal(inv.count("stone"), 0);
    assert.equal(inv.slots[0], null);
  });

  it("consumeSelected decrements hotbar slot", () => {
    const inv = new Inventory();
    inv.add("torch", 3);
    inv.select(0);
    assert.equal(inv.consumeSelected(1), true);
    assert.equal(inv.count("torch"), 2);
    inv.consumeSelected(2);
    assert.equal(inv.selectedItem, null);
  });

  it("select only allows hotbar indices", () => {
    const inv = new Inventory();
    inv.select(8);
    assert.equal(inv.selected, 8);
    inv.select(9);
    assert.equal(inv.selected, 8);
    inv.select(-1);
    assert.equal(inv.selected, 8);
  });

  it("getToolPower and getWeapon read selected item", () => {
    const inv = new Inventory();
    assert.equal(inv.getToolPower(), 0.5);
    assert.equal(inv.getWeapon(), null);
    inv.add("wood_pick", 1);
    inv.select(0);
    assert.equal(inv.getToolPower(), 1);
    inv.slots[1] = { id: "wood_sword", count: 1 };
    inv.select(1);
    const w = inv.getWeapon();
    assert.equal(w.weapon, "melee");
    assert.equal(w.damage, 8);
  });

  it("swapSlots exchanges two slots", () => {
    const inv = new Inventory();
    inv.add("wood", 5);
    inv.add("stone", 3);
    assert.equal(inv.slots[0].id, "wood");
    assert.equal(inv.slots[1].id, "stone");
    inv.swapSlots(0, 1);
    assert.equal(inv.slots[0].id, "stone");
    assert.equal(inv.slots[1].id, "wood");
  });

  it("pickCursor and placeCursor move stacks", () => {
    const inv = new Inventory();
    inv.add("wood", 10);
    inv.add("torch", 5);
    let r = inv.pickCursor(0, false, null);
    assert.equal(r.cursor.id, "wood");
    assert.equal(r.cursor.count, 10);
    assert.equal(inv.slots[0], null);
    r = inv.placeCursor(5, r.cursor);
    assert.equal(r.cursor, null);
    assert.equal(inv.slots[5].id, "wood");
    assert.equal(inv.slots[5].count, 10);
  });

  it("pickCursor half splits stack", () => {
    const inv = new Inventory();
    inv.add("dirt", 10);
    const r = inv.pickCursor(0, true, null);
    assert.equal(r.cursor.count, 5);
    assert.equal(inv.slots[0].count, 5);
  });

  it("giveStarter grants expected kit", () => {
    const inv = new Inventory();
    inv.giveStarter();
    assert.ok(inv.count("wood_pick") >= 1);
    assert.ok(inv.count("wood_sword") >= 1);
    assert.ok(inv.count("torch") >= 1);
    assert.ok(inv.count("wood") >= 1);
    assert.ok(inv.count("dirt") >= 1);
  });

  it("fills multiple slots when exceeding stack size", () => {
    const inv = new Inventory();
    const added = inv.add("dirt", 1500);
    assert.equal(added, 1500);
    assert.equal(inv.count("dirt"), 1500);
  });

  it("equips armor and computes defense", () => {
    const inv = new Inventory();
    inv.add("wood_helmet", 1);
    inv.add("wood_chest", 1);
    inv.add("wood_legs", 1);
    inv.equipFromSlot(0);
    inv.equipFromSlot(1);
    inv.equipFromSlot(2);
    assert.equal(inv.defense, 4);
    assert.equal(inv.hasFullSet("wood"), true);
  });

  it("serializes and deserializes", () => {
    const inv = new Inventory();
    inv.add("iron_ore", 5);
    inv.equipment.head = "iron_helmet";
    const slots = inv.serialize();
    const eq = inv.serializeEquipment();
    const b = new Inventory();
    b.deserialize(slots);
    b.deserializeEquipment(eq);
    assert.equal(b.count("iron_ore"), 5);
    assert.equal(b.equipment.head, "iron_helmet");
  });
});
