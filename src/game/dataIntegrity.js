/**
 * Static data integrity checks for content tables.
 */

import { BLOCKS, BlockId } from "./blocks.js";
import { ITEMS } from "./items.js";
import { getAllRecipes } from "./crafting.js";
import { ENEMY_TYPES } from "./enemies.js";
import { ACHIEVEMENT_DEFS } from "./Achievements.js";

/**
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateGameData() {
  const errors = [];

  for (const [idStr, def] of Object.entries(BLOCKS)) {
    const id = Number(idStr);
    if (!def || typeof def.name !== "string") {
      errors.push(`Block ${id}: missing name`);
      continue;
    }
    if (def.drop && !ITEMS[def.drop]) {
      errors.push(`Block ${def.name} (${id}): drop "${def.drop}" not in ITEMS`);
    }
    if (def.solid === undefined) {
      errors.push(`Block ${def.name}: solid flag required`);
    }
  }

  for (const [name, id] of Object.entries(BlockId)) {
    if (BLOCKS[id] === undefined) {
      errors.push(`BlockId.${name}=${id} missing from BLOCKS`);
    }
  }

  for (const [id, def] of Object.entries(ITEMS)) {
    if (!def.name) errors.push(`Item ${id}: missing name`);
    if (def.place !== undefined && def.place !== null && BLOCKS[def.place] === undefined) {
      errors.push(`Item ${id}: place block ${def.place} unknown`);
    }
    if (def.boss && !ENEMY_TYPES[def.boss]) {
      errors.push(`Item ${id}: boss type "${def.boss}" unknown`);
    }
    if (def.armor && !["head", "chest", "legs"].includes(def.armor)) {
      errors.push(`Item ${id}: invalid armor slot ${def.armor}`);
    }
  }

  const recipeIds = new Set();
  for (const recipe of getAllRecipes()) {
    if (!recipe.id) errors.push("Recipe missing id");
    if (recipeIds.has(recipe.id)) errors.push(`Duplicate recipe id: ${recipe.id}`);
    recipeIds.add(recipe.id);

    if (!recipe.result?.item || !ITEMS[recipe.result.item]) {
      errors.push(`Recipe ${recipe.id}: invalid result ${recipe.result?.item}`);
    }
    if (!recipe.result?.count || recipe.result.count < 1) {
      errors.push(`Recipe ${recipe.id}: result count must be >= 1`);
    }
    if (!Array.isArray(recipe.cost) || recipe.cost.length === 0) {
      errors.push(`Recipe ${recipe.id}: empty cost`);
    }
    for (const c of recipe.cost || []) {
      if (!ITEMS[c.item]) {
        errors.push(`Recipe ${recipe.id}: cost item "${c.item}" unknown`);
      }
      if (typeof c.count !== "number" || c.count < 1) {
        errors.push(`Recipe ${recipe.id}: invalid cost count for ${c.item}`);
      }
    }
  }

  for (const [type, def] of Object.entries(ENEMY_TYPES)) {
    if (!def.name || !def.hp || !def.ai) {
      errors.push(`Enemy ${type}: incomplete definition`);
    }
    for (const drop of def.drops || []) {
      if (!ITEMS[drop.item]) {
        errors.push(`Enemy ${type}: drop "${drop.item}" unknown`);
      }
    }
  }

  for (const [id, def] of Object.entries(ACHIEVEMENT_DEFS)) {
    if (def.id !== id) errors.push(`Achievement key/id mismatch: ${id}`);
    if (!def.name || !def.desc) errors.push(`Achievement ${id} incomplete`);
  }

  return { ok: errors.length === 0, errors };
}
