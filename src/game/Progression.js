/**
 * World progression: boss checklist, hardmode, difficulty, invasion unlocks, NPCs.
 */

/**
 * Classic is forgiving (Terraria-like starter): lower contact damage, longer i-frames.
 * Expert/Master step up; base enemy table is already tuned for Classic.
 */
export const DIFFICULTY = {
  classic: {
    id: "classic",
    name: "Classic",
    enemyHp: 1,
    enemyDmg: 0.85,
    playerDmgTaken: 0.7,
    loot: 1,
    invuln: 0.95,
    touchCd: 1.25,
  },
  expert: {
    id: "expert",
    name: "Expert",
    enemyHp: 1.55,
    enemyDmg: 1.15,
    playerDmgTaken: 1.15,
    loot: 1.35,
    invuln: 0.7,
    touchCd: 1.0,
  },
  master: {
    id: "master",
    name: "Master",
    enemyHp: 2.1,
    enemyDmg: 1.45,
    playerDmgTaken: 1.55,
    loot: 1.7,
    invuln: 0.55,
    touchCd: 0.85,
  },
};

export const BOSS_CHAIN = [
  { id: "king_slime", name: "King Slime", tier: 1, preHardmode: true },
  { id: "eye", name: "Eye of Cthulhu", tier: 1, preHardmode: true },
  { id: "eater", name: "Eater of Worlds", tier: 1, preHardmode: true },
  { id: "brain", name: "Brain of Cthulhu", tier: 1, preHardmode: true },
  { id: "queen_bee", name: "Queen Bee", tier: 2, preHardmode: true },
  { id: "skeletron", name: "Skeletron", tier: 2, preHardmode: true },
  { id: "deerclops", name: "Deerclops", tier: 2, preHardmode: true },
  { id: "wall", name: "Wall of Flesh", tier: 3, preHardmode: true, unlocksHardmode: true },
  { id: "queen_slime", name: "Queen of Slimes", tier: 4, preHardmode: false },
  { id: "twins", name: "The Twins", tier: 4, preHardmode: false },
  { id: "destroyer", name: "The Destroyer", tier: 4, preHardmode: false },
  { id: "prime", name: "Skeletron Prime", tier: 4, preHardmode: false },
  { id: "plantera", name: "Plantera", tier: 5, preHardmode: false },
  { id: "golem", name: "Golem", tier: 5, preHardmode: false },
  { id: "empress", name: "Empress of Light", tier: 5, preHardmode: false },
  { id: "duke", name: "Duke Fishron", tier: 5, preHardmode: false },
  { id: "cultist", name: "Lunatic Cultist", tier: 6, preHardmode: false },
  { id: "moonlord", name: "Moon Lord", tier: 7, preHardmode: false },
];

export class Progression {
  constructor() {
    this.hardmode = false;
    /** @type {'classic'|'expert'|'master'} */
    this.difficulty = "classic";
    /** @type {Set<string>} */
    this.bossesDefeated = new Set();
    this.goblinsDefeated = false;
    this.piratesDefeated = false;
    this.frostDefeated = false;
    this.martiansDefeated = false;
    this.eclipseSeen = false;
    this.downedMechCount = 0;
    this.npcUnlocks = new Set(["guide"]);
  }

  get diff() {
    return DIFFICULTY[this.difficulty] || DIFFICULTY.classic;
  }

  setDifficulty(id) {
    if (DIFFICULTY[id]) this.difficulty = id;
  }

  onBossKill(type) {
    this.bossesDefeated.add(type);
    const def = BOSS_CHAIN.find((b) => b.id === type);
    if (def?.unlocksHardmode) {
      this.hardmode = true;
    }
    if (["twins", "destroyer", "prime"].includes(type)) {
      this.downedMechCount = ["twins", "destroyer", "prime"].filter((id) =>
        this.bossesDefeated.has(id)
      ).length;
    }
    this.refreshNpcUnlocks();
    return {
      hardmodeJustUnlocked: def?.unlocksHardmode === true,
      name: def?.name || type,
    };
  }

  refreshNpcUnlocks() {
    this.npcUnlocks.add("guide");
    this.npcUnlocks.add("merchant");
    if (this.bossesDefeated.has("eye") || this.bossesDefeated.has("king_slime")) {
      this.npcUnlocks.add("nurse");
    }
    if (this.bossesDefeated.has("eater") || this.bossesDefeated.has("brain")) {
      this.npcUnlocks.add("demolitionist");
      this.npcUnlocks.add("dryad");
    }
    if (this.bossesDefeated.has("skeletron")) this.npcUnlocks.add("clothier");
    if (this.bossesDefeated.has("wall") || this.hardmode) {
      this.npcUnlocks.add("wizard");
      this.npcUnlocks.add("steampunker");
      this.npcUnlocks.add("pirate");
    }
    if (this.bossesDefeated.has("plantera")) this.npcUnlocks.add("witch_doctor");
    if (this.bossesDefeated.has("golem")) this.npcUnlocks.add("cyborg");
    if (this.goblinsDefeated) this.npcUnlocks.add("goblin_tinkerer");
    if (this.bossesDefeated.has("queen_bee")) this.npcUnlocks.add("arms_dealer");
    if (this.piratesDefeated) this.npcUnlocks.add("pirate");
    if (this.frostDefeated) this.npcUnlocks.add("santa");
    if (this.martiansDefeated) this.npcUnlocks.add("cyborg");
    if (this.bossesDefeated.has("moonlord")) this.npcUnlocks.add("princess");
  }

  bossProgress() {
    return BOSS_CHAIN.map((b) => ({
      ...b,
      defeated: this.bossesDefeated.has(b.id),
      locked: !b.preHardmode && !this.hardmode,
    }));
  }

  completionRatio() {
    return this.bossesDefeated.size / BOSS_CHAIN.length;
  }

  serialize() {
    return {
      hardmode: this.hardmode,
      difficulty: this.difficulty,
      bossesDefeated: [...this.bossesDefeated],
      goblinsDefeated: this.goblinsDefeated,
      piratesDefeated: this.piratesDefeated,
      frostDefeated: this.frostDefeated,
      martiansDefeated: this.martiansDefeated,
      eclipseSeen: this.eclipseSeen,
      npcUnlocks: [...this.npcUnlocks],
    };
  }

  deserialize(data) {
    if (!data) return;
    this.hardmode = !!data.hardmode;
    this.difficulty = DIFFICULTY[data.difficulty] ? data.difficulty : "classic";
    this.bossesDefeated = new Set(data.bossesDefeated || []);
    this.goblinsDefeated = !!data.goblinsDefeated;
    this.piratesDefeated = !!data.piratesDefeated;
    this.frostDefeated = !!data.frostDefeated;
    this.martiansDefeated = !!data.martiansDefeated;
    this.eclipseSeen = !!data.eclipseSeen;
    this.npcUnlocks = new Set(data.npcUnlocks || ["guide"]);
    this.refreshNpcUnlocks();
  }
}
