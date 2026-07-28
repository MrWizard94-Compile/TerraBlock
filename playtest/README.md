# TerraBlock Playtest (eyes + hands)

Autonomous acceptance suite. **You should not need to manually click through the game to know if core systems work.**

## Commands

```bash
npm run playtest          # full smoke acceptance (default gate)
npm run playtest:headed   # same, visible browser
npm run playtest:agent    # longer goal-driven agent
npm run verify            # lint + unit tests + build + playtest
```

`npm run verify` runs playtest unless `SKIP_PLAYTEST=1`.

## What smoke asserts

| Check | Why |
|-------|-----|
| start_new / alive / starter kit | Boot |
| **camp stations** (workbench, furnace, door, torch) | Starter cabin |
| **trees** (wood + leaves nearby) | World not barren |
| **water nearby** | Fishing possible |
| stations detected | Station system |
| Guide NPC | NPC spawn |
| inventory_swap | Item rearrange |
| craft planks | Hand craft |
| **smelt copper_bar** | Furnace craft |
| loot chest | Starter progression |
| mine / move | Core loop |
| combat damages slime | Combat |
| spawn boss | Boss pipeline |
| fishing bite + reel | Fishing wired |

Reports + screenshots: `playtest/output/`.

## Bridge

`?playtest=1` exposes `window.__TERRABLOCK_PLAYTEST__` (`PlaytestBridge` v2):

- `getState()` — player, inventory, world probe, stations, npcs, boss, fishing
- `command(name, args)` — start_new, craft, mine, attack, probe_world, loot_nearest_chest, spawn_boss, force_fish_bite, inventory_swap, …
