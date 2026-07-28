import * as THREE from "three";
import { World } from "./World.js";
import { Player } from "./Player.js";
import { Input } from "./Input.js";
import { DayNight } from "./DayNight.js";
import { EntityManager } from "./Entities.js";
import { ENEMY_TYPES } from "./enemies.js";
import { ParticleSystem } from "./Particles.js";
import { AudioSys } from "./Audio.js";
import { UI } from "./UI.js";
import { ItemDropSystem } from "./ItemDrops.js";
import { FloatingText } from "./FloatingText.js";
import { Achievements } from "./Achievements.js";
import { loadSettings, saveSettings, clampSettings } from "./Settings.js";
import { buildSave, writeSave, readSave, applySave } from "./SaveGame.js";
import { AUTO_SAVE_INTERVAL } from "./constants.js";
import { attachPlaytestBridge, isPlaytestEnabled } from "./PlaytestBridge.js";
import { Progression, DIFFICULTY } from "./Progression.js";
import { EventManager } from "./Events.js";
import { NPCSystem } from "./NPCSystem.js";
import { FishingSystem } from "./Fishing.js";
import { Minimap } from "./Minimap.js";
import { MultiplayerClient } from "./Multiplayer.js";
import { MinionSystem } from "./Minions.js";
import { Bestiary } from "./Bestiary.js";
import { HeldItemView } from "./HeldItemView.js";
import { createBreakOverlay, setBreakProgress } from "./BreakCracks.js";
import { GuideSystem } from "./Guide.js";
import { preloadLocalItemIcons } from "./ItemIcons.js";

export class Game {
  constructor(canvas, uiRoot) {
    this.canvas = canvas;
    this.playing = false;
    this.paused = false;
    this.playtest = null;
    this.progression = new Progression();
    this.events = new EventManager();
    this.fishing = new FishingSystem();
    this.minimap = new Minimap();
    this.bestiary = new Bestiary();
    this.guide = new GuideSystem();
    this.npcs = null;
    this.minions = null;
    this.mp = null;

    // difficulty from URL ?diff=expert|master
    try {
      const d = new URLSearchParams(window.location.search).get("diff");
      if (d && DIFFICULTY[d]) this.progression.setDifficulty(d);
    } catch {
      /* ignore */
    }
    this.fps = 0;
    this._frames = 0;
    this._fpsT = 0;
    this._autoSaveT = 0;
    this._tipIndex = 0;
    this._tipTimer = 8;
    this.worldSeed = 0;
    this.settings = loadSettings();
    this.victory = false;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.applyRendererSettings();
    this.renderer.setClearColor(0x6eb6ff);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x6eb6ff, 60, 160);

    this.camera = new THREE.PerspectiveCamera(this.settings.fov, window.innerWidth / window.innerHeight, 0.1, 320);
    this.scene.add(this.camera);
    this.heldItem = new HeldItemView(this.camera);

    this.input = new Input(canvas);
    if (isPlaytestEnabled()) {
      this.input.enablePlaytest();
    }
    this.audio = new AudioSys();
    this.audio.applySettings(this.settings);
    this.ui = new UI(uiRoot);
    attachPlaytestBridge(this);
    this.particles = new ParticleSystem(this.scene);
    this.floating = new FloatingText(this.scene);
    this.dayNight = new DayNight(this.scene);
    this.achievements = new Achievements();
    this.drops = null;

