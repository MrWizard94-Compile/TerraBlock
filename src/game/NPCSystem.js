/**
 * NPCs, housing validation, and shops.
 */
import * as THREE from "three";
import { ITEMS } from "./items.js";
import { BlockId } from "./blocks.js";
import { createEntitySprite } from "./EntityArt.js";

/** @typedef {{ item: string, price: number, currency?: string }} ShopEntry */

/** @type {Record<string, { id: string, name: string, color: number, dialog: string[], shop?: ShopEntry[], condition?: string }>} */
export const NPC_DEFS = {
  guide: {
    id: "guide",
    name: "Guide",
    color: 0x55efc4,
    dialog: [
      "Welcome to TerraBlock! Dig, craft, and summon bosses.",
      "Build houses with walls, a door, light, a table and chair.",
      "Defeat the Wall of Flesh to unleash Hardmode.",
    ],
  },
  merchant: {
    id: "merchant",
    name: "Merchant",
    color: 0xfdcb6e,
    dialog: ["Looking to buy something?", "Coins make the world go round."],
    shop: [
      { item: "torch", price: 50 },
      { item: "rope", price: 10 },
      { item: "healing_potion", price: 500 },
      { item: "mana_potion", price: 400 },
      { item: "ironskin_potion", price: 800 },
      { item: "recall_potion", price: 300 },
      { item: "piggy_bank", price: 5000 },
    ],
  },
  nurse: {
    id: "nurse",
    name: "Nurse",
    color: 0xff7675,
    dialog: ["Need a heal? That'll cost you.", "Don't die out there."],
    shop: [{ item: "healing_potion", price: 400 }],
  },
  demolitionist: {
    id: "demolitionist",
    name: "Demolitionist",
    color: 0xe17055,
    dialog: ["Explosives! Get your explosives here!"],
    shop: [
      { item: "bomb", price: 300 },
      { item: "dynamite", price: 1500 },
      { item: "grenade", price: 200 },
    ],
  },
  dryad: {
    id: "dryad",
    name: "Dryad",
    color: 0x00b894,
    dialog: ["The corruption must be purified… eventually.", "Nature provides."],
    shop: [
      { item: "purification_powder", price: 100 },
      { item: "bloom_seeds", price: 50 },
      { item: "swiftness_potion", price: 700 },
    ],
  },
  arms_dealer: {
    id: "arms_dealer",
    name: "Arms Dealer",
    color: 0x636e72,
    dialog: ["Keep your powder dry.", "Got guns? Almost."],
    shop: [
      { item: "musket_ball", price: 7 },
      { item: "minishark", price: 35000 },
    ],
  },
  clothier: {
    id: "clothier",
    name: "Clothier",
    color: 0xdfe6e9,
    dialog: ["Fashion is pain. Also Skeletron."],
    shop: [
      { item: "fedora", price: 2500 },
      { item: "robe", price: 2000 },
    ],
  },
  goblin_tinkerer: {
    id: "goblin_tinkerer",
    name: "Goblin Tinkerer",
    color: 0x6c5ce7,
    dialog: ["I can reforge… metaphorically. Buy accessories!"],
    shop: [
      { item: "rocket_boots", price: 25000 },
      { item: "toolbox", price: 5000 },
      { item: "grappling_hook", price: 2000 },
    ],
  },
  wizard: {
    id: "wizard",
    name: "Wizard",
    color: 0xa29bfe,
    dialog: ["Magic is just science we haven't priced yet."],
    shop: [
      { item: "mana_crystal", price: 5000 },
      { item: "magic_power_potion", price: 1000 },
      { item: "crystal_ball", price: 10000 },
    ],
  },
  steampunker: {
    id: "steampunker",
    name: "Steampunker",
    color: 0xb2bec3,
    dialog: ["Clank clank. Teleporters sold separately."],
    shop: [
      { item: "teleporter", price: 25000 },
      { item: "jetpack", price: 40000 },
    ],
  },
  witch_doctor: {
    id: "witch_doctor",
    name: "Witch Doctor",
    color: 0x00cec9,
    dialog: ["The jungle remembers."],
    shop: [
      { item: "summon_staff", price: 20000 },
      { item: "hornet_staff", price: 25000 },
      { item: "imbue_venom", price: 1500 },
      { item: "bewitching_table", price: 15000 },
    ],
  },
  pirate: {
    id: "pirate",
    name: "Pirate",
    color: 0xb2bec3,
    dialog: ["Yarr! Buy me booty."],
    shop: [
      { item: "sail", price: 100 },
      { item: "cannon", price: 25000 },
      { item: "gold_coin", price: 10000 },
    ],
  },
  santa: {
    id: "santa",
    name: "Santa Claus",
    color: 0xd63031,
    dialog: ["Ho ho ho! Seasonal only… forever."],
    shop: [
      { item: "healing_potion", price: 300 },
      { item: "fuzzy_carrot", price: 8000 },
    ],
  },
  cyborg: {
    id: "cyborg",
    name: "Cyborg",
    color: 0x55efc4,
    dialog: ["Beep. Rockets for sale."],
    shop: [
      { item: "rocket_boots", price: 20000 },
      { item: "cosmic_car_key", price: 50000 },
      { item: "nanites", price: 500 },
    ],
  },
  princess: {
    id: "princess",
    name: "Princess",
    color: 0xfd79a8,
    dialog: ["You saved the world! Have a cookie."],
    shop: [
      { item: "super_healing", price: 2000 },
      { item: "prismatic_dye", price: 1000 },
    ],
  },
};

