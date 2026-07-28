# Changelog

## 5.3.4 — No third-party textures in the product (2026)

- **Policy**: TerraBlock does **not** ship anyone else’s IP as game art
- Removed interim pack from `public/`; product atlas is **procedural only**
- Optional **local-only** placeholders: gitignored `local/textures/blocks/`, served only in Vite DEV (`/__local_textures/`) — never in dist/pack
- Personal jar extracts stay on your machine for layout reference; never commit or redistribute

## 5.3.2 — Real playtest gate (2026)

Playtest is no longer a toy smoke path:

- Bridge v2: world probe, stations, NPCs, fishing, inventory_swap, smelt, chest loot, boss spawn
- **33 acceptance checks** (camp, trees, water, craft, combat, fishing, …)
- `npm run verify` runs playtest by default (`SKIP_PLAYTEST=1` to skip)

## 5.3.0 — Complete the spine (2026)

Continued build-out without stopping:

- Copper + silver full armor/weapon sets; axes mine wood properly
- Out-of-combat life regen; bed sets spawn; combat i-frames already in
- **Guide** progressive tips (saved)
- Boss **guaranteed bonus loot** packages for progression
- Richer caves, hell layer, more ore veins, underground water
- Guide-driven early loop: cabin → chest → smelt → anvil → armor → boss

## 5.2.0 — Proper systems pass (2026)

Not “85% Terraria” — real gameplay depth for the spine:

- **Ore → bars → gear** at Furnace / Anvil (stations required)
- **Starter cabin** on New World: walls, door, light, table, chair, workbench, furnace, bed, chest
- **Starter chest** copper/iron/coal so smelting works immediately
- Crafting UI shows **nearby stations** + station tags on recipes
- Underground **cave cabins** with loot chests
- Combat: real enemy i-frames, knockback, less rush AI
- Better chest loot (accessories / bars chance)

## 5.1.2 — Honest parity correction (2026)

- **Retracted** inflated “~75–88% Terraria parity” claims from v5 docs  
- `docs/PARITY.md` rewritten: overall **~15%** vs full Terraria; content ~10%, systems ~20–25%  
- README / AGENTS no longer market checkbox systems as near-complete remakes  

## 5.1.1 — Living world (2026)

### World gen (no more empty hills)
- **Dense forests** — trees every few blocks, not 1.5% RNG lottery
- Full canopy oaks, jungle giants, snow pines, desert cactus
- Bushes, mushrooms, surface rocks, vines
- `dense_forest` biome + forced fill pass so chunks never look barren
- Richer height (continent + ridges)
- Render distance default **6**, farther fog so canopies stay visible

## 5.1.0 — Desktop (2026)

**Native Windows desktop app** via Electron — no browser tab required.

### Desktop
- Electron main process + sandboxed preload (`window.terrablockDesktop`)
- `npm run desktop` — build + launch window
- `npm run desktop:dev` — Vite + Electron together
- `npm run desktop:pack` — NSIS installer + portable `.exe` → `release/`
- F11 fullscreen, single-instance lock, app user model id
- Vite `base: './'` for `file://` packaging
- Title UI: Desktop Edition branding

### Still available
- Browser `npm run dev` for playtest tooling
- Verify + Playwright smoke unchanged

## 5.0.0 — Ship / Home (2026)

**Final production release** of TerraBlock Studio Edition.

### Highlights
- Campaign victory on Moon Lord defeat (victory banner UI)
- Save migration v2/v3 → v4
- Title-screen difficulty selector (Classic / Expert / Master)
- Full achievement set (40) covering bosses, events, systems
- Expert+ loot scaling; death coin drops
- Mounts, reforge, bestiary, piggy bank, summons (from v4)
- 18 bosses · 5 invasions · NPCs · multiplayer relay

### Visual polish (ship)
- Procedural block texture atlas (pixel tiles, ores, grass, wood rings)
- Per-item pixel icons (hotbar, inventory, world drops)
- First-person held item + slim arm viewmodel with swing/bob
- Entity / NPC / minion billboard sprites with shadows
- Soft particles, glowing projectiles with trails
- Mining crack stages, sun/moon discs, night starfield
- HUD: coin wallet, buff chips, hurt/low-HP vignettes
- Shop / journal / bestiary panels; polished chrome UI

### Verify
- ESLint zero warnings
- 60+ unit tests
- Production build
- Autonomous playtest smoke

## 4.0.0 — Parity 75%

Prefixes/reforge, mounts, difficulty modes, invasions (pirate/frost/martian), minions, bestiary, piggy, Hallow.

## 3.0.0 — Parity 50%

Hardmode, 15 bosses, NPCs/housing, fishing, accessories, events, multiplayer WS.

## 2.0.0 — Studio

Save/load, armor, three original bosses expanded, playtest bridge.

## 1.0.0 — Prototype

Core voxel loop, day/night, basic craft/combat.
