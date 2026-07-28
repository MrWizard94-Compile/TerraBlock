/**
 * Progressive Guide tips — teaches the real loop without a tutorial modal.
 */
export const GUIDE_STEPS = [
  {
    id: "camp",
    text: "Guide: Your cabin has a Work Bench & Furnace. Open E while standing inside.",
    when: (g) => (g.player?.playTime || 0) > 3,
  },
  {
    id: "chest",
    text: "Guide: Break the chest for copper & iron ore. Smelt bars at the Furnace.",
    when: (g) => (g.player?.playTime || 0) > 12,
  },
  {
    id: "smelt",
    text: "Guide: 3 ore → 1 bar at Furnace. Craft an Anvil (5 iron bars) at the Work Bench.",
    when: (g) => g.player?.inventory?.count("copper_ore") > 0 || g.player?.inventory?.count("iron_ore") > 0,
  },
  {
    id: "anvil",
    text: "Guide: Place Anvil, then craft Copper/Iron armor & tools. Shift-click crafts all.",
    when: (g) => g.player?.inventory?.count("iron_bar") >= 3 || g.player?.inventory?.count("anvil") > 0,
  },
  {
    id: "trees",
    text: "Guide: Use your Axe on trees. Wood + Work Bench = furniture, weapons, more torches.",
    when: (g) => (g.player?.playTime || 0) > 40,
  },
  {
    id: "explore",
    text: "Guide: Dig down for silver/gold. Cave cabins hide chests with rare loot.",
    when: (g) => (g.player?.playTime || 0) > 90,
  },
  {
    id: "night",
    text: "Guide: Night spawns zombies. Stay near light. Craft Healing Potions from mushrooms + gel.",
    when: (g) => g.dayNight?.isNight,
  },
  {
    id: "house",
    text: "Guide: Valid house = door + table + chair + torch. Then townsfolk move in (T to talk).",
    when: (g) => (g.player?.playTime || 0) > 120,
  },
  {
    id: "boss1",
    text: "Guide: Craft a Slime Crown or Suspicious Eye (E → Boss tab) and press F to summon.",
    when: (g) => (g.player?.playTime || 0) > 180 || (g.player?.killCount || 0) > 15,
  },
  {
    id: "hardmode",
    text: "Guide: Defeat Wall of Flesh in the Underworld to unlock Hardmode.",
    when: (g) => (g.progression?.bossesDefeated?.size || 0) >= 4 && !g.progression?.hardmode,
  },
  {
    id: "hardmode_on",
    text: "Guide: HARDMODE! New ores and bosses await. Gear up before the Twins.",
    when: (g) => !!g.progression?.hardmode,
  },
];

export class GuideSystem {
  constructor() {
    /** @type {Set<string>} */
    this.shown = new Set();
    this.cooldown = 0;
  }

  /**
   * @param {number} dt
   * @param {object} game
   */
  update(dt, game) {
    if (!game.playing || game.paused || game.player?.dead) return;
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.cooldown > 0) return;
    for (const step of GUIDE_STEPS) {
      if (this.shown.has(step.id)) continue;
      try {
        if (step.when(game)) {
          this.shown.add(step.id);
          game.ui?.showTip?.(step.text, 8);
          this.cooldown = 25;
          return;
        }
      } catch {
        /* ignore tip errors */
      }
    }
  }

  serialize() {
    return [...this.shown];
  }

  deserialize(data) {
    this.shown = new Set(Array.isArray(data) ? data : []);
  }
}
