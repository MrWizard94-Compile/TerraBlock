/**
 * Timed buff/debuff system (potions, accessories, events).
 */

/** @type {Record<string, { id: string, name: string, color: string, def?: number, dmg?: number, speed?: number, regen?: number, jump?: number, light?: boolean, grav?: number }>} */
export const BUFF_DEFS = {
  ironskin: { id: "ironskin", name: "Ironskin", color: "#a0a0a0", def: 8 },
  regeneration: { id: "regeneration", name: "Regeneration", color: "#ff6b6b", regen: 2 },
  swiftness: { id: "swiftness", name: "Swiftness", color: "#74b9ff", speed: 1.25 },
  archery: { id: "archery", name: "Archery", color: "#55efc4", dmg: 1.2 },
  magic_power: { id: "magic_power", name: "Magic Power", color: "#a29bfe", dmg: 1.2 },
  shine: { id: "shine", name: "Shine", color: "#ffeaa7", light: true },
  hunter: { id: "hunter", name: "Hunter", color: "#fd79a8" },
  gills: { id: "gills", name: "Gills", color: "#0984e3" },
  gravitation: { id: "gravitation", name: "Gravitation", color: "#6c5ce7", grav: 0.55 },
  thorns: { id: "thorns", name: "Thorns", color: "#00b894" },
  well_fed: { id: "well_fed", name: "Well Fed", color: "#e17055", regen: 1, def: 2, speed: 1.05 },
  panic: { id: "panic", name: "Panic!", color: "#ff7675", speed: 1.4 },
  battle: { id: "battle", name: "Battle", color: "#d63031" },
  calm: { id: "calm", name: "Calm", color: "#81ecec" },
  mining: { id: "mining", name: "Mining", color: "#b2bec3" },
  builder: { id: "builder", name: "Builder", color: "#fdcb6e" },
  tipsyman: { id: "tipsyman", name: "Tipsy", color: "#fab1a0", def: -2, dmg: 1.1 },
  potion_sickness: { id: "potion_sickness", name: "Potion Sickness", color: "#636e72" },
};

export class BuffManager {
  constructor() {
    /** @type {{ id: string, remaining: number }[]} */
    this.active = [];
  }

  /**
   * @param {string} id
   * @param {number} durationSec
   */
  apply(id, durationSec) {
    if (!BUFF_DEFS[id]) return false;
    const existing = this.active.find((b) => b.id === id);
    if (existing) {
      existing.remaining = Math.max(existing.remaining, durationSec);
    } else {
      this.active.push({ id, remaining: durationSec });
    }
    return true;
  }

  has(id) {
    return this.active.some((b) => b.id === id);
  }

  /** @param {number} dt */
  update(dt) {
    for (const b of this.active) b.remaining -= dt;
    this.active = this.active.filter((b) => b.remaining > 0);
  }

  /** Aggregate combat/movement mods from buffs */
  mods() {
    let def = 0;
    let dmg = 1;
    let speed = 1;
    let regen = 0;
    let jump = 1;
    let grav = 1;
    let light = false;
    for (const b of this.active) {
      const d = BUFF_DEFS[b.id];
      if (!d) continue;
      def += d.def || 0;
      if (d.dmg) dmg *= d.dmg;
      if (d.speed) speed *= d.speed;
      regen += d.regen || 0;
      if (d.jump) jump *= d.jump;
      if (d.grav) grav *= d.grav;
      if (d.light) light = true;
    }
    return { def, dmg, speed, regen, jump, grav, light };
  }

  list() {
    return this.active.map((b) => ({
      ...BUFF_DEFS[b.id],
      remaining: b.remaining,
    }));
  }

  serialize() {
    return this.active.map((b) => ({ id: b.id, remaining: b.remaining }));
  }

  deserialize(data) {
    this.active = [];
    if (!Array.isArray(data)) return;
    for (const b of data) {
      if (b?.id && BUFF_DEFS[b.id]) {
        this.active.push({ id: b.id, remaining: Number(b.remaining) || 0 });
      }
    }
  }
}