export class NPCSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    /** @type {Map<string, NPCInstance>} */
    this.npcs = new Map();
    this.homes = []; // { x, y, z, npcId }
  }

  /**
   * @param {import('./Progression.js').Progression} progression
   * @param {object} world
   * @param {object} player
   */
  syncUnlocks(progression, world, player) {
    for (const id of progression.npcUnlocks) {
      if (this.npcs.has(id)) continue;
      if (!NPC_DEFS[id]) continue;
      // find or assign home near player spawn surface
      const home = this.findHome(world, player) || {
        x: player.pos.x + this.npcs.size * 3,
        y: world.surfaceY(player.pos.x, player.pos.z) + 1,
        z: player.pos.z + 4,
      };
      this.spawnNpc(id, home.x, home.y, home.z);
    }
  }

  findHome(world, player) {
    // scan near player for furniture signature
    const cx = Math.floor(player.pos.x);
    const cz = Math.floor(player.pos.z);
    for (let dx = -30; dx <= 30; dx += 2) {
      for (let dz = -30; dz <= 30; dz += 2) {
        const x = cx + dx;
        const z = cz + dz;
        const y = world.surfaceY(x, z) + 1;
        if (this.isValidHouse(world, x, y, z)) {
          return { x: x + 0.5, y, z: z + 0.5 };
        }
      }
    }
    return null;
  }

  isValidHouse(world, x, y, z) {
    let light = false;
    let seat = false;
    let surface = false;
    let door = false;
    for (let dy = 0; dy < 6; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        for (let dz = -4; dz <= 4; dz++) {
          const id = world.getBlock(x + dx, y + dy, z + dz);
          if (id === BlockId.TORCH) light = true;
          if (id === BlockId.CHAIR || id === BlockId.BENCH) seat = true;
          if (id === BlockId.TABLE || id === BlockId.WORKBENCH) surface = true;
          if (id === BlockId.DOOR) door = true;
        }
      }
    }
    return light && seat && surface && door;
  }

  spawnNpc(id, x, y, z) {
    const def = NPC_DEFS[id];
    if (!def) return null;
    const mesh = createEntitySprite(id, def.color, "npc", 0.85, 1.7, 0);
    mesh.position.set(x, y, z);
    this.group.add(mesh);
    const npc = {
      id,
      def,
      pos: new THREE.Vector3(x, y, z),
      mesh,
      home: new THREE.Vector3(x, y, z),
      talkCd: 0,
    };
    this.npcs.set(id, npc);
    return npc;
  }

  /**
   * @param {number} dt
   * @param {object} player
   */
  update(dt, _player) {
    for (const npc of this.npcs.values()) {
      npc.talkCd = Math.max(0, npc.talkCd - dt);
      // idle wander near home
      const toHome = npc.home.clone().sub(npc.pos);
      if (toHome.length() > 6) {
        toHome.normalize();
        npc.pos.x += toHome.x * 2 * dt;
        npc.pos.z += toHome.z * 2 * dt;
      } else if (Math.random() < dt * 0.3) {
        npc.pos.x += (Math.random() - 0.5) * 0.5;
        npc.pos.z += (Math.random() - 0.5) * 0.5;
      }
      const bob = Math.sin(performance.now() * 0.003 + npc.id.length) * 0.03;
      npc.mesh.position.set(npc.pos.x, npc.pos.y + bob, npc.pos.z);
    }
  }

  nearest(player, maxDist = 3.5) {
    let best = null;
    let bestD = maxDist;
    for (const npc of this.npcs.values()) {
      const d = npc.pos.distanceTo(player.pos);
      if (d < bestD) {
        bestD = d;
        best = npc;
      }
    }
    return best;
  }

  serialize() {
    return [...this.npcs.values()].map((n) => ({
      id: n.id,
      x: n.pos.x,
      y: n.pos.y,
      z: n.pos.z,
      hx: n.home.x,
      hy: n.home.y,
      hz: n.home.z,
    }));
  }

  deserialize(list, progression) {
    // clear
    for (const n of this.npcs.values()) {
      this.group.remove(n.mesh);
      n.mesh.geometry?.dispose?.();
      n.mesh.material?.dispose?.();
    }
    this.npcs.clear();
    if (Array.isArray(list)) {
      for (const row of list) {
        if (!NPC_DEFS[row.id]) continue;
        const n = this.spawnNpc(row.id, row.x, row.y, row.z);
        if (n) n.home.set(row.hx ?? row.x, row.hy ?? row.y, row.hz ?? row.z);
      }
    }
    // ensure unlocks present
    if (progression) {
      // homes will be assigned by syncUnlocks if missing
    }
  }
}

