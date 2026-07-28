/**
 * Playtest bridge — eyes (structured state) + hands (virtual controls / high-level commands).
 * Exposed on window only when playtest mode is enabled (?playtest=1).
 */

import { BLOCKS, BlockId } from "./blocks.js";
import { ITEMS } from "./items.js";
import { getAllRecipes, canCraft, craftMany, getRecipe } from "./crafting.js";
import { ENEMY_TYPES } from "./enemies.js";
import { stationsNear, formatStations } from "./Stations.js";

export function isPlaytestEnabled() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("playtest") === "1" || params.get("playtest") === "true") return true;
    if (localStorage.getItem("terrablock_playtest") === "1") return true;
  } catch {
    /* non-browser */
  }
  return false;
}

/**
 * @param {import('./Game.js').Game} game
 */
export function attachPlaytestBridge(game) {
  if (!isPlaytestEnabled()) return null;

  const bridge = new PlaytestBridge(game);
  try {
    window.__TERRABLOCK_PLAYTEST__ = bridge;
    window.__TERRABLOCK_READY__ = false;
  } catch {
    /* ignore */
  }
  game.playtest = bridge;
  return bridge;
}

export class PlaytestBridge {
  /** @param {import('./Game.js').Game} game */
  constructor(game) {
    this.game = game;
    this.version = 2;
    this._log = [];
    this._maxLog = 200;
    this._autoActions = [];
  }

  markReady() {
    try {
      window.__TERRABLOCK_READY__ = true;
    } catch {
      /* ignore */
    }
    this.log("ready");
  }

