import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Inventory } from "../src/game/Inventory.js";
import {
  getAllRecipes,
  canCraft,
  craft,
  craftMany,
  maxCraftable,
  listRecipes,
  getRecipe,
} from "../src/game/crafting.js";

describe("crafting", () => {
  it("exposes unique recipe ids", () => {
    const ids = getAllRecipes().map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("getRecipe finds by id", () => {
    assert.equal(getRecipe("planks")?.result.item, "planks");
    assert.equal(getRecipe("nope"), null);
  });

  it("canCraft is false without materials", () => {
    const inv = new Inventory();
    const recipe = getRecipe("planks");
    assert.equal(canCraft(inv, recipe), false);
  });

  it("craft planks consumes wood and grants planks", () => {
    const inv = new Inventory();
    inv.add("wood", 2);
    const recipe = getRecipe("planks");
    assert.equal(canCraft(inv, recipe), true);
    assert.equal(craft(inv, recipe), true);
    assert.equal(inv.count("wood"), 1);
    assert.equal(inv.count("planks"), 4);
  });

  it("craft fails atomically when short on materials", () => {
    const inv = new Inventory();
    inv.add("coal", 1);
    // torch needs coal + wood
    const recipe = getRecipe("torch");
    assert.equal(craft(inv, recipe), false);
    assert.equal(inv.count("coal"), 1);
    assert.equal(inv.count("torch"), 0);
  });

  it("all recipes craft successfully when given materials", () => {
    for (const recipe of getAllRecipes()) {
      const inv = new Inventory();
      for (const c of recipe.cost) {
        inv.add(c.item, c.count);
      }
      assert.equal(canCraft(inv, recipe), true, `canCraft ${recipe.id}`);
      assert.equal(craft(inv, recipe), true, `craft ${recipe.id}`);
      assert.equal(inv.count(recipe.result.item) >= recipe.result.count, true);
      for (const c of recipe.cost) {
        assert.equal(inv.count(c.item), 0, `${recipe.id} leftover ${c.item}`);
      }
    }
  });

  it("craftMany batches crafts", () => {
    const inv = new Inventory();
    inv.add("wood", 5);
    const recipe = getRecipe("planks");
    assert.equal(maxCraftable(inv, recipe), 5);
    assert.equal(craftMany(inv, recipe, 3), 3);
    assert.equal(inv.count("wood"), 2);
    assert.equal(inv.count("planks"), 12);
  });

  it("listRecipes puts craftable first", () => {
    const inv = new Inventory();
    inv.add("wood", 10);
    const list = listRecipes(inv, { category: "all" });
    assert.ok(list.length > 0);
    assert.equal(list[0].ready, true);
    const ready = listRecipes(inv, { category: "ready" });
    assert.ok(ready.every((x) => x.ready));
    assert.ok(ready.some((x) => x.recipe.id === "planks"));
  });
});
