# Architecture Decision Records — TerraBlock

## ADR-001: Browser + Three.js instead of a native engine

**Status**: Accepted  
**Context**: Need a drop-in playable 3D voxel game with zero install friction for the human director.  
**Decision**: Vite + vanilla ES modules + Three.js r185.  
**Consequences**: Fast iteration and one-command `npm run dev`. No multiplayer server. Performance depends on client GPU/CPU for meshing.

## ADR-002: Chunked face-culled meshes (not greedy meshing v1)

**Status**: Accepted  
**Context**: Greedy meshing improves vertex count but complicates AO and rebuilds.  
**Decision**: Per-face cull with vertex colors + corner AO.  
**Consequences**: Acceptable for RENDER_DISTANCE 4. Can upgrade to greedy later without changing block storage.

## ADR-003: Node built-in test runner (not Vitest)

**Status**: Accepted  
**Context**: SOUL supply-chain hygiene; Vitest pulled a critical UI-server advisory.  
**Decision**: `node --test` for pure logic tests.  
**Consequences**: No browser/DOM test harness yet; Three.js runtime paths covered by manual verification + build.

## ADR-004: Exact dependency pins

**Status**: Accepted  
**Context**: SOUL §22 reproducibility.  
**Decision**: `"three": "0.185.1"` and exact devDependency versions.  
**Consequences**: Upgrades are deliberate, audited, and documented.

## ADR-005: Pure data modules separate from runtime

**Status**: Accepted  
**Context**: Enemy defs imported by UI and integrity tests must not force WebGL.  
**Decision**: `enemies.js` holds ENEMY_TYPES; `Entities.js` owns meshes/AI.  
**Consequences**: Cleaner tests and clearer ownership.

## ADR-006: URL seed for terrain determinism

**Status**: Accepted  
**Context**: SOUL determinism for world gen and debugging.  
**Decision**: `?seed=<uint>` fixes world seed; title seed field; shown in HUD.  
**Consequences**: Combat drops/spawns remain stochastic unless later seeded RNG is introduced.

## ADR-007: Modification-list saves (not full chunk dumps)

**Status**: Accepted (v2)  
**Context**: Full voxel dumps blow localStorage quotas.  
**Decision**: Persist seed + `[x,y,z,id]` mods; regenerate then apply.  
**Consequences**: Fast saves; ruins re-gen then overlay player edits correctly.

## ADR-008: Shared chunk material

**Status**: Accepted (v2)  
**Context**: Per-chunk material dispose churn.  
**Decision**: One `MeshLambertMaterial` for all chunk meshes.  
**Consequences**: Must not dispose material on chunk unload.

## ADR-009: Single local save slot

**Status**: Accepted (v2)  
**Context**: Solo director play; cognitive simplicity.  
**Decision**: One slot `terrablock_save_v2`.  
**Consequences**: Multi-world library deferred.
