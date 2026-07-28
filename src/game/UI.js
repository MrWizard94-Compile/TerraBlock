import { ITEMS } from "./items.js";
import { BLOCKS } from "./blocks.js";
import { listRecipes, craftMany, maxCraftable } from "./crafting.js";
import { stationsNear, formatStations, STATION_LABELS } from "./Stations.js";
import { ENEMY_TYPES } from "./enemies.js";
import { hasSave } from "./SaveGame.js";
import { buyItem, countCoins, spendCoins, sellItem } from "./NPCSystem.js";
import { reforgeSlotSync } from "./Prefixes.js";
import { itemIconHtml, itemIconUrl, warmItemIcons } from "./ItemIcons.js";

export class UI {
  constructor(root) {
    this.root = root;
    this.inventoryOpen = false;
    this.pauseOpen = false;
    this.settingsOpen = false;
    this.achievementsOpen = false;
    this._toastTimer = 0;
    this._handlers = {};
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="loading" id="loading">
        <div class="logo-mark">TB</div>
        <div class="spinner"></div>
        <p id="loading-text">Generating voxel world…</p>
        <div class="load-bar"><div class="load-bar-fill" id="load-fill"></div></div>
      </div>

      <div class="title-screen" id="title">
        <div class="title-bg"></div>
        <h1>TerraBlock</h1>
        <div class="subtitle" id="edition-label">Desktop Edition · 3D Voxel Adventure</div>
        <div class="menu-stack">
          <button class="menu-btn interactive" id="btn-play">New World</button>
          <button class="menu-btn interactive" id="btn-continue" style="display:none">Continue</button>
          <button class="menu-btn secondary interactive" id="btn-settings-title">Settings</button>
          <button class="menu-btn secondary interactive" id="btn-how">How to Play</button>
          <button class="menu-btn secondary interactive" id="btn-credits">Credits</button>
        </div>
        <div class="controls-card" id="controls-card" style="display:none">
          <strong>WASD</strong> move · <strong>Space</strong> jump · <strong>Shift</strong> sprint<br/>
          <strong>Mouse</strong> look · <strong>LMB</strong> mine/attack · <strong>RMB</strong> place / open door<br/>
          <strong>1–9</strong> hotbar · <strong>E</strong> inventory (click to move items) · <strong>G</strong> equip<br/>
          <strong>F</strong> use item · <strong>Esc</strong> pause · <strong>B</strong> achievements · <strong>F11</strong> fullscreen<br/>
          After menus: <strong>click the world</strong> to recapture the camera.
        </div>
        <div class="controls-card" id="credits-card" style="display:none">
          TerraBlock Desktop Edition<br/>
          Built with Three.js · Electron · Vite · Web Audio<br/>
          Fan-inspired sandbox — not affiliated with Re-Logic
        </div>
        <div class="seed-row interactive">
          <label>World seed (optional)</label>
          <input id="seed-input" class="seed-input interactive" type="text" placeholder="random" maxlength="16" />
        </div>
        <div class="seed-row interactive">
          <label>Difficulty</label>
          <select id="diff-select" class="seed-input interactive" style="cursor:pointer">
            <option value="classic">Classic</option>
            <option value="expert">Expert</option>
            <option value="master">Master</option>
          </select>
        </div>
      </div>

      <div class="crosshair" id="crosshair" style="display:none"></div>
      <div class="hud-top" id="hud" style="display:none">
        <div class="stat-row">
          <div class="stat-label">HP</div>
          <div class="bar"><div class="bar-fill hp" id="hp-fill"></div><div class="bar-text" id="hp-text"></div></div>
        </div>
        <div class="stat-row">
          <div class="stat-label">MP</div>
          <div class="bar"><div class="bar-fill mana" id="mana-fill"></div><div class="bar-text" id="mana-text"></div></div>
        </div>
        <div class="stat-row">
          <div class="stat-label">DEF</div>
          <div class="def-badge" id="def-text">0</div>
        </div>
      </div>
      <div class="time-badge" id="time-badge" style="display:none"></div>
      <div class="depth-badge" id="depth-badge" style="display:none"></div>
      <div class="coin-badge" id="coin-badge" style="display:none"></div>
      <div class="buff-bar" id="buff-bar"></div>
      <div class="boss-panel" id="boss-panel">
        <div class="boss-name" id="boss-name">Boss</div>
        <div class="bar"><div class="bar-fill boss" id="boss-fill"></div><div class="bar-text" id="boss-text"></div></div>
      </div>
      <div class="hotbar" id="hotbar" style="display:none"></div>
      <div class="equip-strip" id="equip-strip" style="display:none"></div>
      <div class="target-label" id="target-label"></div>
      <div class="toast" id="toast"></div>
      <div class="click-resume" id="click-resume">Click game to look around</div>
      <div class="fps-meter" id="fps" style="display:none"></div>
      <div class="tip-banner" id="tip-banner"></div>
      <div class="hurt-vignette" id="hurt-vignette"></div>
      <div class="low-hp-vignette" id="low-hp-vignette"></div>

      <div class="panel-overlay" id="inv-overlay">
        <div class="panel interactive wide">
          <h2>Inventory &amp; Crafting</h2>
          <div class="panel-grid three">
            <div>
              <h3 class="panel-h3">Items</h3>
              <div class="inv-grid" id="inv-grid"></div>
              <p class="hint">
                <strong>Click</strong> pick up / place · <strong>Right-click</strong> half stack / place one<br/>
                <strong>Shift-click</strong> equip armor · <strong>G</strong> equip selected hotbar
              </p>
              <div class="cursor-slot" id="inv-cursor-slot" style="display:none"></div>
            </div>
            <div>
              <h3 class="panel-h3">Equipment</h3>
              <div class="equip-panel" id="equip-panel"></div>
            </div>
            <div class="craft-col">
              <h3 class="panel-h3">Crafting</h3>
              <input id="craft-search" class="craft-search interactive" type="search" placeholder="Search recipes…" autocomplete="off" />
              <div class="craft-tabs interactive" id="craft-tabs">
                <button type="button" class="craft-tab active" data-cat="ready">Ready</button>
                <button type="button" class="craft-tab" data-cat="all">All</button>
                <button type="button" class="craft-tab" data-cat="basic">Basic</button>
                <button type="button" class="craft-tab" data-cat="tools">Tools</button>
                <button type="button" class="craft-tab" data-cat="weapons">Weapons</button>
                <button type="button" class="craft-tab" data-cat="armor">Armor</button>
                <button type="button" class="craft-tab" data-cat="potions">Potions</button>
                <button type="button" class="craft-tab" data-cat="boss">Boss</button>
                <button type="button" class="craft-tab" data-cat="misc">Misc</button>
              </div>
              <div class="station-badge" id="station-badge">Stations: scanning…</div>
              <p class="hint craft-hint">Click = craft 1 · <strong>Shift+click</strong> = craft all · Need stations nearby (workbench / furnace / anvil)</p>
              <div class="recipe-list" id="recipe-list"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-overlay" id="pause-overlay">
        <div class="panel interactive pause-panel">
          <h2>Paused</h2>
          <button class="menu-btn interactive" id="btn-resume">Resume</button>
          <button class="menu-btn secondary interactive" id="btn-save">Save Game</button>
          <button class="menu-btn secondary interactive" id="btn-settings-pause">Settings</button>
          <button class="menu-btn secondary interactive" id="btn-achievements">Achievements</button>
          <button class="menu-btn secondary interactive" id="btn-quit-title">Quit to Title</button>
        </div>
      </div>

      <div class="panel-overlay" id="settings-overlay">
        <div class="panel interactive">
          <h2>Settings</h2>
          <div class="settings-grid" id="settings-grid"></div>
          <div class="settings-actions">
            <button class="menu-btn interactive" id="btn-settings-save">Apply</button>
            <button class="menu-btn secondary interactive" id="btn-settings-close">Close</button>
          </div>
        </div>
      </div>

      <div class="panel-overlay" id="ach-overlay">
        <div class="panel interactive">
          <h2>Achievements</h2>
          <div class="ach-list" id="ach-list"></div>
          <button class="menu-btn secondary interactive" id="btn-ach-close">Close</button>
        </div>
      </div>

      <div class="death-screen" id="death">
        <h2>You Died</h2>
        <p class="death-sub" id="death-sub">The world remembers your progress.</p>
        <button class="menu-btn interactive" id="btn-respawn">Respawn</button>
      </div>

      <div class="victory-screen" id="victory">
        <div class="victory-glow"></div>
        <h2>Victory</h2>
        <p class="victory-sub">Moon Lord has fallen. TerraBlock is yours.</p>
        <p class="death-sub" id="victory-sub"></p>
        <button class="menu-btn interactive" id="btn-victory-continue">Continue Playing</button>
      </div>

      <div class="panel-overlay" id="info-overlay">
        <div class="panel interactive">
          <h2 id="info-title">Info</h2>
          <div class="info-body" id="info-body"></div>
          <button class="menu-btn secondary interactive" id="btn-info-close">Close</button>
        </div>
      </div>
    `;

    this.els = {
      loading: this.root.querySelector("#loading"),
      loadingText: this.root.querySelector("#loading-text"),
      loadFill: this.root.querySelector("#load-fill"),
      title: this.root.querySelector("#title"),
      crosshair: this.root.querySelector("#crosshair"),
      hud: this.root.querySelector("#hud"),
      hotbar: this.root.querySelector("#hotbar"),
      equipStrip: this.root.querySelector("#equip-strip"),
      time: this.root.querySelector("#time-badge"),
      depth: this.root.querySelector("#depth-badge"),
      coins: this.root.querySelector("#coin-badge"),
      buffBar: this.root.querySelector("#buff-bar"),
      toast: this.root.querySelector("#toast"),
      clickResume: this.root.querySelector("#click-resume"),
      target: this.root.querySelector("#target-label"),
      invOverlay: this.root.querySelector("#inv-overlay"),
      invGrid: this.root.querySelector("#inv-grid"),
      recipeList: this.root.querySelector("#recipe-list"),
      equipPanel: this.root.querySelector("#equip-panel"),
      invCursorSlot: this.root.querySelector("#inv-cursor-slot"),
      craftSearch: this.root.querySelector("#craft-search"),
      craftTabs: this.root.querySelector("#craft-tabs"),
      stationBadge: this.root.querySelector("#station-badge"),
      death: this.root.querySelector("#death"),
      deathSub: this.root.querySelector("#death-sub"),
      victory: this.root.querySelector("#victory"),
      victorySub: this.root.querySelector("#victory-sub"),
      bossPanel: this.root.querySelector("#boss-panel"),
      bossName: this.root.querySelector("#boss-name"),
      bossFill: this.root.querySelector("#boss-fill"),
      bossText: this.root.querySelector("#boss-text"),
      hpFill: this.root.querySelector("#hp-fill"),
      hpText: this.root.querySelector("#hp-text"),
      manaFill: this.root.querySelector("#mana-fill"),
      manaText: this.root.querySelector("#mana-text"),
      defText: this.root.querySelector("#def-text"),
      fps: this.root.querySelector("#fps"),
      controls: this.root.querySelector("#controls-card"),
      credits: this.root.querySelector("#credits-card"),
      pauseOverlay: this.root.querySelector("#pause-overlay"),
      settingsOverlay: this.root.querySelector("#settings-overlay"),
      settingsGrid: this.root.querySelector("#settings-grid"),
      achOverlay: this.root.querySelector("#ach-overlay"),
      achList: this.root.querySelector("#ach-list"),
      tip: this.root.querySelector("#tip-banner"),
      seedInput: this.root.querySelector("#seed-input"),
      diffSelect: this.root.querySelector("#diff-select"),
      btnContinue: this.root.querySelector("#btn-continue"),
      hurtVignette: this.root.querySelector("#hurt-vignette"),
      lowHpVignette: this.root.querySelector("#low-hp-vignette"),
      infoOverlay: this.root.querySelector("#info-overlay"),
      infoTitle: this.root.querySelector("#info-title"),
      infoBody: this.root.querySelector("#info-body"),
    };

    this._hurtFlash = 0;
    this._victoryShown = false;
    /** @type {{ id: string, count: number, prefix?: string|null }|null} */
    this.cursorItem = null;
    this._cursorEl = null;
    this.craftCategory = "ready";
    this.craftQuery = "";

    // Desktop shell branding
    try {
      if (typeof window !== "undefined" && window.terrablockDesktop?.isDesktop) {
        const ed = this.root.querySelector("#edition-label");
        if (ed) ed.textContent = "Desktop Edition · Native App";
      }
    } catch {
      /* ignore */
    }

    // floating cursor stack follows mouse while inventory open
    this.root.addEventListener("mousemove", (e) => this._moveCursorGhost(e));

    this.els.craftSearch?.addEventListener("input", () => {
      this.craftQuery = this.els.craftSearch.value || "";
      if (this._lastCraftPlayer) this.renderRecipes(this._lastCraftPlayer, this._lastCraftGame);
    });
    this.els.craftTabs?.querySelectorAll(".craft-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.craftCategory = btn.getAttribute("data-cat") || "all";
        this.els.craftTabs.querySelectorAll(".craft-tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        if (this._lastCraftPlayer) this.renderRecipes(this._lastCraftPlayer, this._lastCraftGame);
      });
    });

    this.root.querySelector("#btn-info-close")?.addEventListener("click", () => {
      this.els.infoOverlay.classList.remove("visible");
      document.exitPointerLock?.();
    });
    this.root.querySelector("#btn-victory-continue")?.addEventListener("click", () => {
      this.els.victory.classList.remove("visible");
      this.root.querySelector("#game-canvas")?.requestPointerLock?.();
    });

    // URL ?diff= preselect
    try {
      const d = new URLSearchParams(window.location.search).get("diff");
      if (d && this.els.diffSelect) this.els.diffSelect.value = d;
    } catch {
      /* ignore */
    }

    this.root.querySelector("#btn-how").addEventListener("click", () => {
      this.els.controls.style.display = this.els.controls.style.display === "none" ? "block" : "none";
      this.els.credits.style.display = "none";
    });
    this.root.querySelector("#btn-credits").addEventListener("click", () => {
      this.els.credits.style.display = this.els.credits.style.display === "none" ? "block" : "none";
      this.els.controls.style.display = "none";
    });

    this.refreshContinueButton();
  }

  refreshContinueButton() {
    if (hasSave()) {
      this.els.btnContinue.style.display = "";
    } else {
      this.els.btnContinue.style.display = "none";
    }
  }

  getSeedInput() {
    const v = this.els.seedInput?.value?.trim();
    if (!v) return null;
    const n = Number(v);
    if (Number.isFinite(n)) return n >>> 0;
    // hash string seed
    let h = 2166136261;
    for (let i = 0; i < v.length; i++) {
      h ^= v.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  getDifficulty() {
    return this.els.diffSelect?.value || "classic";
  }

  onPlay(cb) {
    this.root.querySelector("#btn-play").addEventListener("click", cb);
  }
  onContinue(cb) {
    this.els.btnContinue.addEventListener("click", cb);
  }
  onRespawn(cb) {
    this.root.querySelector("#btn-respawn").addEventListener("click", cb);
  }
  onResume(cb) {
    this.root.querySelector("#btn-resume").addEventListener("click", cb);
  }
  onSave(cb) {
    this.root.querySelector("#btn-save").addEventListener("click", cb);
  }
  onQuitTitle(cb) {
    this.root.querySelector("#btn-quit-title").addEventListener("click", cb);
  }
  onOpenSettings(cb) {
    this.root.querySelector("#btn-settings-title").addEventListener("click", () => cb("title"));
    this.root.querySelector("#btn-settings-pause").addEventListener("click", () => cb("pause"));
  }
  onApplySettings(cb) {
    this.root.querySelector("#btn-settings-save").addEventListener("click", cb);
  }
  onCloseSettings(cb) {
    this.root.querySelector("#btn-settings-close").addEventListener("click", cb);
  }
  onOpenAchievements(cb) {
    this.root.querySelector("#btn-achievements").addEventListener("click", cb);
  }
  onCloseAchievements(cb) {
    this.root.querySelector("#btn-ach-close").addEventListener("click", cb);
  }

  setLoadingProgress(p, text) {
    this.els.loadFill.style.width = `${Math.round(p * 100)}%`;
    if (text) this.els.loadingText.textContent = text;
  }

  hideLoading() {
    this.els.loading.classList.add("hidden");
  }

  showTitle() {
    this.els.title.classList.remove("hidden");
    this.els.crosshair.style.display = "none";
    this.els.hud.style.display = "none";
    this.els.hotbar.style.display = "none";
    this.els.equipStrip.style.display = "none";
    this.els.time.style.display = "none";
    this.els.depth.style.display = "none";
    if (this.els.coins) this.els.coins.style.display = "none";
    this.els.fps.style.display = "none";
    this.els.buffBar && (this.els.buffBar.innerHTML = "");
    this.els.victory?.classList.remove("visible");
    this._victoryShown = false;
    this.setPauseOpen(false);
    this.setInventoryOpen(false);
    this.refreshContinueButton();
  }

  showGame() {
    this.els.title.classList.add("hidden");
    this.els.crosshair.style.display = "";
    this.els.hud.style.display = "";
    this.els.hotbar.style.display = "";
    this.els.equipStrip.style.display = "";
    this.els.time.style.display = "";
    this.els.depth.style.display = "";
    if (this.els.coins) this.els.coins.style.display = "";
    this.els.fps.style.display = "";
    // warm common starter + tool icons so first frame is instant
    warmItemIcons([
      "wood_pick",
      "wood_sword",
      "wood_axe",
      "torch",
      "wood",
      "dirt",
      "stone",
      "mushroom",
      "planks",
      "copper_coin",
      "recall_potion",
    ]);
  }

  toast(msg, duration = 2.4) {
    this.els.toast.textContent = msg;
    this.els.toast.classList.add("visible");
    this._toastTimer = duration;
  }

  showTip(msg, duration = 5) {
    this.els.tip.textContent = msg;
    this.els.tip.classList.add("visible");
    clearTimeout(this._tipTimer);
    this._tipTimer = setTimeout(() => this.els.tip.classList.remove("visible"), duration * 1000);
  }

  _syncCursorGhost() {
    let el = this._cursorEl;
    if (!el) {
      el = document.createElement("div");
      el.id = "inv-cursor-ghost";
      el.className = "inv-cursor-ghost";
      this.root.appendChild(el);
      this._cursorEl = el;
    }
    if (!this.cursorItem || !this.inventoryOpen) {
      el.style.display = "none";
      el.innerHTML = "";
      return;
    }
    el.style.display = "flex";
    el.innerHTML = `${itemIconHtml(this.cursorItem.id)}${
      this.cursorItem.count > 1 ? `<span class="slot-count">${this.cursorItem.count}</span>` : ""
    }`;
  }

  _moveCursorGhost(e) {
    if (!this._cursorEl || !this.cursorItem || !this.inventoryOpen) return;
    this._cursorEl.style.left = `${e.clientX + 12}px`;
    this._cursorEl.style.top = `${e.clientY + 12}px`;
  }

  setInventoryOpen(open, player, game) {
    this.inventoryOpen = open;
    this.els.invOverlay.classList.toggle("visible", open);
    if (open && player) {
      game?.input?.clearMovementKeys?.();
      game?.input?.exitLock?.();
      game?.input?.setUiBlocking?.(true);
      this.renderInventory(player, game);
      this.setClickToResume(false);
    } else {
      // dump cursor stack back into inventory when closing
      if (this.cursorItem && player) {
        player.inventory.add(
          this.cursorItem.id,
          this.cursorItem.count,
          this.cursorItem.prefix || null
        );
        this.cursorItem = null;
      }
      this._syncCursorGhost();
      game?.input?.clearMovementKeys?.();
      game?.input?.setUiBlocking?.(false);
      // Never call requestPointerLock here — browsers block it after Escape.
      // Canvas click (user gesture) re-captures look; show hint until then.
      if (game?.input) game.input.pendingRelock = true;
      this.setClickToResume(true);
      try {
        game?.canvas?.focus?.();
      } catch {
        /* ignore */
      }
    }
  }

  setClickToResume(show) {
    if (!this.els.clickResume) return;
    this.els.clickResume.classList.toggle("visible", !!show);
  }

  setPauseOpen(open) {
    this.pauseOpen = open;
    this.els.pauseOverlay.classList.toggle("visible", open);
  }

  setSettingsOpen(open, settings) {
    this.settingsOpen = open;
    this.els.settingsOverlay.classList.toggle("visible", open);
    if (open && settings) this.renderSettings(settings);
  }

  setAchievementsOpen(open, achievements) {
    this.achievementsOpen = open;
    this.els.achOverlay.classList.toggle("visible", open);
    if (open && achievements) this.renderAchievements(achievements);
  }

  renderSettings(settings) {
    const rows = [
      ["mouseSensitivity", "Mouse Sensitivity", 0.2, 3, 0.05],
      ["masterVolume", "Master Volume", 0, 1, 0.05],
      ["sfxVolume", "SFX Volume", 0, 1, 0.05],
      ["musicVolume", "Music Volume", 0, 1, 0.05],
      ["fov", "Field of View", 50, 100, 1],
      ["renderDistance", "Render Distance", 2, 8, 1],
      ["pixelRatio", "Pixel Ratio Cap", 0.75, 2, 0.25],
    ];
    const bools = [
      ["invertY", "Invert Y"],
      ["showFps", "Show FPS"],
      ["autoSave", "Auto-Save"],
      ["damageNumbers", "Damage Numbers"],
    ];
    let html = "";
    for (const [key, label, min, max, step] of rows) {
      html += `<label class="setting-row"><span>${label}</span>
        <input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${settings[key]}" />
        <span class="setting-val" data-val="${key}">${settings[key]}</span></label>`;
    }
    for (const [key, label] of bools) {
      html += `<label class="setting-row check"><span>${label}</span>
        <input type="checkbox" data-key="${key}" ${settings[key] ? "checked" : ""} /></label>`;
    }
    this.els.settingsGrid.innerHTML = html;
    this.els.settingsGrid.querySelectorAll("input[type=range]").forEach((el) => {
      el.addEventListener("input", () => {
        const span = this.els.settingsGrid.querySelector(`[data-val="${el.dataset.key}"]`);
        if (span) span.textContent = el.value;
      });
    });
  }

  readSettingsForm(base) {
    const s = { ...base };
    this.els.settingsGrid.querySelectorAll("input").forEach((el) => {
      const k = el.dataset.key;
      if (!k) return;
      if (el.type === "checkbox") s[k] = el.checked;
      else s[k] = Number(el.value);
    });
    return s;
  }

  renderAchievements(ach) {
    const list = ach.list();
    this.els.achList.innerHTML = list
      .map(
        (a) => `<div class="ach-item ${a.unlocked ? "done" : ""}">
        <div class="ach-name">${a.unlocked ? "✓ " : ""}${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
      </div>`
      )
      .join("");
  }

  renderInventory(player, game) {
    const grid = this.els.invGrid;
    grid.innerHTML = "";
    player.inventory.slots.forEach((slot, i) => {
      const el = document.createElement("div");
      el.className =
        "slot interactive" +
        (i === player.inventory.selected && i < 9 ? " selected" : "") +
        (i < 9 ? " hotbar-slot" : "");
      if (slot) {
        const pref = slot.prefix ? ` [${slot.prefix}]` : "";
        el.innerHTML = `
          ${itemIconHtml(slot.id)}
          <span class="slot-count">${slot.count > 1 ? slot.count : ""}</span>
        `;
        el.title = (ITEMS[slot.id]?.name || slot.id) + pref;
      } else {
        el.title = i < 9 ? `Hotbar ${i + 1}` : "Empty";
      }
      el.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        // Shift-click: equip armor/accessory from slot
        if (ev.shiftKey && slot && (ITEMS[slot.id]?.armor || ITEMS[slot.id]?.accessory)) {
          if (player.inventory.equipFromSlot(i)) {
            player.recomputeStats();
            game.audio.play("equip");
            this.renderInventory(player, game);
            this.renderHotbar(player);
          }
          return;
        }
        // Normal click: pick up / place / swap / merge
        const r = player.inventory.pickCursor(i, false, this.cursorItem);
        if (r.changed) {
          this.cursorItem = r.cursor;
          game.audio.play("pickup");
          this._syncCursorGhost();
          this.renderInventory(player, game);
          this.renderHotbar(player);
        } else if (i < 9 && !this.cursorItem) {
          player.inventory.select(i);
          this.renderInventory(player, game);
          this.renderHotbar(player);
        }
      });
      el.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        // Right-click: half pick if empty cursor, else place one
        let r;
        if (this.cursorItem) {
          r = player.inventory.placeOne(i, this.cursorItem);
        } else {
          r = player.inventory.pickCursor(i, true, null);
        }
        if (r.changed) {
          this.cursorItem = r.cursor;
          game.audio.play("pickup");
          this._syncCursorGhost();
          this.renderInventory(player, game);
          this.renderHotbar(player);
        }
      });
      grid.appendChild(el);
    });
    this._syncCursorGhost();

    // equipment
    const eq = player.inventory.equipment;
    this.els.equipPanel.innerHTML = ["head", "chest", "legs"]
      .map((slot) => {
        const id = eq[slot];
        return `<div class="equip-slot interactive" data-slot="${slot}">
          <div class="equip-label">${slot}</div>
          ${
            id
              ? `${itemIconHtml(id)}<div class="equip-name">${ITEMS[id]?.name}</div>`
              : `<div class="equip-empty">empty</div>`
          }
        </div>`;
      })
      .join("");
    this.els.equipPanel.querySelectorAll(".equip-slot").forEach((el) => {
      el.addEventListener("click", () => {
        const slot = el.dataset.slot;
        if (player.inventory.unequip(slot)) {
          player.recomputeStats();
          game.audio.play("equip");
          this.renderInventory(player, game);
          this.renderHotbar(player);
        }
      });
    });

    this.renderRecipes(player, game);
  }

  renderRecipes(player, game) {
    this._lastCraftPlayer = player;
    this._lastCraftGame = game;
    const list = this.els.recipeList;
    if (!list) return;
    list.innerHTML = "";
    const stations = stationsNear(game.world, player.pos, 12);
    if (this.els.stationBadge) {
      this.els.stationBadge.textContent = `Nearby: ${formatStations(stations)}`;
    }
    const entries = listRecipes(player.inventory, {
      query: this.craftQuery,
      category: this.craftCategory,
      stations,
    });
    if (!entries.length) {
      list.innerHTML = `<div class="recipe-empty">No recipes match. Chop wood → craft <strong>Planks</strong> by hand, or stand near your Work Bench.</div>`;
      return;
    }
    for (const { recipe, ready, max, missingStation, station } of entries) {
      const res = ITEMS[recipe.result.item];
      const el = document.createElement("div");
      el.className = "recipe" + (ready ? " ready" : " disabled");
      const costHtml = recipe.cost
        .map((c) => {
          const have = player.inventory.count(c.item);
          const ok = have >= c.count;
          const name = ITEMS[c.item]?.name || c.item;
          return `<span class="cost-chip ${ok ? "ok" : "short"}">${have}/${c.count} ${name}</span>`;
        })
        .join("");
      const stLabel =
        station && station !== "none"
          ? `<span class="station-need ${missingStation ? "miss" : "ok"}">${STATION_LABELS[station] || station}</span>`
          : "";
      el.innerHTML = `
        <div class="recipe-main">
          <div class="recipe-name">${res?.name || recipe.result.item} <span class="recipe-qty">×${recipe.result.count}</span>${
            ready && max > 1 ? ` <span class="recipe-max">(${max})</span>` : ""
          } ${stLabel}</div>
          <div class="recipe-cost">${costHtml}</div>
        </div>
        <div class="slot-icon recipe-icon" style="background-image:url(${itemIconUrl(recipe.result.item)});width:28px;height:28px"></div>
      `;
      if (ready) {
        el.title = "Click: craft 1 · Shift+click: craft all";
        el.addEventListener("click", (ev) => {
          const st = stationsNear(game.world, player.pos, 12);
          const times = ev.shiftKey ? maxCraftable(player.inventory, recipe, st) : 1;
          const n = craftMany(player.inventory, recipe, times, st);
          if (n > 0) {
            game.audio.play("craft");
            game.achievements.onCraft();
            this.toast(n > 1 ? `Crafted ${res?.name} ×${n * recipe.result.count}` : `Crafted ${res?.name}`);
            this.renderInventory(player, game);
            this.renderHotbar(player);
          }
        });
      } else {
        el.title = missingStation
          ? `Need ${STATION_LABELS[missingStation] || missingStation} nearby`
          : "Missing materials";
      }
      list.appendChild(el);
    }
  }

  renderHotbar(player) {
    const hb = this.els.hotbar;
    hb.innerHTML = "";
    player.inventory.hotbar.forEach((slot, i) => {
      const el = document.createElement("div");
      el.className = "slot" + (i === player.inventory.selected ? " selected" : "");
      el.innerHTML = `<span class="slot-key">${i + 1}</span>`;
      if (slot) {
        const pref = slot.prefix ? ` (${slot.prefix})` : "";
        el.innerHTML += `
          ${itemIconHtml(slot.id)}
          <span class="slot-count">${slot.count > 1 ? slot.count : ""}</span>
        `;
        el.title = (ITEMS[slot.id]?.name || slot.id) + pref;
      }
      hb.appendChild(el);
    });

    const eq = player.inventory.equipment;
    this.els.equipStrip.innerHTML = ["head", "chest", "legs", "acc1", "acc2"]
      .map((s) => {
        const id = eq[s];
        return `<div class="equip-mini" title="${s}">${
          id
            ? `<div class="slot-icon" style="background-image:url(${itemIconUrl(id)});width:18px;height:18px"></div>`
            : "·"
        }</div>`;
      })
      .join("");
  }

  update(dt, player, game) {
    if (this._toastTimer > 0) {
      this._toastTimer -= dt;
      if (this._toastTimer <= 0) this.els.toast.classList.remove("visible");
    }

    if (!game.playing) return;

    const hpPct = (player.hp / player.maxHp) * 100;
    const manaPct = (player.mana / player.maxMana) * 100;
    this.els.hpFill.style.width = `${hpPct}%`;
    this.els.manaFill.style.width = `${manaPct}%`;
    this.els.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    this.els.manaText.textContent = `${Math.floor(player.mana)} / ${player.maxMana}`;
    this.els.defText.textContent = String(player.defense);

    this.els.time.textContent = game.dayNight.label;
    this.els.time.classList.toggle("blood", game.dayNight.bloodMoon);
    this.els.depth.textContent = `Y ${Math.floor(player.pos.y)} · Seed ${game.worldSeed}`;
    if (this.els.coins) {
      const c = countCoins(player.inventory);
      this.els.coins.innerHTML = formatCoinsHtml(c);
    }
    this.renderHotbar(player);

    // hurt / low-HP vignettes
    if (this._hurtFlash > 0) this._hurtFlash = Math.max(0, this._hurtFlash - dt * 2.5);
    if (this.els.hurtVignette) {
      this.els.hurtVignette.style.opacity = String(Math.min(0.75, this._hurtFlash * 0.7));
    }
    if (this.els.lowHpVignette) {
      const low = player.hp / player.maxHp < 0.3 && !player.dead ? 1 - player.hp / player.maxHp : 0;
      this.els.lowHpVignette.style.opacity = String(low * 0.55);
    }

    // victory once
    if (game.victory && !this._victoryShown && this.els.victory) {
      this._victoryShown = true;
      const bc = game.progression?.bossesDefeated?.size ?? 18;
      this.els.victorySub.textContent = `Bosses ${bc}/18 · Playtime ${formatTime(player.playTime)} · ${game.progression?.difficulty || "classic"}`;
      this.els.victory.classList.add("visible");
      document.exitPointerLock?.();
    }

    if (player.lookHit) {
      const name = BLOCKS[player.lookHit.id]?.name || "Block";
      let extra = "";
      if (player.breakTarget === `${player.lookHit.x},${player.lookHit.y},${player.lookHit.z}`) {
        extra = `  ${Math.floor(player.breakProgress * 100)}%`;
      }
      this.els.target.textContent = name + extra;
      this.els.target.classList.add("visible");
    } else {
      this.els.target.classList.remove("visible");
    }

    const boss = game.entities.getBoss();
    if (boss) {
      this.els.bossPanel.classList.add("visible");
      this.els.bossName.textContent = ENEMY_TYPES[boss.type]?.name || "Boss";
      const pct = (boss.hp / boss.maxHp) * 100;
      this.els.bossFill.style.width = `${pct}%`;
      this.els.bossText.textContent = `${Math.ceil(boss.hp)} / ${boss.maxHp}`;
    } else {
      this.els.bossPanel.classList.remove("visible");
    }

    this.els.death.classList.toggle("visible", player.dead);
    if (player.dead) {
      const bc = game.progression?.bossesDefeated?.size ?? player.bossesDefeated.size;
      this.els.deathSub.textContent = `Kills ${player.killCount} · Bosses ${bc}/18 · Playtime ${formatTime(player.playTime)}`;
    }

    const fpsShow = game.settings?.showFps !== false;
    this.els.fps.style.display = fpsShow ? "" : "none";
    if (fpsShow) {
      const bc = game.progression?.bossesDefeated?.size ?? player.bossesDefeated.size;
      const hm = game.progression?.hardmode ? "HM" : "Pre";
      const diff = game.progression?.difficulty || "classic";
      const ev = game.events?.active?.type || "-";
      const best = ((game.bestiary?.completion?.() || 0) * 100) | 0;
      this.els.fps.textContent = `${game.fps} FPS · ${diff} · ${hm} · Bosses ${bc}/18 · Best ${best}% · Ev ${ev}`;
    }

    // buff bar
    this.renderBuffs(player);
    // event banner
    if (game.events?.active) {
      const e = game.events.active;
      this.els.time.classList.add("blood");
      this.els.time.textContent = `${e.type.replace("_", " ")} ${e.killed}/${e.goal}`;
    }
  }

  renderBuffs(player) {
    if (!this.els.buffBar) return;
    const list = player.buffs?.list?.() || [];
    this.els.buffBar.innerHTML = list
      .map(
        (b) =>
          `<div class="buff-chip" style="--buff:${b.color}" title="${b.name}">
            <span class="buff-dot" style="background:${b.color}"></span>
            <span class="buff-name">${b.name}</span>
            <span class="buff-time">${Math.ceil(b.remaining)}s</span>
          </div>`
      )
      .join("");
  }

  /** Red screen flash on damage */
  flashDamage(_amount) {
    this._hurtFlash = 1;
  }

  openInfo(title, html) {
    if (!this.els.infoOverlay) return;
    this.els.infoTitle.textContent = title;
    this.els.infoBody.innerHTML = html;
    this.els.infoOverlay.classList.add("visible");
    document.exitPointerLock?.();
  }

  closeInfo() {
    this.els.infoOverlay?.classList.remove("visible");
  }

  isInfoOpen() {
    return !!this.els.infoOverlay?.classList.contains("visible");
  }

  openNpcDialog(npc, game) {
    const def = npc.def;
    const line = def.dialog[(Math.random() * def.dialog.length) | 0];
    if (def.shop?.length) {
      this.openShop(npc, game);
    } else {
      this.openInfo(def.name, `<p class="info-quote">"${line}"</p>`);
    }
    if (def.id === "nurse" && game.player.hp < game.player.maxHp) {
      const cost = Math.ceil((game.player.maxHp - game.player.hp) * 10);
      if (countCoins(game.player.inventory) >= cost && spendCoins(game.player.inventory, cost)) {
        game.player.hp = game.player.maxHp;
        this.toast(`Nurse healed you for ${cost} copper.`);
        game.audio.play("heal");
      } else {
        this.toast(`Healing costs ${cost} copper.`);
      }
    }
  }

  openShop(npc, game) {
    const coins = countCoins(game.player.inventory);
    const rows = (npc.def.shop || [])
      .map((entry) => {
        const name = ITEMS[entry.item]?.name || entry.item;
        const icon = itemIconHtml(entry.item, "slot-icon shop-icon");
        const afford = coins >= entry.price;
        return `<button class="shop-row interactive ${afford ? "" : "disabled"}" data-item="${entry.item}" data-price="${entry.price}">
          ${icon}
          <span class="shop-name">${name}</span>
          <span class="shop-price">${formatCoinsText(entry.price)}</span>
        </button>`;
      })
      .join("");
    const sel = game.player.inventory.selectedItem;
    const sellVal = sel
      ? Math.max(1, Math.floor((ITEMS[sel.id]?.value || 10) * sel.count * 0.25))
      : 0;
    const sellRow = sel
      ? `<button class="shop-row interactive sell-row" id="shop-sell">
          ${itemIconHtml(sel.id, "slot-icon shop-icon")}
          <span class="shop-name">Sell ${ITEMS[sel.id]?.name || sel.id} ×${sel.count}</span>
          <span class="shop-price">+${formatCoinsText(sellVal)}</span>
        </button>`
      : `<p class="hint">Select a hotbar item (1–9) to sell it here.</p>`;
    this.openInfo(
      `${npc.def.name} — Shop`,
      `<p class="hint">Wallet: ${formatCoinsText(coins)} · Hotbar slot sells below</p>
       <div class="shop-list">${rows}</div>
       <h3 class="panel-h3" style="margin-top:12px">Sell</h3>
       ${sellRow}`
    );
    this.els.infoBody.querySelectorAll(".shop-row:not(.disabled):not(.sell-row)").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.getAttribute("data-item");
        const price = Number(btn.getAttribute("data-price"));
        const r = buyItem(game.player.inventory, { item, price });
        if (r.ok) {
          this.toast(`Bought ${ITEMS[item]?.name || item}`);
          game.audio.play("craft");
          this.openShop(npc, game);
          this.renderHotbar(game.player);
        } else {
          this.toast(r.error || "Cannot buy");
        }
      });
    });
    this.els.infoBody.querySelector("#shop-sell")?.addEventListener("click", () => {
      const s = game.player.inventory.selectedItem;
      if (!s) return;
      const r = sellItem(game.player.inventory, s.id, s.count);
      if (r.ok) {
        this.toast(`Sold for ${formatCoinsText(r.value)}`);
        game.audio.play("pickup");
        this.openShop(npc, game);
        this.renderHotbar(game.player);
      }
    });
  }

  openJournal(progression) {
    if (!progression) return;
    const lines = progression.bossProgress().map((b) => {
      const mark = b.defeated ? "✓" : b.locked ? "🔒" : "○";
      const cls = b.defeated ? "done" : b.locked ? "locked" : "";
      return `<div class="journal-row ${cls}"><span>${mark}</span> ${b.name}</div>`;
    });
    const hm = progression.hardmode ? "HARDMODE" : "Pre-Hardmode";
    const diff = progression.difficulty || "classic";
    const pct = (progression.completionRatio() * 100) | 0;
    this.openInfo(
      "Boss Journal",
      `<p class="hint">${hm} · ${diff} · ${pct}% complete</p><div class="journal-list">${lines.join("")}</div>`
    );
  }

  openBestiary(bestiary) {
    if (!bestiary) return;
    const entries = bestiary.entries().filter((e) => e.unlocked);
    const pct = (bestiary.completion() * 100) | 0;
    const rows = entries.length
      ? entries
          .map((e) => `<div class="journal-row done"><span>○</span> ${e.name} <em>×${e.kills}</em></div>`)
          .join("")
      : `<p class="hint">Kill enemies to fill the bestiary.</p>`;
    this.openInfo(`Bestiary ${pct}%`, `<div class="journal-list">${rows}</div>`);
  }

  tryReforge(game) {
    const inv = game.player.inventory;
    const r = reforgeSlotSync(inv, inv.selected, (cost) => spendCoins(inv, cost));
    if (r.ok) {
      this.toast(`Reforged: ${r.prefix} (−${r.cost}c)`);
      game.audio.play("craft");
      game.achievements?.onReforge?.();
    } else {
      this.toast(r.error || "Reforge failed");
    }
  }

  showVictory(game) {
    this.toast("✦ TERRARIAN VICTORY ✦ All major threats defeated. Explore, build, or fight again!", 8);
    this.showTip(
      `Campaign complete · Bosses ${game.progression?.bossesDefeated?.size || 0}/18 · Kills ${game.player?.killCount}`,
      10
    );
    if (this.els.victory && !this._victoryShown) {
      this._victoryShown = true;
      this.els.victorySub.textContent = `Bosses ${game.progression?.bossesDefeated?.size || 0}/18 · Kills ${game.player?.killCount || 0}`;
      this.els.victory.classList.add("visible");
      document.exitPointerLock?.();
    }
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${s}s`;
}

/** Copper total → human string */
function formatCoinsText(copper) {
  const c = Math.max(0, copper | 0);
  const plat = Math.floor(c / 1000000);
  const gold = Math.floor((c % 1000000) / 10000);
  const silver = Math.floor((c % 10000) / 100);
  const cop = c % 100;
  const parts = [];
  if (plat) parts.push(`${plat}p`);
  if (gold) parts.push(`${gold}g`);
  if (silver) parts.push(`${silver}s`);
  if (cop || !parts.length) parts.push(`${cop}c`);
  return parts.join(" ");
}

function formatCoinsHtml(copper) {
  const c = Math.max(0, copper | 0);
  const plat = Math.floor(c / 1000000);
  const gold = Math.floor((c % 1000000) / 10000);
  const silver = Math.floor((c % 10000) / 100);
  const cop = c % 100;
  const bits = [];
  if (plat) bits.push(`<span class="coin plat">${plat}</span>`);
  if (gold) bits.push(`<span class="coin gold">${gold}</span>`);
  if (silver) bits.push(`<span class="coin silver">${silver}</span>`);
  bits.push(`<span class="coin copper">${cop}</span>`);
  return bits.join("");
}
