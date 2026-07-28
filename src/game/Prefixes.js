/**
 * Item prefixes / reforge system (weapons, tools, accessories).
 */
import { ITEMS } from "./items.js";

/** @typedef {{ id: string, name: string, dmg?: number, speed?: number, knockback?: number, crit?: number, def?: number, manaCost?: number, valueMul?: number, slot: 'weapon'|'tool'|'accessory'|'any' }} PrefixDef */

/** @type {PrefixDef[]} */
export const PREFIXES = [
  { id: "keen", name: "Keen", crit: 0.03, slot: "weapon", valueMul: 1.1 },
  { id: "superior", name: "Superior", dmg: 1.1, crit: 0.03, knockback: 1.1, slot: "weapon", valueMul: 1.2 },
  { id: "legendary", name: "Legendary", dmg: 1.15, speed: 0.9, crit: 0.05, knockback: 1.15, slot: "weapon", valueMul: 2.0 },
  { id: "godly", name: "Godly", dmg: 1.15, crit: 0.05, knockback: 1.15, slot: "weapon", valueMul: 1.8 },
  { id: "demonic", name: "Demonic", dmg: 1.15, crit: 0.05, slot: "weapon", valueMul: 1.5 },
  { id: "murderous", name: "Murderous", dmg: 1.07, speed: 0.94, crit: 0.05, slot: "weapon", valueMul: 1.3 },
  { id: "agile", name: "Agile", speed: 0.9, crit: 0.03, slot: "weapon", valueMul: 1.2 },
  { id: "nasty", name: "Nasty", dmg: 1.05, speed: 0.9, crit: 0.02, knockback: 0.9, slot: "weapon", valueMul: 1.15 },
  { id: "heavy", name: "Heavy", knockback: 1.15, speed: 1.1, slot: "weapon", valueMul: 1.1 },
  { id: "light", name: "Light", speed: 0.85, knockback: 0.9, slot: "weapon", valueMul: 1.1 },
  { id: "mythical", name: "Mythical", dmg: 1.15, speed: 0.9, crit: 0.05, manaCost: 0.85, slot: "weapon", valueMul: 2.0 },
  { id: "ruthless", name: "Ruthless", dmg: 1.18, knockback: 0.9, slot: "weapon", valueMul: 1.4 },
  { id: "quick", name: "Quick", speed: 0.85, slot: "tool", valueMul: 1.2 },
  { id: "deadly", name: "Deadly", dmg: 1.1, speed: 0.9, slot: "weapon", valueMul: 1.3 },
  { id: "rapid", name: "Rapid", speed: 0.85, dmg: 0.95, slot: "weapon", valueMul: 1.2 },
  { id: "hard", name: "Hard", def: 1, slot: "accessory", valueMul: 1.1 },
  { id: "guarding", name: "Guarding", def: 2, slot: "accessory", valueMul: 1.2 },
  { id: "armored", name: "Armored", def: 3, slot: "accessory", valueMul: 1.3 },
  { id: "warding", name: "Warding", def: 4, slot: "accessory", valueMul: 1.5 },
  { id: "arcane", name: "Arcane", manaCost: 0.8, slot: "accessory", valueMul: 1.3 },
  { id: "precise", name: "Precise", crit: 0.02, slot: "accessory", valueMul: 1.2 },
  { id: "lucky", name: "Lucky", crit: 0.04, slot: "accessory", valueMul: 1.4 },
  { id: "menacing", name: "Menacing", dmg: 1.04, slot: "accessory", valueMul: 1.3 },
  { id: "violent", name: "Violent", dmg: 1.04, speed: 0.97, slot: "accessory", valueMul: 1.35 },
  { id: "broken", name: "Broken", dmg: 0.7, knockback: 0.8, slot: "weapon", valueMul: 0.5 },
  { id: "weak", name: "Weak", dmg: 0.85, knockback: 0.85, slot: "weapon", valueMul: 0.6 },
];

export function getPrefix(id) {
  return PREFIXES.find((p) => p.id === id) || null;
}

/**
 * @param {'weapon'|'tool'|'accessory'} kind
 */
export function randomPrefix(kind, rng = Math.random) {
  const pool = PREFIXES.filter((p) => p.slot === kind || p.slot === "any");
  if (!pool.length) return null;
  const roll = rng();
  if (roll < 0.08) {
    const bad = pool.filter((p) => (p.valueMul || 1) < 1);
    if (bad.length) return bad[(rng() * bad.length) | 0];
  }
  const good = pool.filter((p) => (p.valueMul || 1) >= 1);
  return good[(rng() * good.length) | 0] || pool[0];
}

/**
 * @param {object} baseDef
 * @param {string|null|undefined} prefixId
 */
export function applyPrefixToWeapon(baseDef, prefixId) {
  if (!prefixId || !baseDef) return { ...baseDef };
  const p = getPrefix(prefixId);
  if (!p) return { ...baseDef };
  const out = { ...baseDef };
  if (out.damage !== undefined && out.damage !== null && p.dmg) {
    out.damage = Math.max(1, Math.round(out.damage * p.dmg));
  }
  if (out.cooldown !== undefined && out.cooldown !== null && p.speed) {
    out.cooldown = Math.max(0.05, out.cooldown * p.speed);
  }
  if (out.knockback !== undefined && out.knockback !== null && p.knockback) {
    out.knockback *= p.knockback;
  }
  if (out.mana !== undefined && out.mana !== null && p.manaCost) {
    out.mana = Math.max(1, Math.round(out.mana * p.manaCost));
  }
  if (out.power !== undefined && out.power !== null && p.dmg) {
    out.power = out.power * (p.dmg || 1);
  }
  if (out.speed !== undefined && out.speed !== null && p.speed) {
    out.speed = out.speed / (p.speed || 1);
  }
  out.critBonus = (out.critBonus || 0) + (p.crit || 0);
  out.prefixName = p.name;
  out.prefixId = p.id;
  return out;
}

export function reforgeCost(itemValue = 100) {
  return Math.max(100, Math.floor(itemValue * 0.25));
}

/**
 * @param {import('./Inventory.js').Inventory} inv
 * @param {number} slotIndex
 * @param {(n:number)=>boolean} spendCoinsFn
 */
export function reforgeSlotSync(inv, slotIndex, spendCoinsFn) {
  const slot = inv.slots[slotIndex];
  if (!slot) return { ok: false, error: "Empty slot" };
  const def = ITEMS[slot.id];
  if (!def) return { ok: false, error: "Unknown item" };
  let kind = null;
  if (def.weapon) kind = "weapon";
  else if (def.tool) kind = "tool";
  else if (def.accessory) kind = "accessory";
  else return { ok: false, error: "Cannot reforge this item" };

  const cost = reforgeCost(def.value || 100);
  if (!spendCoinsFn(cost)) return { ok: false, error: `Need ${cost} copper` };

  const prefix = randomPrefix(kind);
  slot.prefix = prefix?.id || null;
  return { ok: true, prefix: prefix?.name || "None", cost, prefixId: slot.prefix };
}
