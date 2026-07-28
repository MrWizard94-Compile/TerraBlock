/**
 * World events: Goblin Army, Solar Eclipse, Pirate Invasion, Frost Legion, Martian Madness.
 */

const EVENT_TABLE = {
  goblin_army: {
    goal: 45,
    timer: 320,
    pool: ["goblin_peon", "goblin_thief", "goblin_warrior", "goblin_sorcerer"],
    label: "Goblin Army",
  },
  solar_eclipse: {
    goal: 65,
    timer: 380,
    pool: ["vampire", "frankenstein", "swollen_zombie", "eyezor"],
    label: "Solar Eclipse",
  },
  pirate_invasion: {
    goal: 55,
    timer: 340,
    pool: ["pirate_deckhand", "pirate_corsair", "pirate_crossbower", "pirate_deadeye"],
    label: "Pirate Invasion",
  },
  frost_legion: {
    goal: 50,
    timer: 320,
    pool: ["snowman_gangsta", "mister_stabby", "snow_balla"],
    label: "Frost Legion",
  },
  martian_madness: {
    goal: 70,
    timer: 400,
    pool: ["martian_drone", "martian_walker", "martian_officer", "scutlix"],
    label: "Martian Madness",
  },
};

export class EventManager {
  constructor() {
    /** @type {null | { type: string, wave: number, killed: number, goal: number, active: boolean, timer: number }} */
    this.current = null;
    this.cooldown = 0;
    this.defeated = new Set();
  }

  get active() {
    return this.current?.active ? this.current : null;
  }

  /**
   * @param {keyof typeof EVENT_TABLE} type
   */
  start(type) {
    if (this.current?.active) return false;
    const def = EVENT_TABLE[type];
    if (!def) return false;
    this.current = {
      type,
      wave: 1,
      killed: 0,
      goal: def.goal,
      active: true,
      timer: def.timer,
    };
    return true;
  }

  onEnemyKilled(type) {
    if (!this.current?.active) return null;
    const def = EVENT_TABLE[this.current.type];
    if (!def?.pool.includes(type)) return null;
    this.current.killed++;
    if (this.current.killed >= this.current.goal) {
      const finished = this.current.type;
      this.defeated.add(finished);
      this.current.active = false;
      this.current = null;
      this.cooldown = 100;
      return finished;
    }
    return null;
  }

  /**
   * @param {number} dt
   * @param {object} game
   */
  update(dt, game) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    const prog = game.progression;

    if (!this.current?.active) {
      // goblins at dusk
      if (
        this.cooldown <= 0 &&
        game.dayNight?.time > 0.78 &&
        game.dayNight?.time < 0.805 &&
        (prog?.bossesDefeated?.size || 0) >= 1 &&
        Math.random() < 0.1
      ) {
        this.start("goblin_army");
        game.ui?.toast("A Goblin Army is approaching!");
        game.audio?.play("boss");
      }
      // eclipse hardmode morning
      if (
        this.cooldown <= 0 &&
        prog?.hardmode &&
        game.dayNight?.time > 0.2 &&
        game.dayNight?.time < 0.22 &&
        Math.random() < 0.07
      ) {
        this.start("solar_eclipse");
        prog.eclipseSeen = true;
        game.ui?.toast("A solar eclipse is happening!");
        game.audio?.play("blood");
      }
      // pirates after one mech
      if (
        this.cooldown <= 0 &&
        (prog?.downedMechCount || 0) >= 1 &&
        game.dayNight?.time > 0.35 &&
        game.dayNight?.time < 0.37 &&
        Math.random() < 0.06
      ) {
        this.start("pirate_invasion");
        game.ui?.toast("Pirates are approaching from the sea!");
        game.audio?.play("boss");
      }
      // frost after hardmode snow night
      if (
        this.cooldown <= 0 &&
        prog?.hardmode &&
        game.dayNight?.isNight &&
        Math.random() < dt * 0.002
      ) {
        this.start("frost_legion");
        game.ui?.toast("The Frost Legion is marching!");
        game.audio?.play("boss");
      }
      // martians post-golem
      if (
        this.cooldown <= 0 &&
        prog?.bossesDefeated?.has("golem") &&
        game.dayNight?.time > 0.5 &&
        game.dayNight?.time < 0.52 &&
        Math.random() < 0.05
      ) {
        this.start("martian_madness");
        game.ui?.toast("Martian probe detected… invasion incoming!");
        game.audio?.play("boss");
      }
      return;
    }

    this.current.timer -= dt;
    if (this.current.timer <= 0) {
      const label = EVENT_TABLE[this.current.type]?.label || this.current.type;
      game.ui?.toast(`${label} has ended…`);
      this.current = null;
      this.cooldown = 80;
      return;
    }

    const def = EVENT_TABLE[this.current.type];
    if (Math.random() < dt * 1.35 && game.entities) {
      const p = game.player.pos;
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 18;
      const x = p.x + Math.cos(angle) * dist;
      const z = p.z + Math.sin(angle) * dist;
      const y = game.world.surfaceY(x, z) + 1;
      const type = def.pool[(Math.random() * def.pool.length) | 0];
      if (!game.world.isSolidAt(x, y, z)) {
        game.entities.spawnEnemy(type, x, y, z);
      }
    }
  }

  serialize() {
    return {
      current: this.current,
      cooldown: this.cooldown,
      defeated: [...this.defeated],
    };
  }

  deserialize(data) {
    if (!data) return;
    this.current = data.current || null;
    this.cooldown = data.cooldown || 0;
    this.defeated = new Set(data.defeated || []);
  }
}

export { EVENT_TABLE };
