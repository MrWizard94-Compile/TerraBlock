# TerraBlock Architecture (v2.0 Studio)

## Overview

Single-page WebGL client. `Game` owns renderer, scene, input, systems, save lifecycle, and the frame loop. No backend.

```
main.js → Game
  Input, Settings, Audio, UI
  World (chunks + modifications)
  Player + Inventory (equipment)
  EntityManager (mobs/bosses/projectiles)
  ItemDropSystem, Particles, FloatingText
  DayNight (blood moon)
  Achievements
  SaveGame (localStorage)
```

## Persistence

- **Settings**: `localStorage` key `terrablock_settings_v2`
- **Save slot**: `terrablock_save_v2` JSON
  - seed, dayTime, player vitals/inventory/equipment, achievements
  - `modifications: [x,y,z,id][]` applied after procedural gen
- **Auto-save**: every 60s when enabled
- Save on death and quit-to-title

## Combat & defense

`finalDamage = max(1, floor(raw * (1 - min(0.7, defense * 0.04))))`

Armor set bonuses: shadow mana regen, molten move speed, shadow melee damage.

## Performance

| Concern | Approach |
|---------|----------|
| Draw calls | One mesh/chunk, shared material |
| Rebuild | Dirty queue cap per frame |
| Streaming | Render distance 2–8 (settings) |
| Entities | Cap ~20 (28 blood moon), despawn far |
| Pixel ratio | Capped via settings |

## Failure modes

| Case | Behavior |
|------|----------|
| Full inventory | Spawns world item drop |
| Corrupt save | Continue hidden / ignored |
| WebGL missing | Blank canvas (documented) |
| Audio blocked | Resumes on user gesture |
| Boss active | Summon blocked, item kept |

## Testing

- Unit: noise, inventory, craft, content integrity, RNG, settings, save validation, achievements
- Runtime: manual smoke in README