  /**
   * Full observation snapshot for autonomous agents.
   * @returns {object}
   */
  getState() {
    const g = this.game;
    const p = g.player;
    const base = {
      bridgeVersion: this.version,
      ready: !!g._ready,
      playing: !!g.playing,
      paused: !!g.paused,
      fps: g.fps,
      worldSeed: g.worldSeed,
      time: g.dayNight?.time ?? 0,
      isNight: !!g.dayNight?.isNight,
      bloodMoon: !!g.dayNight?.bloodMoon,
      dayLabel: g.dayNight?.label ?? "",
      ui: {
        inventoryOpen: !!g.ui?.inventoryOpen,
        pauseOpen: !!g.ui?.pauseOpen,
        settingsOpen: !!g.ui?.settingsOpen,
        deathVisible: !!p?.dead,
        titleVisible: !g.ui?.els?.title?.classList?.contains("hidden"),
      },
    };

    if (!p || !g.world) {
      return { ...base, player: null, look: null, nearby: [], inventory: null };
    }

    const look = p.lookHit
      ? {
          x: p.lookHit.x,
          y: p.lookHit.y,
          z: p.lookHit.z,
          id: p.lookHit.id,
          name: BLOCKS[p.lookHit.id]?.name || "?",
          face: p.lookHit.face,
          breakProgress: p.breakTarget === `${p.lookHit.x},${p.lookHit.y},${p.lookHit.z}` ? p.breakProgress : 0,
        }
      : null;

    const entities = (g.entities?.entities || [])
      .filter((e) => !e.dead)
      .map((e) => ({
        id: e.id,
        type: e.type,
        name: ENEMY_TYPES[e.type]?.name || e.type,
        boss: !!e.boss,
        hp: e.hp,
        maxHp: e.maxHp,
        x: +e.pos.x.toFixed(2),
        y: +e.pos.y.toFixed(2),
        z: +e.pos.z.toFixed(2),
        dist: +e.pos.distanceTo(p.pos).toFixed(2),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 12);

    const hotbar = p.inventory.hotbar.map((s, i) =>
      s
        ? {
            i,
            id: s.id,
            name: ITEMS[s.id]?.name || s.id,
            count: s.count,
            selected: i === p.inventory.selected,
          }
        : { i, id: null, selected: i === p.inventory.selected }
    );

    return {
      ...base,
      player: {
        x: +p.pos.x.toFixed(3),
        y: +p.pos.y.toFixed(3),
        z: +p.pos.z.toFixed(3),
        yaw: +p.yaw.toFixed(4),
        pitch: +p.pitch.toFixed(4),
        hp: p.hp,
        maxHp: p.maxHp,
        mana: +p.mana.toFixed(1),
        maxMana: p.maxMana,
        defense: p.defense,
        dead: p.dead,
        onGround: p.onGround,
        killCount: p.killCount,
        bossesDefeated: [...p.bossesDefeated],
        selected: p.inventory.selected,
        selectedItem: p.inventory.selectedItem?.id || null,
        equipment: { ...p.inventory.equipment },
      },
      look,
      inventory: {
        hotbar,
        counts: summarizeInventory(p.inventory),
        craftable: getAllRecipes().filter((r) => canCraft(p.inventory, r)).map((r) => r.id),
      },
      nearby: entities,
      boss: g.entities?.getBoss()
        ? {
            type: g.entities.getBoss().type,
            hp: g.entities.getBoss().hp,
            maxHp: g.entities.getBoss().maxHp,
          }
        : null,
      world: this.probeWorld(),
      progression: {
        difficulty: g.progression?.difficulty || "classic",
        hardmode: !!g.progression?.hardmode,
        bossesDefeated: [...(g.progression?.bossesDefeated || [])],
        bossCount: g.progression?.bossesDefeated?.size || 0,
      },
      npcs: [...(g.npcs?.npcs?.values?.() || [])].map((n) => ({
        id: n.id,
        name: n.def?.name || n.id,
        x: +n.pos.x.toFixed(2),
        y: +n.pos.y.toFixed(2),
        z: +n.pos.z.toFixed(2),
        dist: +n.pos.distanceTo(p.pos).toFixed(2),
      })),
      fishing: {
        casting: !!g.fishing?.casting,
        hasBite: !!g.fishing?.hasBite,
      },
      stations: (() => {
        const s = stationsNear(g.world, p.pos, 14);
        return { list: [...s], label: formatStations(s) };
      })(),
      achievements: g.achievements ? [...g.achievements.unlocked] : [],
      log: this._log.slice(-20),
    };
  }

  /**
   * Sample world around player — used by playtest assertions (trees, camp, water).
   */
  probeWorld() {
    const g = this.game;
    const p = g.player;
    if (!p || !g.world) {
      return {
        trees: 0,
        leaves: 0,
        wood: 0,
        workbench: 0,
        furnace: 0,
        anvil: 0,
        chest: 0,
        water: 0,
        torch: 0,
        door: 0,
        campReady: false,
        treesPresent: false,
        waterNearby: false,
      };
    }
    const counts = {
      wood: 0,
      leaves: 0,
      workbench: 0,
      furnace: 0,
      anvil: 0,
      chest: 0,
      water: 0,
      torch: 0,
      door: 0,
      table: 0,
      chair: 0,
    };
    const ox = Math.floor(p.pos.x);
    const oy = Math.floor(p.pos.y);
    const oz = Math.floor(p.pos.z);
    const R = 18;
    for (let y = oy - 4; y <= oy + 12; y++) {
      for (let z = oz - R; z <= oz + R; z++) {
        for (let x = ox - R; x <= ox + R; x++) {
          const id = g.world.getBlock(x, y, z);
          if (id === BlockId.WOOD || id === BlockId.LIVING_WOOD) counts.wood++;
          else if (id === BlockId.LEAVES) counts.leaves++;
          else if (id === BlockId.WORKBENCH) counts.workbench++;
          else if (id === BlockId.FURNACE) counts.furnace++;
          else if (id === BlockId.ANVIL) counts.anvil++;
          else if (id === BlockId.CHEST) counts.chest++;
          else if (id === BlockId.WATER) counts.water++;
          else if (id === BlockId.TORCH) counts.torch++;
          else if (id === BlockId.DOOR) counts.door++;
          else if (id === BlockId.TABLE) counts.table++;
          else if (id === BlockId.CHAIR || id === BlockId.BENCH) counts.chair++;
        }
      }
    }
    const treesPresent = counts.wood >= 8 && counts.leaves >= 20;
    const campReady =
      counts.workbench >= 1 && counts.furnace >= 1 && counts.door >= 1 && counts.torch >= 1;
    return {
      ...counts,
      trees: counts.wood,
      treesPresent,
      campReady,
      waterNearby: counts.water >= 4,
      radius: R,
    };
  }

  /**
   * Apply low-level virtual controls for this frame / until cleared.
   * @param {Partial<{
   *   keys: string[],
   *   left: boolean,
   *   right: boolean,
   *   leftDown: boolean,
   *   rightDown: boolean,
   *   lookDx: number,
   *   lookDy: number,
   *   scroll: number,
   *   locked: boolean
   * }>} controls
   */
  setControls(controls = {}) {
    const input = this.game.input;
    if (!input?.virtual) return { ok: false, error: "no virtual input" };
    input.virtual.apply(controls);
    return { ok: true };
  }

  /** Clear held keys / mouse */
  clearControls() {
    this.game.input?.virtual?.clear();
    return { ok: true };
  }

  /**
   * High-level one-shot or multi-step commands for agents.
   * @param {string} cmd
   * @param {object} [args]
   */
  async command(cmd, args = {}) {
    const g = this.game;
    this.log(`cmd:${cmd}`, args);

    try {
      switch (cmd) {
        case "ping":
          return { ok: true, pong: true, t: Date.now() };

        case "start_new": {
          const seed = args.seed !== undefined && args.seed !== null ? Number(args.seed) >>> 0 : 42;
          if (g.ui?.els?.seedInput) g.ui.els.seedInput.value = String(seed);
          await g.startNew();
          g.input.virtual?.setLocked(true);
          // mute noise during automation
          g.audio.enabled = args.audio !== true;
          g.audio.stopMusic();
          this.markReady();
          return { ok: true, seed: g.worldSeed };
        }

        case "wait": {
          const ms = Math.min(30000, Math.max(0, args.ms || 100));
          await sleep(ms);
          return { ok: true };
        }

        case "wait_until": {
          const timeout = Math.min(60000, args.timeoutMs || 15000);
          const pred = args.predicate;
          if (typeof pred !== "string") return { ok: false, error: "predicate string required" };
          const start = Date.now();
          while (Date.now() - start < timeout) {
            const st = this.getState();
            if (evalPredicate(pred, st)) return { ok: true, state: st };
            await sleep(50);
          }
          return { ok: false, error: "timeout", state: this.getState() };
        }

        case "look": {
          // set absolute yaw/pitch
          if (!g.player) return { ok: false, error: "no player" };
          if (args.yaw !== undefined && args.yaw !== null) g.player.yaw = Number(args.yaw);
          if (args.pitch !== undefined && args.pitch !== null) g.player.pitch = Number(args.pitch);
          g.player.syncCamera();
          return { ok: true };
        }

        case "look_at": {
          if (!g.player) return { ok: false, error: "no player" };
          const tx = Number(args.x);
          const ty = Number(args.y);
          const tz = Number(args.z);
          const eye = g.player.eyePosition();
          const dx = tx - eye.x;
          const dy = ty - eye.y;
          const dz = tz - eye.z;
          g.player.yaw = Math.atan2(-dx, -dz);
          g.player.pitch = Math.atan2(dy, Math.hypot(dx, dz));
          g.player.pitch = Math.max(-1.5, Math.min(1.5, g.player.pitch));
          g.player.syncCamera();
          return { ok: true, yaw: g.player.yaw, pitch: g.player.pitch };
        }

        case "select_hotbar": {
          g.player?.inventory.select(args.index | 0);
          return { ok: true, selected: g.player?.inventory.selected };
        }

        case "hold_keys": {
          const keys = args.keys || [];
          g.input.virtual?.holdKeys(keys);
          return { ok: true };
        }

        case "tap_key": {
          const code = args.code;
          if (!code) return { ok: false, error: "code required" };
          g.input.virtual?.tapKey(code);
          return { ok: true };
        }

        case "mine": {
          // hold LMB for duration while looking at current target
          const ms = Math.min(30000, args.ms || 2000);
          g.input.virtual?.apply({ left: true, locked: true });
          await sleep(ms);
          g.input.virtual?.apply({ left: false });
          return { ok: true, look: this.getState().look };
        }

        case "place": {
          g.input.virtual?.apply({ rightDown: true, right: true, locked: true });
          await sleep(50);
          g.input.virtual?.apply({ right: false, rightDown: false });
          return { ok: true };
        }

        case "attack": {
          const ms = Math.min(5000, args.ms || 400);
          g.input.virtual?.apply({ left: true, locked: true });
          await sleep(ms);
          g.input.virtual?.apply({ left: false });
          return { ok: true };
        }

        case "move": {
          // hold movement for ms
          const keys = [];
          if (args.forward) keys.push("KeyW");
          if (args.back) keys.push("KeyS");
          if (args.left) keys.push("KeyA");
          if (args.right) keys.push("KeyD");
          if (args.jump) keys.push("Space");
          if (args.sprint) keys.push("ShiftLeft");
          const ms = Math.min(10000, args.ms || 500);
          g.input.virtual?.holdKeys(keys);
          await sleep(ms);
          g.input.virtual?.clearKeys();
          return { ok: true, pos: this.getState().player };
        }

        case "craft": {
          const recipe = getRecipe(args.id);
          if (!recipe) return { ok: false, error: "unknown recipe" };
          if (!g.player) return { ok: false, error: "no player" };
          const stations = stationsNear(g.world, g.player.pos, 14);
          // playtest may ignore stations if args.ignoreStations
          const st = args.ignoreStations ? null : stations;
          const times = Math.max(1, args.count | 0 || 1);
          const n = craftMany(g.player.inventory, recipe, times, st);
          if (n > 0) g.achievements?.onCraft();
          return {
            ok: n > 0,
            recipe: args.id,
            crafted: n,
            stations: [...stations],
            canCraft: canCraft(g.player.inventory, recipe, st),
          };
        }

        case "inventory_swap": {
          if (!g.player) return { ok: false, error: "no player" };
          const ok = g.player.inventory.swapSlots(args.a | 0, args.b | 0);
          return { ok, a: args.a | 0, b: args.b | 0 };
        }

        case "inventory_pick": {
          if (!g.player) return { ok: false, error: "no player" };
          // expose cursor via ui
          const r = g.player.inventory.pickCursor(args.slot | 0, !!args.half, g.ui?.cursorItem || null);
          if (g.ui) g.ui.cursorItem = r.cursor;
          return { ok: r.changed, cursor: r.cursor };
        }

        case "probe_world": {
          return { ok: true, ...this.probeWorld() };
        }

        case "break_block_at": {
          if (!g.world) return { ok: false, error: "no world" };
          const x = args.x | 0;
          const y = args.y | 0;
          const z = args.z | 0;
          const before = g.world.getBlock(x, y, z);
          const ok = g.world.setBlock(x, y, z, BlockId.AIR);
          return { ok, before };
        }

        case "loot_nearest_chest": {
          if (!g.player || !g.world) return { ok: false, error: "no player" };
          const ox = Math.floor(g.player.pos.x);
          const oy = Math.floor(g.player.pos.y);
          const oz = Math.floor(g.player.pos.z);
          for (let y = oy - 2; y <= oy + 6; y++) {
            for (let z = oz - 12; z <= oz + 12; z++) {
              for (let x = ox - 12; x <= ox + 12; x++) {
                if (g.world.getBlock(x, y, z) === BlockId.CHEST) {
                  g.player.giveChestLoot(g, x, y, z);
                  g.world.setBlock(x, y, z, BlockId.AIR);
                  return { ok: true, x, y, z };
                }
              }
            }
          }
          return { ok: false, error: "no chest nearby" };
        }

        case "spawn_boss": {
          if (!g.spawnBoss) return { ok: false, error: "no spawnBoss" };
          const type = args.type || "king_slime";
          const b = g.spawnBoss(type);
          return { ok: !!b, type, hp: b?.hp };
        }

        case "force_fish_bite": {
          if (!g.fishing || !g.player) return { ok: false, error: "no fishing" };
          // ensure a fishing pole is selected (hotbar or move into hotbar)
          let poleSlot = g.player.inventory.slots.findIndex(
            (s) => s && ITEMS[s.id]?.fishingPower
          );
          if (poleSlot < 0) {
            g.player.inventory.add("wood_pole", 1);
            poleSlot = g.player.inventory.slots.findIndex(
              (s) => s && ITEMS[s.id]?.fishingPower
            );
          }
          if (poleSlot < 0) return { ok: false, error: "no fishing pole" };
          if (poleSlot >= 9) {
            // swap into hotbar 8
            g.player.inventory.swapSlots(poleSlot, 8);
            poleSlot = 8;
          }
          g.player.inventory.select(poleSlot);
          if (!g.fishing.casting) {
            // find water block near player
            let look = null;
            const ox = Math.floor(g.player.pos.x);
            const oy = Math.floor(g.player.pos.y);
            const oz = Math.floor(g.player.pos.z);
            outer: for (let y = oy - 3; y <= oy + 2; y++) {
              for (let z = oz - 14; z <= oz + 14; z++) {
                for (let x = ox - 14; x <= ox + 14; x++) {
                  if (g.world.getBlock(x, y, z) === BlockId.WATER) {
                    look = { x, y, z };
                    break outer;
                  }
                }
              }
            }
            if (!look) return { ok: false, error: "no water nearby" };
            const cast = g.fishing.tryCast(g.player, g.world, look);
            if (!cast.ok) return { ok: false, error: cast.error || "cast failed" };
          }
          g.fishing.hasBite = true;
          g.fishing.timer = g.fishing.biteAt + 0.1;
          return { ok: true };
        }

        case "fish_reel": {
          if (!g.fishing) return { ok: false, error: "no fishing" };
          const r = g.fishing.reel(g.player, g.progression?.hardmode);
          return { ok: !!r.ok, item: r.item, error: r.error };
        }

        case "tick": {
          // advance simulation without user input
          const ms = Math.min(5000, args.ms || 500);
          const steps = Math.max(1, Math.floor(ms / 16));
          for (let i = 0; i < steps; i++) {
            g.update(0.016);
            g.render?.();
          }
          return { ok: true, steps };
        }

        case "give": {
          // debug grant for scenario setup
          if (!g.player) return { ok: false, error: "no player" };
          const n = g.player.inventory.add(args.item, args.count || 1);
          return { ok: n > 0, added: n };
        }

        case "equip_selected": {
          if (!g.player) return { ok: false, error: "no player" };
          const ok = g.player.inventory.equipFromSlot(g.player.inventory.selected);
          g.player.recomputeStats();
          return { ok, defense: g.player.defense };
        }

        case "use": {
          if (!g.player) return { ok: false, error: "no player" };
          g.player.useSelected(g);
          return { ok: true };
        }

        case "teleport": {
          if (!g.player) return { ok: false, error: "no player" };
          g.player.pos.set(Number(args.x), Number(args.y), Number(args.z));
          g.player.vel.set(0, 0, 0);
          g.player.syncCamera();
          g.world?.updateChunksAround(g.player.pos.x, g.player.pos.z);
          return { ok: true };
        }

        case "set_time": {
          if (args.time !== undefined && args.time !== null) g.dayNight.time = Number(args.time) % 1;
          if (args.bloodMoon !== undefined && args.bloodMoon !== null) g.dayNight.bloodMoon = !!args.bloodMoon;
          return { ok: true, time: g.dayNight.time };
        }

        case "spawn_enemy": {
          if (!g.entities) return { ok: false, error: "no entities" };
          const type = args.type || "slime";
          const x = args.x ?? g.player.pos.x + 3;
          const y = args.y ?? g.player.pos.y;
          const z = args.z ?? g.player.pos.z + 3;
          const e = g.entities.spawnEnemy(type, x, y, z);
          return { ok: !!e, type, id: e?.id };
        }

        case "open_inventory": {
          g.ui?.setInventoryOpen(true, g.player, g);
          return { ok: true };
        }

        case "close_menus": {
          g.ui?.setInventoryOpen(false);
          g.setPaused?.(false);
          g.ui?.setSettingsOpen(false);
          g.ui?.setAchievementsOpen(false);
          g.input.virtual?.setLocked(true);
          return { ok: true };
        }

        case "respawn": {
          if (g.player?.dead) g.respawn();
          return { ok: true, dead: g.player?.dead };
        }

        case "screenshot_meta": {
          // metadata for external capture
          return {
            ok: true,
            canvas: {
              width: g.canvas?.width,
              height: g.canvas?.height,
            },
            state: this.getState(),
          };
        }

        case "eval_state": {
          // return boolean for agent predicates
          const st = this.getState();
          return { ok: true, result: evalPredicate(args.predicate || "true", st), state: st };
        }

        default:
          return { ok: false, error: `unknown command: ${cmd}` };
      }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  }

  log(msg, data) {
    this._log.push({ t: Date.now(), msg, data: data || null });
    if (this._log.length > this._maxLog) this._log.shift();
  }

  getLog() {
    return this._log.slice();
  }
}

function summarizeInventory(inv) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const s of inv.slots) {
    if (!s) continue;
    counts[s.id] = (counts[s.id] || 0) + s.count;
  }
  return counts;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Safe-ish predicate evaluation over state object.
 * Supports simple path checks: "playing", "player.hp>0", "look!=null"
 * @param {string} pred
 * @param {object} state
 */
export function evalPredicate(pred, state) {
  if (!pred || pred === "true") return true;
  // allow a few structured forms without full eval of arbitrary code when possible
  const s = pred.trim();

  // path existence: "look", "player", "boss"
  if (/^[a-zA-Z_.]+$/.test(s)) {
    const v = getPath(state, s);
    return v !== undefined && v !== null && v !== false;
  }

  // comparisons: player.hp>50, nearby.length>0, player.y<20
  const m = s.match(/^([a-zA-Z0-9_.]+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (m) {
    const left = getPath(state, m[1]);
    let right = m[3].trim();
    if (right === "null") right = null;
    else if (right === "true") right = true;
    else if (right === "false") right = false;
    else if (/^".*"$/.test(right) || /^'.*'$/.test(right)) right = right.slice(1, -1);
    else if (!Number.isNaN(Number(right))) right = Number(right);

    switch (m[2]) {
      case "==":
        return Object.is(left, right) || left === right;
      case "!=":
        return !Object.is(left, right) && left !== right;
      case ">":
        return left > right;
      case "<":
        return left < right;
      case ">=":
        return left >= right;
      case "<=":
        return left <= right;
      default:
        return false;
    }
  }

  // compound AND with &&
  if (s.includes("&&")) {
    return s.split("&&").every((part) => evalPredicate(part.trim(), state));
  }

  return false;
}

function getPath(obj, path) {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur === undefined || cur === null) return undefined;
    if (p === "length" && Array.isArray(cur)) return cur.length;
    cur = cur[p];
  }
  return cur;
}
