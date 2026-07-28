/**
 * Fishing system — cast in water, wait, reel loot.
 */
import { ITEMS } from "./items.js";

const LOOT_PRE = [
  { item: "bass", w: 40 },
  { item: "trout", w: 30 },
  { item: "atlantic_cod", w: 15 },
  { item: "neon_tetra", w: 8 },
  { item: "old_shoe", w: 10 },
  { item: "seaweed", w: 12 },
  { item: "crate", w: 5 },
  { item: "golden_carp", w: 1 },
];

const LOOT_HARD = [
  ...LOOT_PRE,
  { item: "prismite", w: 8 },
  { item: "crate_hallowed", w: 4 },
  { item: "scaley_trinket", w: 2 },
];

export class FishingSystem {
  constructor() {
    this.casting = false;
    this.timer = 0;
    this.biteAt = 0;
    this.hasBite = false;
    this.bobber = null; // { x, y, z }
  }

  /**
   * @param {object} player
   * @param {object} world
   * @param {object} look
   */
  tryCast(player, world, look) {
    const pole = player.inventory.selectedItem;
    if (!pole || !ITEMS[pole.id]?.fishingPower) {
      return { ok: false, error: "Hold a fishing pole" };
    }
    if (!look) return { ok: false, error: "Look at water" };
    // water nearby
    let water = false;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (world.getBlock(look.x + dx, look.y + dy, look.z + dz) === 16) water = true;
        }
      }
    }
    if (!water) return { ok: false, error: "Need water" };
    this.casting = true;
    this.hasBite = false;
    this.timer = 0;
    this.biteAt = 2 + Math.random() * 6;
    this.bobber = { x: look.x + 0.5, y: look.y + 0.5, z: look.z + 0.5 };
    this.power = ITEMS[pole.id].fishingPower || 5;
    return { ok: true };
  }

  /** @param {number} dt */
  update(dt) {
    if (!this.casting) return null;
    this.timer += dt;
    if (!this.hasBite && this.timer >= this.biteAt) {
      this.hasBite = true;
      return { bite: true };
    }
    if (this.hasBite && this.timer > this.biteAt + 2.5) {
      // missed
      this.reset();
      return { missed: true };
    }
    return null;
  }

  reel(player, hardmode) {
    if (!this.casting) return { ok: false, error: "Not fishing" };
    if (!this.hasBite) {
      this.reset();
      return { ok: false, error: "No bite yet" };
    }
    const table = hardmode ? LOOT_HARD : LOOT_PRE;
    const item = weighted(table);
    const count = item === "crate" || item === "crate_hallowed" ? 1 : 1;
    // open crates later; for now give item
    if (item === "crate") {
      player.inventory.add("gold_coin", 1 + ((Math.random() * 3) | 0));
      player.inventory.add("torch", 10);
      player.inventory.add("iron_ore", 5);
    } else if (item === "crate_hallowed") {
      player.inventory.add("gold_coin", 5);
      player.inventory.add("crystal", 3);
    } else {
      player.inventory.add(item, count);
    }
    this.reset();
    return { ok: true, item };
  }

  reset() {
    this.casting = false;
    this.hasBite = false;
    this.timer = 0;
    this.bobber = null;
  }
}

function weighted(table) {
  const sum = table.reduce((a, t) => a + t.w, 0);
  let r = Math.random() * sum;
  for (const t of table) {
    r -= t.w;
    if (r <= 0) return t.item;
  }
  return table[0].item;
}
