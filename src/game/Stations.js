/**
 * Crafting station proximity — workbench / furnace / anvil / hellforge.
 */
import { BlockId } from "./blocks.js";

/** block id → station key used by recipes */
export const STATION_BLOCKS = {
  [BlockId.WORKBENCH]: "workbench",
  [BlockId.FURNACE]: "furnace",
  [BlockId.ANVIL]: "anvil",
  [BlockId.HELLFORGE]: "hellforge",
  // table can act as soft workbench for furniture only — optional later
};

export const STATION_LABELS = {
  workbench: "Work Bench",
  furnace: "Furnace",
  anvil: "Anvil",
  hellforge: "Hellforge",
  none: "Hand",
};

/**
 * Scan world near a position for crafting stations.
 * @param {{ getBlock: (x:number,y:number,z:number)=>number }} world
 * @param {{ x:number, y:number, z:number }} pos
 * @param {number} [radius]
 * @returns {Set<string>}
 */
export function stationsNear(world, pos, radius = 10) {
  const found = new Set(["none"]); // hand-crafting always available
  if (!world || !pos) return found;
  const cx = Math.floor(pos.x);
  const cy = Math.floor(pos.y);
  const cz = Math.floor(pos.z);
  const r = Math.max(4, radius | 0);
  for (let y = cy - 2; y <= cy + 6; y++) {
    for (let z = cz - r; z <= cz + r; z++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const id = world.getBlock(x, y, z);
        const key = STATION_BLOCKS[id];
        if (key) found.add(key);
      }
    }
  }
  // inventory-held stations count if selected? No — placed only, Terraria-like
  return found;
}

/**
 * Does player have the required station (or better)?
 * hellforge counts as furnace for smelting.
 * @param {Set<string>} available
 * @param {string|undefined} required
 */
export function hasStation(available, required) {
  if (!required || required === "none") return true;
  if (available.has(required)) return true;
  if (required === "furnace" && available.has("hellforge")) return true;
  return false;
}

/**
 * Human-readable list of nearby stations for HUD.
 * @param {Set<string>} set
 */
export function formatStations(set) {
  const keys = [...set].filter((k) => k !== "none");
  if (!keys.length) return "Hand only — place a Work Bench nearby";
  return keys.map((k) => STATION_LABELS[k] || k).join(" · ");
}