/**
 * @typedef {object} NPCInstance
 * @property {string} id
 * @property {object} def
 * @property {THREE.Vector3} pos
 * @property {THREE.Mesh} mesh
 * @property {THREE.Vector3} home
 * @property {number} talkCd
 */

/** Buy item if player has enough coins (copper value) */
export function buyItem(inventory, entry) {
  const price = entry.price || 0;
  const coins = countCoins(inventory);
  if (coins < price) return { ok: false, error: "Not enough coins" };
  if (!spendCoins(inventory, price)) return { ok: false, error: "Coin error" };
  const added = inventory.add(entry.item, 1);
  if (added < 1) {
    // refund
    giveCoins(inventory, price);
    return { ok: false, error: "Inventory full" };
  }
  return { ok: true };
}

export function countCoins(inventory) {
  return (
    inventory.count("copper_coin") +
    inventory.count("silver_coin") * 100 +
    inventory.count("gold_coin") * 10000 +
    inventory.count("platinum_coin") * 1000000
  );
}

export function giveCoins(inventory, amount) {
  let left = amount;
  const plat = Math.floor(left / 1000000);
  left %= 1000000;
  const gold = Math.floor(left / 10000);
  left %= 10000;
  const silver = Math.floor(left / 100);
  left %= 100;
  if (plat) inventory.add("platinum_coin", plat);
  if (gold) inventory.add("gold_coin", gold);
  if (silver) inventory.add("silver_coin", silver);
  if (left) inventory.add("copper_coin", left);
}

export function spendCoins(inventory, amount) {
  const total = countCoins(inventory);
  if (total < amount) return false;
  // strip all coins and re-give remainder
  const ids = ["copper_coin", "silver_coin", "gold_coin", "platinum_coin"];
  for (const id of ids) {
    const c = inventory.count(id);
    if (c) inventory.remove(id, c);
  }
  giveCoins(inventory, total - amount);
  return true;
}

export function sellItem(inventory, itemId, count = 1) {
  const def = ITEMS[itemId];
  if (!def || !inventory.remove(itemId, count)) return { ok: false };
  const value = Math.max(1, Math.floor((def.value || 10) * count * 0.25));
  giveCoins(inventory, value);
  return { ok: true, value };
}
