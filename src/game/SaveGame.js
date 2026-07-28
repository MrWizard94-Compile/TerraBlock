/**
 * Local save slots for TerraBlock.
 * v4 format with migration from v2/v3.
 */

const SLOT_KEYS = ["terrablock_save_v4", "terrablock_save_v3", "terrablock_save_v2"];
export const SAVE_VERSION = 4;

/**
 * @typedef {object} SaveData
 * @property {number} version
 * @property {number} seed
 * @property {number} savedAt
 * @property {number} playTime
 * @property {number} dayTime
 * @property {object} player
 * @property {number[][]} modifications
 * @property {string[]} achievements
 * @property {boolean} [bloodMoon]
 */

/**
 * @param {object} game
 * @returns {SaveData}
 */
export function buildSave(game) {
  const p = game.player;
  return {
    version: SAVE_VERSION,
    seed: game.worldSeed >>> 0,
    savedAt: Date.now(),
    playTime: p.playTime || 0,
    dayTime: game.dayNight.time,
    bloodMoon: !!game.dayNight.bloodMoon,
    player: {
      x: p.pos.x,
      y: p.pos.y,
      z: p.pos.z,
      yaw: p.yaw,
      pitch: p.pitch,
      hp: p.hp,
      maxHp: p.maxHp,
      mana: p.mana,
      maxMana: p.maxMana,
      killCount: p.killCount,
      bossesDefeated: [...(game.progression?.bossesDefeated || p.bossesDefeated || [])],
      inventory: p.inventory.serialize(),
      equipment: p.inventory.serializeEquipment(),
    },
    modifications: game.world.exportModifications(),
    doorState: game.world.exportDoorState?.() || { open: [], facing: [] },
    achievements: game.achievements.serialize(),
    progression: game.progression?.serialize?.(),
    events: game.events?.serialize?.(),
    buffs: p.buffs?.serialize?.(),
    npcs: game.npcs?.serialize?.(),
    minimap: game.minimap?.serialize?.(),
    bestiary: game.bestiary?.serialize?.(),
    mounts: p.mounts?.serialize?.(),
    piggy: p.inventory.serializePiggy?.(),
    victory: !!game.victory,
    guide: game.guide?.serialize?.(),
  };
}

/**
 * Migrate older saves to v4 shape.
 * @param {object} data
 * @returns {SaveData | null}
 */
export function migrateSave(data) {
  if (!data || typeof data !== "object") return null;
  const v = Number(data.version) || 0;
  if (v > SAVE_VERSION) return null;
  if (!Number.isFinite(data.seed) || !data.player) return null;
  if (!Array.isArray(data.modifications)) data.modifications = [];

  const out = {
    ...data,
    version: SAVE_VERSION,
    modifications: data.modifications,
    achievements: Array.isArray(data.achievements) ? data.achievements : [],
    bloodMoon: !!data.bloodMoon,
    progression: data.progression || {
      hardmode: false,
      difficulty: "classic",
      bossesDefeated: data.player?.bossesDefeated || [],
      goblinsDefeated: false,
      piratesDefeated: false,
      frostDefeated: false,
      martiansDefeated: false,
      eclipseSeen: false,
      npcUnlocks: ["guide", "merchant"],
    },
    events: data.events || { current: null, cooldown: 0, defeated: [] },
    buffs: data.buffs || [],
    npcs: data.npcs || [],
    minimap: data.minimap || [],
    bestiary: data.bestiary || { kills: [], seen: [] },
    mounts: data.mounts || { active: null },
    piggy: data.piggy || [],
    victory: !!data.victory,
    guide: data.guide || [],
  };
  return out;
}

/**
 * @param {SaveData} data
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateSave(data) {
  if (!data || typeof data !== "object") return { ok: false, error: "Missing save data" };
  if (!Number.isFinite(data.seed)) return { ok: false, error: "Invalid seed" };
  if (!data.player || !Array.isArray(data.modifications)) return { ok: false, error: "Corrupt save" };
  if (data.version !== SAVE_VERSION) {
    const m = migrateSave(data);
    if (!m) return { ok: false, error: `Unsupported save version ${data.version}` };
  }
  return { ok: true };
}

/** @param {SaveData} data */
export function writeSave(data) {
  const migrated = data.version === SAVE_VERSION ? data : migrateSave(data);
  const v = validateSave(migrated);
  if (!v.ok) throw new Error(v.error);
  try {
    localStorage.setItem(SLOT_KEYS[0], JSON.stringify(migrated));
    return true;
  } catch (e) {
    throw new Error(`Save failed: ${e?.message || e}`);
  }
}

/** @returns {SaveData | null} */
export function readSave() {
  try {
    for (const key of SLOT_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      let data = JSON.parse(raw);
      if (data.version !== SAVE_VERSION) {
        data = migrateSave(data);
      }
      if (!data) continue;
      const v = validateSave(data);
      if (v.ok) return data.version === SAVE_VERSION ? data : migrateSave(data);
    }
    return null;
  } catch {
    return null;
  }
}

export function hasSave() {
  return readSave() !== null;
}

export function deleteSave() {
  try {
    for (const key of SLOT_KEYS) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * @param {object} game
 * @param {SaveData} data
 */
export function applySave(game, data) {
  const raw = data.version === SAVE_VERSION ? data : migrateSave(data);
  if (!raw) throw new Error("Invalid save");
  const v = validateSave(raw);
  if (!v.ok) throw new Error(v.error);

  game.dayNight.time = raw.dayTime ?? 0.25;
  game.dayNight.bloodMoon = !!raw.bloodMoon;
  game.victory = !!raw.victory;

  const p = game.player;
  const pl = raw.player;
  p.pos.set(pl.x, pl.y, pl.z);
  p.yaw = pl.yaw || 0;
  p.pitch = pl.pitch || 0;
  p.maxHp = pl.maxHp ?? 120;
  p.hp = Math.min(pl.hp ?? p.maxHp, p.maxHp);
  p.maxMana = pl.maxMana ?? 40;
  p.mana = Math.min(pl.mana ?? p.maxMana, p.maxMana);
  p.killCount = pl.killCount || 0;
  p.bossesDefeated = new Set(pl.bossesDefeated || []);
  p.playTime = raw.playTime || 0;
  p.dead = false;
  p.inventory.deserialize(pl.inventory);
  p.inventory.deserializeEquipment(pl.equipment);
  p.recomputeStats();
  p.syncCamera();

  game.world.importModifications(raw.modifications || []);
  game.world.importDoorState?.(raw.doorState);
  game.achievements.deserialize(raw.achievements || []);
  if (raw.progression) game.progression?.deserialize(raw.progression);
  if (raw.events) game.events?.deserialize(raw.events);
  if (raw.buffs) p.buffs?.deserialize(raw.buffs);
  if (raw.npcs) game.npcs?.deserialize(raw.npcs, game.progression);
  if (raw.minimap) game.minimap?.deserialize(raw.minimap);
  if (raw.bestiary) game.bestiary?.deserialize(raw.bestiary);
  if (raw.guide) game.guide?.deserialize(raw.guide);
  if (raw.mounts) p.mounts?.deserialize(raw.mounts);
  if (raw.piggy) p.inventory.deserializePiggy?.(raw.piggy);
  game.world.hardmode = !!game.progression?.hardmode;
  p.bossesDefeated = new Set(game.progression?.bossesDefeated || p.bossesDefeated);

  game.world.updateChunksAround(p.pos.x, p.pos.z);
  for (let i = 0; i < 40; i++) game.world.rebuildDirty(12);
}
