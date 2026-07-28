/**
 * Bestiary — kill tracking and unlock lore.
 */
import { ENEMY_TYPES } from "./enemies.js";

export class Bestiary {
  constructor() {
    /** @type {Map<string, number>} */
    this.kills = new Map();
    /** @type {Set<string>} */
    this.seen = new Set();
  }

  onKill(type) {
    this.seen.add(type);
    this.kills.set(type, (this.kills.get(type) || 0) + 1);
  }

  onSee(type) {
    this.seen.add(type);
  }

  entries() {
    return Object.keys(ENEMY_TYPES).map((id) => {
      const def = ENEMY_TYPES[id];
      const kills = this.kills.get(id) || 0;
      const unlocked = this.seen.has(id) || kills > 0;
      return {
        id,
        name: unlocked ? def.name : "???",
        boss: !!def.boss,
        kills,
        unlocked,
        hp: unlocked ? def.hp : "?",
        damage: unlocked ? def.damage : "?",
      };
    });
  }

  completion() {
    const total = Object.keys(ENEMY_TYPES).length;
    const unlocked = [...this.seen].filter((id) => ENEMY_TYPES[id]).length;
    return total ? unlocked / total : 0;
  }

  serialize() {
    return {
      kills: [...this.kills.entries()],
      seen: [...this.seen],
    };
  }

  deserialize(data) {
    this.kills = new Map(data?.kills || []);
    this.seen = new Set(data?.seen || []);
  }
}
