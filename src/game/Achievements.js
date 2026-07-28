/**
 * Achievement tracking — full campaign + systems.
 */

/** @type {Record<string, { id: string, name: string, desc: string }>} */
export const ACHIEVEMENT_DEFS = {
  first_blood: { id: "first_blood", name: "First Blood", desc: "Defeat any enemy" },
  miner: { id: "miner", name: "Miner", desc: "Break 100 blocks" },
  builder: { id: "builder", name: "Builder", desc: "Place 50 blocks" },
  night_owl: { id: "night_owl", name: "Night Owl", desc: "Survive until midnight" },
  craftsman: { id: "craftsman", name: "Craftsman", desc: "Craft 10 items" },
  slime_king: { id: "slime_king", name: "Gelatinous", desc: "Defeat King Slime" },
  eye_slayer: { id: "eye_slayer", name: "Eye for an Eye", desc: "Defeat Eye of Cthulhu" },
  worm_slayer: { id: "worm_slayer", name: "Worm Food", desc: "Defeat Eater of Worlds" },
  brain_dead: { id: "brain_dead", name: "Mind over Matter", desc: "Defeat Brain of Cthulhu" },
  bee_keeper: { id: "bee_keeper", name: "Not the Bees", desc: "Defeat Queen Bee" },
  bone_collector: { id: "bone_collector", name: "Bone Collector", desc: "Defeat Skeletron" },
  deer_hunter: { id: "deer_hunter", name: "Winter is Coming", desc: "Defeat Deerclops" },
  hell_walker: { id: "hell_walker", name: "Hell Walker", desc: "Defeat the Wall of Flesh" },
  hardmode: { id: "hardmode", name: "Welcome to Hardmode", desc: "Enter Hardmode" },
  queen_slime: { id: "queen_slime", name: "Royal Jelly", desc: "Defeat Queen of Slimes" },
  twins: { id: "twins", name: "Seeing Double", desc: "Defeat The Twins" },
  destroyer: { id: "destroyer", name: "Dismantled", desc: "Defeat The Destroyer" },
  prime: { id: "prime", name: "Prime Time", desc: "Defeat Skeletron Prime" },
  plantera: { id: "plantera", name: "Photosynthesis", desc: "Defeat Plantera" },
  golem: { id: "golem", name: "Temple Raider", desc: "Defeat Golem" },
  empress: { id: "empress", name: "Prism Break", desc: "Defeat Empress of Light" },
  duke: { id: "duke", name: "Fish Out of Water", desc: "Defeat Duke Fishron" },
  cultist: { id: "cultist", name: "Cult Classic", desc: "Defeat Lunatic Cultist" },
  moonlord: { id: "moonlord", name: "Terrarian", desc: "Defeat Moon Lord" },
  champion: { id: "champion", name: "Champion", desc: "Defeat 10 bosses" },
  completionist: { id: "completionist", name: "Completionist", desc: "Defeat all 18 bosses" },
  armored: { id: "armored", name: "Armored", desc: "Equip a full armor set" },
  deep_diver: { id: "deep_diver", name: "Deep Diver", desc: "Reach Y < 12" },
  blood_survivor: { id: "blood_survivor", name: "Blood Moon Survivor", desc: "Survive a Blood Moon" },
  goblin_slayer: { id: "goblin_slayer", name: "Goblin Slayer", desc: "Defeat a Goblin Army" },
  pirate_slayer: { id: "pirate_slayer", name: "Yarr!", desc: "Defeat a Pirate Invasion" },
  reforge_master: { id: "reforge_master", name: "Lucky Roll", desc: "Reforge an item" },
  cowboy: { id: "cowboy", name: "Saddle Up", desc: "Use a mount" },
  angler: { id: "angler", name: "Hook, Line…", desc: "Catch a fish" },
  bestiary_50: { id: "bestiary_50", name: "Naturalist", desc: "Unlock 50% of bestiary" },
};

const BOSS_ACH = {
  king_slime: "slime_king",
  eye: "eye_slayer",
  eater: "worm_slayer",
  brain: "brain_dead",
  queen_bee: "bee_keeper",
  skeletron: "bone_collector",
  deerclops: "deer_hunter",
  wall: "hell_walker",
  queen_slime: "queen_slime",
  twins: "twins",
  destroyer: "destroyer",
  prime: "prime",
  plantera: "plantera",
  golem: "golem",
  empress: "empress",
  duke: "duke",
  cultist: "cultist",
  moonlord: "moonlord",
};

export class Achievements {
  constructor() {
    /** @type {Set<string>} */
    this.unlocked = new Set();
    this.blocksBroken = 0;
    this.blocksPlaced = 0;
    this.crafts = 0;
    this.sawMidnight = false;
    this.survivedBloodMoon = false;
    /** @type {((id: string, def: object) => void) | null} */
    this.onUnlock = null;
  }

  serialize() {
    return [...this.unlocked];
  }

  /** @param {string[]} list */
  deserialize(list) {
    this.unlocked = new Set(Array.isArray(list) ? list : []);
  }

  has(id) {
    return this.unlocked.has(id);
  }

  /** @param {string} id */
  unlock(id) {
    if (this.unlocked.has(id)) return false;
    const def = ACHIEVEMENT_DEFS[id];
    if (!def) return false;
    this.unlocked.add(id);
    this.onUnlock?.(id, def);
    return true;
  }

  onKill(enemyType, bossesDefeated) {
    this.unlock("first_blood");
    const ach = BOSS_ACH[enemyType];
    if (ach) this.unlock(ach);
    if (enemyType === "wall") this.unlock("hardmode");
    const n = bossesDefeated?.size || 0;
    if (n >= 10) this.unlock("champion");
    if (n >= 18) this.unlock("completionist");
  }

  onBreak() {
    this.blocksBroken++;
    if (this.blocksBroken >= 100) this.unlock("miner");
  }

  onPlace() {
    this.blocksPlaced++;
    if (this.blocksPlaced >= 50) this.unlock("builder");
  }

  onCraft() {
    this.crafts++;
    if (this.crafts >= 10) this.unlock("craftsman");
  }

  onTime(time, isNight) {
    if (time >= 0.0 && time < 0.05 && isNight) {
      this.sawMidnight = true;
      this.unlock("night_owl");
    }
  }

  onDepth(y) {
    if (y < 12) this.unlock("deep_diver");
  }

  onArmorComplete() {
    this.unlock("armored");
  }

  onBloodMoonEnd() {
    this.survivedBloodMoon = true;
    this.unlock("blood_survivor");
  }

  onEvent(type) {
    if (type === "goblin_army") this.unlock("goblin_slayer");
    if (type === "pirate_invasion") this.unlock("pirate_slayer");
  }

  onReforge() {
    this.unlock("reforge_master");
  }

  onMount() {
    this.unlock("cowboy");
  }

  onFish() {
    this.unlock("angler");
  }

  onBestiary(ratio) {
    if (ratio >= 0.5) this.unlock("bestiary_50");
  }

  list() {
    return Object.values(ACHIEVEMENT_DEFS).map((d) => ({
      ...d,
      unlocked: this.unlocked.has(d.id),
    }));
  }
}