    this.world = null;
    this.player = null;
    this.entities = null;
    this._ready = false;
    this._loadMode = null; // 'new' | 'continue'

    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01));
    this.highlight = new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
    );
    this.highlight.visible = false;
    this.scene.add(this.highlight);

    this.breakOverlay = createBreakOverlay();
    this.scene.add(this.breakOverlay);

    window.addEventListener("resize", () => this.onResize());

    this.wireUi();
    this.dayNight.onNightStart = (blood) => {
      if (!this.playing) return;
      if (blood) {
        this.ui.toast("A Blood Moon is rising…");
        this.audio.play("blood");
        this.audio.setMusicMode("blood");
      } else {
        this.audio.setMusicMode("night");
      }
    };
    this.dayNight.onDayStart = () => {
      if (this.playing) {
        this.achievements.onBloodMoonEnd();
        this.audio.setMusicMode("day");
      }
    };

    this.achievements.onUnlock = (_id, def) => {
      this.ui.toast(`Achievement: ${def.name}`);
      this.audio.play("achievement");
    };

    requestAnimationFrame(() => this.bootstrap());
  }

  wireUi() {
    this.ui.onPlay(() => this.startNew());
    this.ui.onContinue(() => this.startContinue());
    this.ui.onRespawn(() => this.respawn());
    this.ui.onResume(() => this.setPaused(false));
    this.ui.onSave(() => this.saveGame(true));
    this.ui.onQuitTitle(() => this.quitToTitle());
    this.ui.onOpenSettings(() => {
      this.ui.setSettingsOpen(true, this.settings);
    });
    this.ui.onApplySettings(() => {
      this.settings = saveSettings(this.ui.readSettingsForm(this.settings));
      this.applyAllSettings();
      this.ui.toast("Settings applied");
      this.audio.play("click");
    });
    this.ui.onCloseSettings(() => this.ui.setSettingsOpen(false));
    this.ui.onOpenAchievements(() => {
      this.ui.setAchievementsOpen(true, this.achievements);
    });
    this.ui.onCloseAchievements(() => this.ui.setAchievementsOpen(false));

    // Canvas click re-lock is handled inside Input (pendingRelock + !uiBlocking)
  }

  /** Any blocking overlay that needs the free cursor */
  menusBlocking() {
    return !!(
      this.paused ||
      this.ui?.inventoryOpen ||
      this.ui?.settingsOpen ||
      this.ui?.achievementsOpen ||
      this.ui?.isInfoOpen?.() ||
      this.player?.dead ||
      this.ui?.els?.title?.style?.display !== "none" && !this.playing
    );
  }

  syncInputUiState() {
    const blocking =
      !this.playing ||
      !!this.paused ||
      !!this.ui?.inventoryOpen ||
      !!this.ui?.settingsOpen ||
      !!this.ui?.achievementsOpen ||
      !!this.ui?.isInfoOpen?.() ||
      !!this.player?.dead;
    this.input.setUiBlocking(blocking);
    this.ui?.setClickToResume?.(
      this.playing && !blocking && !this.player?.dead && !!this.input.pendingRelock && !this.input.locked
    );
  }

  applyRendererSettings() {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.settings.pixelRatio));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  applyAllSettings() {
    this.settings = clampSettings(this.settings);
    this.applyRendererSettings();
    this.camera.fov = this.settings.fov;
    this.camera.updateProjectionMatrix();
    this.audio.applySettings(this.settings);
    if (this.player) {
      this.player.mouseSensitivity = this.settings.mouseSensitivity;
      this.player.invertY = this.settings.invertY;
    }
    if (this.world) {
      this.world.setRenderDistance(this.settings.renderDistance);
    }
  }

  async bootstrap() {
    this.ui.setLoadingProgress(0.1, "Preparing…");
    await yieldFrame();
    this.ui.setLoadingProgress(0.3, "Ready");
    await yieldFrame();
    this._ready = true;
    this.ui.hideLoading();
    if (this.playtest) {
      this.playtest.log("bootstrap_complete");
      // Mark engine ready; scenarios call start_new for full play
      try {
        window.__TERRABLOCK_ENGINE_READY__ = true;
      } catch {
        /* ignore */
      }
    }
  }

  async startNew() {
    if (!this._ready) {
      this.ui.toast("Still loading…");
      return;
    }
    const seed = this.ui.getSeedInput() ?? resolveWorldSeed() ?? ((Math.random() * 0xffffffff) >>> 0);
    await this.loadWorld(seed, null);
    // apply difficulty from title UI if present
    const diff = this.ui.getDifficulty?.() || this.progression.difficulty;
    this.progression.setDifficulty(diff);

    this.player.inventory.giveStarter();
    const dname = this.progression.diff.name;
    this.enterPlay(`TerraBlock · ${dname} · Seed ${this.worldSeed}`);
    this.ui.showTip(
      "Starter cabin ready: Work Bench + Furnace + Anvil. Loot the chest, then E to craft copper/iron gear.",
      9
    );
  }

  async startContinue() {
    if (!this._ready) {
      this.ui.toast("Still loading…");
      return;
    }
    const data = readSave();
    if (!data) {
      this.ui.toast("No save found");
      return;
    }
    await this.loadWorld(data.seed, data);
    this.enterPlay(`Continued · Seed ${data.seed}`);
  }

  /**
   * @param {number} seed
   * @param {import('./SaveGame.js').SaveData | null} saveData
   */
  async loadWorld(seed, saveData) {
    this.ui.els.loading.classList.remove("hidden");
    this.ui.setLoadingProgress(0.05, "Creating world…");
    await yieldFrame();

    // tear down previous
    if (this.entities) this.entities.clear();
    if (this.drops) this.drops.clear();
    if (this.world) this.world.dispose();
    this.floating.clear();

    this.worldSeed = seed >>> 0;
    this.world = new World(this.scene, this.worldSeed);
    this.world.setRenderDistance(this.settings.renderDistance);
    this.player = new Player(this.camera, this.world);
    this.player.mouseSensitivity = this.settings.mouseSensitivity;
    this.player.invertY = this.settings.invertY;
    this.entities = new EntityManager(this.scene, this.world);
    this.entities._game = this;
    this.drops = new ItemDropSystem(this.scene);
    this.npcs = new NPCSystem(this.scene);
    if (this.minions) this.minions.clear();
    this.minions = new MinionSystem(this.scene);
    this.victory = false;
    if (!saveData) {
      const prevDiff = this.progression.difficulty;
      this.progression = new Progression();
      this.progression.setDifficulty(prevDiff);
      this.events = new EventManager();
      this.bestiary = new Bestiary();
      this.guide = new GuideSystem();
    }
    this.fishing = new FishingSystem();
    this.achievements = new Achievements();
    this.achievements.onUnlock = (_id, def) => {
      this.ui.toast(`Achievement: ${def.name}`);
      this.audio.play("achievement");
    };

    this.ui.setLoadingProgress(0.25, "Generating terrain…");
    await yieldFrame();
    this.world.updateChunksAround(0, 0);
    for (let i = 0; i < 30; i++) this.world.rebuildDirty(10);
    this.ui.setLoadingProgress(0.55, "Finding spawn…");
    await yieldFrame();

    const spawn = this.world.findSpawn();
    this.player.spawnAt(spawn.x, spawn.y, spawn.z);
    this.world.updateChunksAround(spawn.x, spawn.z);
    for (let i = 0; i < 40; i++) this.world.rebuildDirty(12);

    // New worlds only: starter cabin with workbench, furnace, furniture, chest
    if (!saveData) {
      this.ui.setLoadingProgress(0.7, "Building camp…");
      await yieldFrame();
      this.world.buildStarterCamp(spawn.x, Math.floor(spawn.y), spawn.z);
      // re-seat player inside cabin
      this.player.spawnAt(spawn.x, Math.floor(spawn.y) + 0.1, spawn.z);
      this.world.updateChunksAround(spawn.x, spawn.z);
      for (let i = 0; i < 20; i++) this.world.rebuildDirty(12);
    }

    if (saveData) {
      this.ui.setLoadingProgress(0.8, "Loading save…");
      await yieldFrame();
      applySave(this, saveData);
    }

    this.player.spawnPoint = {
      x: spawn.x,
      y: Math.floor(spawn.y) + 0.1,
      z: spawn.z,
    };
    this.progression.refreshNpcUnlocks();
    this.npcs.syncUnlocks(this.progression, this.world, this.player);
    // ensure Guide + Merchant at camp for new worlds
    if (!saveData && this.npcs) {
      const fy = Math.floor(spawn.y);
      if (!this.npcs.npcs.has("guide")) {
        this.npcs.spawnNpc("guide", spawn.x + 1.5, fy, spawn.z + 1.5);
      }
      if (!this.npcs.npcs.has("merchant")) {
        this.npcs.spawnNpc("merchant", spawn.x - 1.5, fy, spawn.z + 1.5);
      }
    }

    this.ui.setLoadingProgress(1, "Done");
    await yieldFrame();
    this.ui.hideLoading();
  }

  enterPlay(message) {
    this.audio.ensure();
    this.audio.applySettings(this.settings);
    this.audio.startMusic();
    this.audio.setMusicMode(this.dayNight.isNight ? (this.dayNight.bloodMoon ? "blood" : "night") : "day");
    this.playing = true;
    this.paused = false;
    this.ui.showGame();
    this.ui.setPauseOpen(false);
    this.ui.toast(message);
    this.canvas.focus();
    this.input.setUiBlocking(false);
    this.input.pendingRelock = true;
    this.ui.setClickToResume?.(true);
    this._autoSaveT = 0;

    // Localhost/dev only: overlay private placeholders onto item icons (never ships)
    preloadLocalItemIcons()
      .then((stats) => {
        if (stats?.loaded > 0 && this.player) {
          this.ui.renderHotbar?.(this.player);
          if (this.ui.inventoryOpen) this.ui.renderInventory?.(this.player, this);
        }
      })
      .catch(() => {});

    // multiplayer optional
    try {
      const params = new URLSearchParams(window.location.search);
      const mp = params.get("mp");
      if (mp) {
        this.mp = new MultiplayerClient(this);
        this.mp.connect(mp);
        this.ui.toast("Multiplayer connecting…");
      }
    } catch {
      /* ignore */
    }
  }

  setPaused(p) {
    this.paused = p;
    this.ui.setPauseOpen(p);
    this.input.clearKeys?.();
    if (p) {
      this.input.exitLock();
      this.ui.setInventoryOpen(false, this.player, this);
      this.input.setUiBlocking(true);
    } else if (this.playing && !this.player.dead) {
      this.input.setUiBlocking(false);
      // Do not requestLock without a gesture — wait for canvas click
      this.input.pendingRelock = true;
      this.ui.setClickToResume?.(true);
    }
  }

  saveGame(notify = false) {
    if (!this.playing || !this.player || !this.world) return false;
    try {
      const data = buildSave(this);
      writeSave(data);
      if (notify) {
        this.ui.toast("Game saved");
        this.audio.play("save");
      }
      this.ui.refreshContinueButton();
      return true;
    } catch (e) {
      this.ui.toast(e.message || "Save failed");
      return false;
    }
  }

  quitToTitle() {
    this.saveGame(false);
    this.playing = false;
    this.paused = false;
    this.audio.stopMusic();
    this.input.exitLock();
    this.ui.showTitle();
    this.ui.toast("Progress saved");
  }

  spawnBoss(type) {
    const key = type;
    const def = ENEMY_TYPES[key];
    if (!def) return null;

    const p = this.player.pos;
    let x = p.x + 10;
    let y = p.y + 8;
    let z = p.z + 10;

    if (key === "king_slime") {
      y = this.world.surfaceY(p.x + 8, p.z + 8) + 1;
      x = p.x + 8;
      z = p.z + 8;
    }
    if (key === "eater" || key === "destroyer") {
      y = Math.max(6, p.y - 2);
      x = p.x + 15;
      z = p.z;
    }
    if (key === "wall") {
      y = Math.max(8, p.y);
      x = p.x + 20;
      z = p.z;
    }
    if (key === "moonlord") {
      y = p.y + 12;
      x = p.x;
      z = p.z + 16;
    }

    this.entities.spawnEnemy(key, x, y, z);
    this.ui.toast(`${def.name} has awoken!`);
    this.ui.showTip(`Boss fight! ${def.name} — watch the HP bar at the top. Keep moving.`, 6);
    this.audio.play("boss");
    this.audio.setMusicMode("boss");
    this.particles?.burst(x, y, z, [255, 80, 80], 24, { mode: "spark" });
    if (["eye", "skeletron", "twins", "prime", "cultist"].includes(key)) {
      this.dayNight.time = 0.85;
    }
    return this.entities.getBoss();
  }

  onPlayerDeath() {
    this.input.exitLock();
    this.ui.toast("You were slain…");
    this.saveGame(false);
  }

  respawn() {
    const px = this.player.pos.x + (Math.random() - 0.5) * 10;
    const pz = this.player.pos.z + (Math.random() - 0.5) * 10;
    const sy = this.world.surfaceY(px, pz) + 1.01;
    this.player.spawnAt(px, sy, pz);
    this.player.healFull();
    this.player.hp = Math.floor(this.player.maxHp * 0.6);
    this.ui.toast("Respawned");
    this.input.setUiBlocking(false);
    this.input.pendingRelock = true;
    this.ui.setClickToResume?.(true);
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  update(dt) {
    this._frames++;
    this._fpsT += dt;
    if (this._fpsT >= 0.5) {
      this.fps = Math.round(this._frames / this._fpsT);
      this._frames = 0;
      this._fpsT = 0;
    }

    if (this.world) {
      this.world.rebuildDirty(this.playing && !this.paused ? 3 : 4);
    }

    if (!this.playing || !this.player) {
      this.dayNight.update(dt * 0.25, null);
      this.input.endFrame();
      return;
    }

    // Menus — Escape always releases pointer; we never re-lock without a canvas click
    if (this.input.consumeKey("Escape")) {
      if (this.ui.isInfoOpen?.()) this.ui.closeInfo?.();
      else if (this.ui.settingsOpen) {
        this.ui.setSettingsOpen(false);
        this.input.pendingRelock = true;
      } else if (this.ui.achievementsOpen) {
        this.ui.setAchievementsOpen(false);
        this.input.pendingRelock = true;
      } else if (this.ui.inventoryOpen) {
        this.ui.setInventoryOpen(false, this.player, this);
      } else if (!this.player.dead) this.setPaused(!this.paused);
    }

    if (!this.paused && !this.player.dead && this.input.consumeKey("KeyE")) {
      this.ui.setInventoryOpen(!this.ui.inventoryOpen, this.player, this);
    }
    if (!this.paused && this.input.consumeKey("KeyB")) {
      const open = !this.ui.achievementsOpen;
      this.ui.setAchievementsOpen(open, this.achievements);
      this.input.clearMovementKeys?.();
      if (open) this.input.exitLock();
      else this.input.pendingRelock = true;
    }

    this.syncInputUiState();

    if (
      this.paused ||
      this.ui.inventoryOpen ||
      this.ui.settingsOpen ||
      this.ui.achievementsOpen ||
      this.ui.isInfoOpen?.()
    ) {
      // only clear movement — full clearKeys every frame made menus feel broken
      this.input.clearMovementKeys?.();
      this.dayNight.update(0, this.player.pos);
      this.ui.update(dt, this.player, this);
      this.input.endFrame();
      return;
    }

    // T talk to NPC
    if (!this.paused && this.input.consumeKey("KeyT")) {
      const npc = this.npcs?.nearest(this.player);
      if (npc) this.ui.openNpcDialog?.(npc, this);
    }
    // J journal
    if (!this.paused && this.input.consumeKey("KeyJ")) {
      this.ui.openJournal?.(this.progression);
    }
    // B bestiary (also achievements when paused)
    if (!this.paused && this.input.consumeKey("KeyN")) {
      this.ui.openBestiary?.(this.bestiary);
    }
    // Y reforge selected (achievement fired inside UI.tryReforge)
    if (!this.paused && this.input.consumeKey("KeyY")) {
      this.ui.tryReforge?.(this);
    }
    // P piggy deposit selected
    if (!this.paused && this.input.consumeKey("KeyP")) {
      if (this.player.inventory.depositToPiggy(this.player.inventory.selected)) {
        this.ui.toast("Deposited to Piggy Bank");
      } else {
        this.ui.toast("Piggy Bank full or empty slot");
      }
    }

    if (!this.player.dead) {
      this.player.update(dt, this.input, this);
      this.world.updateChunksAround(this.player.pos.x, this.player.pos.z);
      this.world.hardmode = this.progression.hardmode;
      this.entities.update(dt, this.player, this);
      this.drops.update(dt, this.player, this);
      this.minions?.update(dt, this.player, this.entities, this);
      this.npcs?.update(dt, this.player);
      this.events.update(dt, this);
      this.dayNight.update(dt, this.player.pos);
      this.particles.update(dt);
      this.floating.update(dt);
      this.minimap.update(this.world, this.player, this.ui.root);
      this.mp?.update(dt);
      this.guide?.update(dt, this);
      // fishing bite / timeout
      if (this.fishing?.casting) {
        const fr = this.fishing.update(dt);
        if (fr?.bite) {
          this.ui.toast("Something's biting! Press F to reel!");
          this.audio.play("pickup");
        } else if (fr?.missed) {
          this.ui.toast("It got away…");
        }
      }
      this.updateHighlight();
      this.achievements.onTime(this.dayNight.time, this.dayNight.isNight);

      // FP held item
      const mouse = this.input.getMouse?.() || this.input.mouse;
      const moving =
        this.input.pressed("KeyW") ||
        this.input.pressed("KeyS") ||
        this.input.pressed("KeyA") ||
        this.input.pressed("KeyD");
      this.heldItem.update(dt, this.player, moving, !!(mouse?.left && !this.ui.inventoryOpen));

      // music mode
      if (this.entities.hasBoss()) this.audio.setMusicMode("boss");
      else if (this.dayNight.bloodMoon) this.audio.setMusicMode("blood");
      else this.audio.setMusicMode(this.dayNight.isNight ? "night" : "day");

      // autosave
      if (this.settings.autoSave) {
        this._autoSaveT += dt;
        if (this._autoSaveT >= AUTO_SAVE_INTERVAL) {
          this._autoSaveT = 0;
          this.saveGame(false);
        }
      }

      // progressive tips
      this._tipTimer -= dt;
      if (this._tipTimer <= 0) {
        this._tipTimer = 90;
        const tips = [
          "Press G to equip armor from the selected hotbar slot.",
          "Life Crystals hide in caves — use them with F to raise max HP.",
          "Blood Moons spawn tougher foes. Stay near light and cover.",
          "Craft boss summons in the crafting menu (E).",
          "Esc opens pause — save anytime. Progress autosaves every minute.",
          "Nightmare Pickaxe mines hellstone efficiently.",
        ];
        this.ui.showTip(tips[this._tipIndex % tips.length], 5);
        this._tipIndex++;
      }
    } else {
      this.dayNight.update(dt * 0.2, this.player.pos);
      this.particles.update(dt);
      this.floating.update(dt);
    }

    this.ui.update(dt, this.player, this);
    this.input.endFrame();
  }

  updateHighlight() {
    const hit = this.player.lookHit;
    if (hit) {
      this.highlight.visible = true;
      this.highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
      if (this.player.breakProgress > 0 && this.player.breakTarget) {
        this.breakOverlay.position.copy(this.highlight.position);
        setBreakProgress(this.breakOverlay, this.player.breakProgress);
      } else {
        setBreakProgress(this.breakOverlay, 0);
      }
    } else {
      this.highlight.visible = false;
      setBreakProgress(this.breakOverlay, 0);
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

function yieldFrame() {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

export function resolveWorldSeed() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("seed");
    if (raw !== null && raw !== "") {
      const n = Number(raw);
      if (Number.isFinite(n)) return n >>> 0;
    }
  } catch {
    /* non-browser */
  }
  return null;
}
