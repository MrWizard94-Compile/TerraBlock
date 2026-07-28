/**
 * Mount system — temporary rideable forms with speed/jump bonuses.
 */
import { ITEMS } from "./items.js";

/** @type {Record<string, { id: string, name: string, speed: number, jump: number, color: number, fly?: boolean }>} */
export const MOUNT_DEFS = {
  bunny: { id: "bunny", name: "Bunny Mount", speed: 1.35, jump: 1.25, color: 0xf5f0e6 },
  slime: { id: "slime", name: "Slime Mount", speed: 1.2, jump: 1.6, color: 0x74b9ff },
  unicorn: { id: "unicorn", name: "Unicorn Mount", speed: 1.7, jump: 1.3, color: 0xf8c8dc },
  baselisk: { id: "baselisk", name: "Basilisk Mount", speed: 1.55, jump: 1.1, color: 0x27ae60 },
  ufo: { id: "ufo", name: "UFO Mount", speed: 1.4, jump: 1.0, color: 0x81ecec, fly: true },
  witch_broom: { id: "witch_broom", name: "Witch's Broom", speed: 1.5, jump: 1.0, color: 0x6c5ce7, fly: true },
  cute_fishron: { id: "cute_fishron", name: "Cute Fishron", speed: 1.65, jump: 1.2, color: 0x00cec9, fly: true },
};

export class MountSystem {
  constructor() {
    /** @type {string|null} */
    this.active = null;
    this.cooldown = 0;
  }

  get def() {
    return this.active ? MOUNT_DEFS[this.active] : null;
  }

  /**
   * Toggle mount from inventory item.
   * @param {string} itemId
   */
  toggle(itemId) {
    const def = ITEMS[itemId];
    if (!def?.mount) return { ok: false, error: "Not a mount" };
    if (this.cooldown > 0) return { ok: false, error: "Mount cooldown" };
    if (this.active === def.mount) {
      this.active = null;
      this.cooldown = 0.4;
      return { ok: true, active: null };
    }
    this.active = def.mount;
    this.cooldown = 0.4;
    return { ok: true, active: this.active, name: MOUNT_DEFS[this.active]?.name };
  }

  dismount() {
    this.active = null;
  }

  /** @param {number} dt */
  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
  }

  mods() {
    const d = this.def;
    if (!d) return { speed: 1, jump: 1, fly: false };
    return { speed: d.speed, jump: d.jump, fly: !!d.fly };
  }

  serialize() {
    return { active: this.active };
  }

  deserialize(data) {
    this.active = data?.active && MOUNT_DEFS[data.active] ? data.active : null;
  }
}
