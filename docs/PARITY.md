# Terraria Parity Report — TerraBlock **honest re-score**

**Correction (2026-07):** Earlier v5 tables claiming **~75–88% parity per pillar were wrong.**  
They measured “did we ship a checkbox for this system?” against a **tiny browser/desktop voxel sandbox**, not against real Terraria depth. That inflated every score.

This document is the **honest** score vs **Terraria 1.4.x** (full game).  
**Overall: roughly 12–20% of Terraria** depending on how you weight content vs systems.

---

## Content volume (raw counts)

| Content | TerraBlock (approx) | Terraria (order of magnitude) | Ratio (ballpark) |
|---------|---------------------|--------------------------------|------------------|
| Items | ~256 | ~5,000+ | **~5%** |
| Blocks / tiles | ~50 | hundreds + walls + wires | **~5–10%** |
| Recipes | ~130 | thousands | **~5%** |
| Enemies | ~55 | hundreds | **~10%** |
| Bosses (named fight) | 18 chain slots | ~20+ major + mini | **names only ~60%; fight depth ~15%** |
| NPCs | ~15 | 25+ town + pets etc. | **~40% names; ~15% systems** |
| Biomes | few (forest/desert/snow/jungle/corrupt/hell/hallow-lite) | many + sub-biomes | **~15%** |
| Events / invasions | 5-ish | many | **~20% names; ~15% depth** |

**Content volume score: ~8–12%.** Not 80%.

---

## Pillars (honest)

| Pillar | Inflated v5 claim | **Honest now** | Why |
|--------|-------------------|----------------|-----|
| **Core loop** dig / build / fight / craft / progress | ~85% | **~35–45%** | Loop exists and is playable, but 3D voxel ≠ Terraria 2D feel; combat/AI/mobility thin; progression is a thin spine of bosses with simplified loot. |
| **Content volume** | ~80% | **~10%** | Hundreds of items/recipes vs thousands; tiny tile set; sparse unique drops. |
| **Systems depth** | ~85% | **~20–25%** | Many systems exist as **stubs or thin versions**: housing, shops, fishing, mounts, minions, prefixes, buffs, events, bestiary, piggy. Few have Terraria-grade rules, edge cases, or content breadth. Crafting stations barely matter. No wiring, no true wall system, no loadouts, no research, no journey mode, etc. |
| **Polish / UX / art** | ~88% | **~20–30%** | Procedural pixels, basic HUD, inventory move, better crafting list — still far from Re-Logic presentation, animation, SFX, juiciness, accessibility, tutorialization. |
| **Multiplayer / longevity** | ~80% | **~10–15%** | Local WebSocket position/block relay is a prototype, not Terraria netcode, worlds, or live service longevity. |

**Weighted overall vs full Terraria: ~18–25% (±5)** after systems + completion passes  
(stations, bars, starter camp, guide tips, boss loot packages, copper/silver sets, regen, richer caves).  
Still **not** near-complete Terraria. Calling anything “≥75% parity” was marketing cosplay.

---

## What *is* real (credit without lying)

TerraBlock **is** a complete *product for a small scope*:

- Desktop Electron app + save/continue  
- Dig / place / craft / fight day-night loop  
- Named 18-boss campaign arc + hardmode flag + victory flag  
- Inventory move, crafting UI (search/tabs/batch), basic gear tiers  
- Some invasions, NPCs, fishing, mounts, minions, prefixes as **light systems**

That is a **prototype / indie sandbox spine**, not “three-quarters of Terraria.”

---

## Largest gaps (if the goal is real parity)

1. **Content factory** — 10× items, recipes, drops, biomes, structures  
2. **Combat** — enemy AI, invuln windows, projectiles, boss phases that aren’t reskins  
3. **World** — generation with real biomes, multiplayer-safe structures, underground layers that feel different  
4. **Systems completeness** — housing validation players trust, shops with stock, fishing that matters, accessories that stack meaningfully  
5. **Presentation** — art pipeline, animations, audio, juice  
6. **2D vs 3D** — Terraria identity is side-view; a 3D voxel game can only ever be a *cousin*, not a percent-match remake  

Even with years of work, **100% parity is the wrong metric** for a 3D voxel title. Better metric: **“does this stand as its own Terraria-inspired game?”** Today: **early Early Access cousin**, not near-complete remake.

---

## Honest status labels

| Label | Accurate? |
|-------|-----------|
| “Shipped full Terraria in browser/desktop” | **No** |
| “≥75% Terraria parity” | **No** |
| “Playable Terraria-inspired 3D sandbox with a boss ladder” | **Yes** |
| “Studio polish” | **No** — functional, still rough |

---

## Verify (engineering quality, not parity)

```bash
npm run verify && npm run playtest
```

Green verify means **code builds and smoke-tests**. It does **not** mean content parity.
