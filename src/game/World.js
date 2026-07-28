import * as THREE from "three";
import {
  CHUNK_SIZE,
  CHUNK_HEIGHT,
  RENDER_DISTANCE_DEFAULT,
  WORLD_SEA_LEVEL,
} from "./constants.js";
import { BlockId, isSolid, BLOCKS } from "./blocks.js";
import { fbm2D, valueNoise3D, hash2 } from "./noise.js";
import { meshChunk } from "./mesher.js";
import { createBlockAtlas } from "./BlockTextures.js";

export class World {
  /**
   * @param {THREE.Scene} scene
   * @param {number} seed
   */
  constructor(scene, seed = (Math.random() * 1e9) | 0) {
    this.scene = scene;
    this.seed = seed >>> 0;
    this.chunks = new Map();
    this.meshes = new Map();
    this.dirty = new Set();
    /** @type {Map<string, number>} block mods "x,y,z" -> id */
    this.modifications = new Map();
    /**
     * Door open state keyed by BOTTOM door cell "x,y,z".
     * Open doors are non-solid and swing in the mesh.
     * @type {Set<string>}
     */
    this.doorOpen = new Set();
    /** @type {Map<string, number>} door facing 0=+z 1=-x 2=-z 3=+x at bottom cell */
    this.doorFacing = new Map();
    this.renderDistance = RENDER_DISTANCE_DEFAULT;
    this.hardmode = false;
    this.group = new THREE.Group();
    this.group.name = "world";
    scene.add(this.group);

    // Product art: procedural atlas. DEV-only local placeholders never ship.
    this.atlas = createBlockAtlas();
    this.sharedMaterial = this.atlas.material;
    if (this.atlas.packReady) {
      this.atlas.packReady.then((stats) => {
        if (stats?.loaded > 0) this.sharedMaterial.needsUpdate = true;
      });
    }
  }

  setRenderDistance(d) {
    this.renderDistance = Math.max(2, Math.min(8, d | 0));
  }

  key(cx, cz) {
    return `${cx},${cz}`;
  }

  modKey(x, y, z) {
    return `${x},${y},${z}`;
  }

  chunkCoord(x) {
    return Math.floor(x / CHUNK_SIZE);
  }

  getChunk(cx, cz) {
    return this.chunks.get(this.key(cx, cz));
  }

  ensureChunk(cx, cz) {
    const k = this.key(cx, cz);
    let chunk = this.chunks.get(k);
    if (!chunk) {
      chunk = this.generateChunk(cx, cz);
      this.chunks.set(k, chunk);
      this.applyModsToChunk(chunk);
      this.dirty.add(k);
    }
    return chunk;
  }

  generateChunk(cx, cz) {
    const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    const baseX = cx * CHUNK_SIZE;
    const baseZ = cz * CHUNK_SIZE;
    /** @type {number[][]} surface map [lz][lx] = surface y */
    const surfaces = Array.from({ length: CHUNK_SIZE }, () => new Array(CHUNK_SIZE).fill(WORLD_SEA_LEVEL));
    /** @type {string[][]} */
    const biomes = Array.from({ length: CHUNK_SIZE }, () => new Array(CHUNK_SIZE).fill("forest"));

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = baseX + lx;
        const wz = baseZ + lz;

        // richer terrain: continental + ridges + detail
        const continent = fbm2D(wx * 0.006, wz * 0.006, this.seed, 4);
        const heightNoise = fbm2D(wx * 0.018, wz * 0.018, this.seed + 1, 5);
        const ridge = Math.abs(fbm2D(wx * 0.04, wz * 0.04, this.seed + 2, 3) - 0.5) * 2;
        const detail = fbm2D(wx * 0.09, wz * 0.09, this.seed + 7, 3);
        const surface = Math.floor(
          WORLD_SEA_LEVEL + (continent - 0.45) * 10 + heightNoise * 16 + ridge * 6 + detail * 3
        );
        surfaces[lz][lx] = surface;

        const biomeN = fbm2D(wx * 0.007, wz * 0.007, this.seed + 99, 4);
        const forestN = fbm2D(wx * 0.03, wz * 0.03, this.seed + 404, 3);
        let biome = "forest";
        if (biomeN < 0.22) biome = "desert";
        else if (biomeN < 0.34) biome = "jungle";
        else if (biomeN > 0.82) biome = "snow";
        else if (Math.abs(biomeN - 0.52) < 0.05 && heightNoise > 0.42) biome = "corrupt";
        else if (this.hardmode && Math.abs(biomeN - 0.68) < 0.05) biome = "hallow";
        else if (forestN > 0.55) biome = "dense_forest";
        else if (continent < 0.32) biome = "beach";
        biomes[lz][lx] = biome;

        const desert = biome === "desert";
        const jungle = biome === "jungle";
        const snow = biome === "snow";
        const corrupt = biome === "corrupt";
        const hallow = biome === "hallow";
        const beach = biome === "beach";

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          let id = BlockId.AIR;
          if (y === 0) {
            id = BlockId.BEDROCK;
          } else if (y < 4 && hash2(wx, y * 1000 + wz, this.seed) < 0.4) {
            id = BlockId.BEDROCK;
          } else if (y > surface) {
            if (y <= WORLD_SEA_LEVEL - 2 && surface < WORLD_SEA_LEVEL - 2) {
              id = BlockId.WATER;
            } else {
              id = BlockId.AIR;
            }
          } else if (y === surface) {
            if (desert || beach) id = BlockId.SAND;
            else if (snow) id = BlockId.SNOW;
            else if (jungle) id = BlockId.JUNGLE_GRASS;
            else if (hallow) id = BlockId.PEARLSTONE;
            else if (corrupt) id = BlockId.CORRUPT;
            else id = BlockId.GRASS;
          } else if (y > surface - 5) {
            if (desert || beach) id = BlockId.SAND;
            else if (hallow) id = BlockId.PEARLSTONE;
            else if (corrupt) id = BlockId.CORRUPT;
            else if (y > surface - 2 && hash2(wx, y + wz, this.seed + 11) < 0.14) id = BlockId.CLAY;
            else id = BlockId.DIRT;
          } else if (y < 10) {
            // Underworld / hell layer
            id = BlockId.ASH;
            if (hash2(wx, y + wz * 3, this.seed + 3) > 0.55) id = BlockId.HELLSTONE;
            if (hash2(wx, y + wz * 3, this.seed + 4) > 0.82) id = BlockId.STONE;
            // lava pockets as water stand-in (hell "lakes")
            if (y > 2 && y < 7 && hash2(wx, y * 9 + wz, this.seed + 66) > 0.93) id = BlockId.WATER;
          } else {
            id = corrupt ? BlockId.EBONSTONE : BlockId.STONE;
            if (snow && y > surface - 14) id = BlockId.ICE;
            // mid-layer dirt veins
            if (y > surface - 20 && y < surface - 6 && hash2(wx, y + wz, this.seed + 19) > 0.92) {
              id = BlockId.DIRT;
            }

            const oreN = valueNoise3D(wx * 0.12, y * 0.12, wz * 0.12, this.seed + 50);
            // richer, more visible ore veins
            if (oreN > 0.72 && y < surface - 4) {
              if (this.hardmode && y < 22 && oreN > 0.88) id = BlockId.ADAMANTITE_ORE;
              else if (this.hardmode && y < 32 && oreN > 0.85) id = BlockId.MYTHRIL_ORE;
              else if (this.hardmode && jungle && y < 42 && oreN > 0.83) id = BlockId.CHLOROPHYTE_ORE;
              else if (y < 16 && oreN > 0.88) id = BlockId.CRYSTAL_ORE;
              else if (y < 24 && oreN > 0.86) id = BlockId.DEMONITE;
              else if (y < 30 && oreN > 0.83) id = BlockId.GOLD_ORE;
              else if (y < 38 && oreN > 0.8) id = BlockId.SILVER_ORE;
              else if (y < 48 && oreN > 0.77) id = BlockId.IRON_ORE;
              else if (y < 58 && oreN > 0.74) id = BlockId.COPPER_ORE;
              else if (oreN > 0.78) id = BlockId.COAL_ORE;
            }

            const cave = valueNoise3D(wx * 0.055, y * 0.07, wz * 0.055, this.seed + 200);
            const cave2 = valueNoise3D(wx * 0.1, y * 0.1, wz * 0.1, this.seed + 300);
            // larger cave systems
            if (cave > 0.58 && cave2 > 0.5 && y > 3 && y < surface - 2) {
              id = BlockId.AIR;
              if (hash2(wx, y * 17 + wz, this.seed + 777) > 0.991 && y < 38) {
                id = BlockId.LIFE_CRYSTAL;
              }
              // underground water pools
              if (y < 25 && cave > 0.7 && hash2(wx, y + wz, this.seed + 88) > 0.85) {
                id = BlockId.WATER;
              }
            }
          }
          data[this.idx(lx, y, lz)] = id;
        }

        // floating islands
        if (hash2(wx, wz, this.seed + 1200) > 0.997) {
          const iy = 70 + ((hash2(wx, wz, this.seed + 3) * 10) | 0);
          if (lx > 2 && lx < 14 && lz > 2 && lz < 14 && iy < CHUNK_HEIGHT - 2) {
            data[this.idx(lx, iy, lz)] = BlockId.CLOUD;
            if (hash2(lx, lz, this.seed) > 0.5) data[this.idx(lx, iy + 1, lz)] = BlockId.CHEST;
          }
        }

        // dungeon corridor pillars
        if (Math.abs(wx) > 80 && Math.abs(wx) < 100 && Math.abs(wz) < 16) {
          for (let dy = 12; dy < 28; dy++) {
            if (hash2(wx, dy + wz, this.seed + 8) > 0.45) {
              data[this.idx(lx, dy, lz)] = BlockId.DUNGEON_BRICK;
            } else if (dy > 14 && dy < 26) {
              data[this.idx(lx, dy, lz)] = BlockId.AIR;
            }
          }
        }
      }
    }

    // surface ponds (for fishing)
    this.carvePonds(data, baseX, baseZ, surfaces, biomes);

    // Surface decoration pass — trees, bushes, mushrooms, rocks, cactus
    this.decorateSurface(data, baseX, baseZ, surfaces, biomes);

    // occasional surface structure
    if (hash2(cx, cz, this.seed + 900) > 0.88) {
      this.placeRuins(data, cx, cz);
    }

    // underground cabins with loot chests
    if (hash2(cx, cz, this.seed + 1400) > 0.86) {
      const lx = 3 + ((hash2(cx, 1, this.seed) * 8) | 0);
      const lz = 3 + ((hash2(cz, 2, this.seed) * 8) | 0);
      const y = 12 + ((hash2(cx, cz, this.seed + 5) * 28) | 0);
      this.placeCaveCabin(data, lx, y, lz);
    }

    return { cx, cz, data, dirty: true };
  }

  /**
   * Small surface ponds so fishing works without hunting the whole map.
   */
  carvePonds(data, baseX, baseZ, surfaces, biomes) {
    for (let lz = 2; lz < CHUNK_SIZE - 4; lz += 4) {
      for (let lx = 2; lx < CHUNK_SIZE - 4; lx += 4) {
        const wx = baseX + lx;
        const wz = baseZ + lz;
        const biome = biomes[lz][lx];
        if (biome === "desert" || biome === "snow") continue;
        if (hash2(wx, wz, this.seed + 333) < 0.91) continue;
        const surface = surfaces[lz][lx];
        if (surface <= WORLD_SEA_LEVEL || surface >= CHUNK_HEIGHT - 8) continue;
        const r = 2 + ((hash2(wx, wz, this.seed + 1) * 2) | 0);
        for (let dz = -r; dz <= r; dz++) {
          for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dz * dz > r * r + 0.5) continue;
            const x = lx + dx;
            const z = lz + dz;
            if (x < 0 || z < 0 || x >= CHUNK_SIZE || z >= CHUNK_SIZE) continue;
            const sy = surfaces[z][x];
            // basin
            data[this.idx(x, sy, z)] = BlockId.WATER;
            if (sy - 1 > 0) data[this.idx(x, sy - 1, z)] = BlockId.DIRT;
            if (sy + 1 < CHUNK_HEIGHT) data[this.idx(x, sy + 1, z)] = BlockId.AIR;
            surfaces[z][x] = sy - 1;
          }
        }
      }
    }
  }

  /**
   * Dense forests, bushes, flora — what makes the world not look empty.
   * @param {Uint8Array} data
   * @param {number} baseX
   * @param {number} baseZ
   * @param {number[][]} surfaces
   * @param {string[][]} biomes
   */
  decorateSurface(data, baseX, baseZ, surfaces, biomes) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const surface = surfaces[lz][lx];
        const biome = biomes[lz][lx];
        const wx = baseX + lx;
        const wz = baseZ + lz;
        if (surface <= WORLD_SEA_LEVEL - 1) continue;
        if (surface >= CHUNK_HEIGHT - 12) continue;

        const ground = data[this.idx(lx, surface, lz)];
        // only plant on solid surface tops with air above
        if (ground === BlockId.AIR || ground === BlockId.WATER) continue;
        const above = data[this.idx(lx, surface + 1, lz)];
        if (above !== BlockId.AIR) continue;

        const r = hash2(wx, wz, this.seed + 555);
        const r2 = hash2(wx + 3, wz + 7, this.seed + 666);
        const r3 = hash2(wx * 3, wz * 5, this.seed + 777);

        // —— Trees (much denser) ——
        // Keep 2-block margin so canopies fit; still plant near edges with smaller crowns
        if (biome === "desert") {
          if (r > 0.92 && lx > 0 && lx < 15 && lz > 0 && lz < 15) {
            this.plantCactus(data, lx, surface + 1, lz, 2 + ((r2 * 3) | 0));
          }
        } else if (biome === "snow") {
          // sparse pines
          if (r > 0.9 && lx >= 2 && lx <= 13 && lz >= 2 && lz <= 13) {
            this.plantPine(data, lx, surface + 1, lz, 5 + ((r2 * 4) | 0));
          }
        } else if (biome === "jungle") {
          if (r > 0.78 && lx >= 2 && lx <= 13 && lz >= 2 && lz <= 13) {
            this.plantTree(data, lx, surface + 1, lz, {
              tall: true,
              jungle: true,
              radius: 3,
            });
            // vines hanging from canopy
            if (r3 > 0.4) this.drapeVines(data, lx, surface + 5, lz, 2 + ((r2 * 4) | 0));
          } else if (r > 0.55) {
            this.plantBush(data, lx, surface + 1, lz);
          }
        } else if (biome === "dense_forest") {
          // clumps, not a lattice — jittered chance
          if (r > 0.78 && lx >= 2 && lx <= 13 && lz >= 2 && lz <= 13 && r3 > 0.35) {
            this.plantTree(data, lx, surface + 1, lz, {
              tall: r2 > 0.4,
              radius: r2 > 0.65 ? 3 : 2,
            });
          } else if (r > 0.55 && r < 0.7) {
            this.plantBush(data, lx, surface + 1, lz);
          } else if (r > 0.3 && r < 0.38) {
            data[this.idx(lx, surface + 1, lz)] = BlockId.MUSHROOM;
          }
        } else if (biome === "forest" || biome === "hallow" || biome === "corrupt" || biome === "beach") {
          // irregular forest (avoid perfect grid)
          if (biome !== "beach" && r > 0.84 && lx >= 2 && lx <= 13 && lz >= 2 && lz <= 13 && r2 > 0.25) {
            this.plantTree(data, lx, surface + 1, lz, {
              tall: r3 > 0.5,
              radius: r2 > 0.7 ? 3 : 2,
              corrupt: biome === "corrupt",
            });
          } else if (biome !== "beach" && r > 0.62 && r < 0.75) {
            this.plantBush(data, lx, surface + 1, lz);
          } else if (r > 0.48 && r < 0.54) {
            data[this.idx(lx, surface + 1, lz)] = BlockId.MUSHROOM;
          } else if (r > 0.4 && r < 0.45) {
            data[this.idx(lx, surface + 1, lz)] = BlockId.COBBLE;
          } else if (biome === "beach" && r > 0.94) {
            this.plantCactus(data, lx, surface + 1, lz, 1 + ((r2 * 2) | 0));
          }
        }

        // Extra ground clutter in any green biome
        if (
          (biome === "forest" || biome === "dense_forest" || biome === "jungle") &&
          data[this.idx(lx, surface + 1, lz)] === BlockId.AIR
        ) {
          if (r3 > 0.88) data[this.idx(lx, surface + 1, lz)] = BlockId.MUSHROOM;
          else if (r3 > 0.82 && r3 < 0.86) data[this.idx(lx, surface + 1, lz)] = BlockId.LEAVES; // ground shrub
        }
      }
    }

    // Second pass: fill sparse patches only — irregular offsets, not a grid
    for (let n = 0; n < 6; n++) {
      const lx = 3 + ((hash2(baseX + n, baseZ, this.seed + 40) * (CHUNK_SIZE - 6)) | 0);
      const lz = 3 + ((hash2(baseZ + n, baseX, this.seed + 41) * (CHUNK_SIZE - 6)) | 0);
      const surface = surfaces[lz][lx];
      const biome = biomes[lz][lx];
      if (biome === "desert" || biome === "beach" || biome === "snow") continue;
      if (surface <= WORLD_SEA_LEVEL || surface >= CHUNK_HEIGHT - 12) continue;
      if (data[this.idx(lx, surface + 1, lz)] !== BlockId.AIR) continue;
      let hasTree = false;
      for (let dz = -3; dz <= 3 && !hasTree; dz++) {
        for (let dx = -3; dx <= 3 && !hasTree; dx++) {
          const x = lx + dx;
          const z = lz + dz;
          if (x < 0 || z < 0 || x >= CHUNK_SIZE || z >= CHUNK_SIZE) continue;
          if (data[this.idx(x, surfaces[z][x] + 2, z)] === BlockId.WOOD) hasTree = true;
        }
      }
      if (!hasTree) {
        this.plantTree(data, lx, surface + 1, lz, {
          tall: hash2(lx, lz, this.seed) > 0.45,
          jungle: biome === "jungle",
          radius: 2 + ((hash2(lx, lz, this.seed + 2) * 2) | 0),
        });
      }
    }
  }

  placeRuins(data, cx, cz) {
    const ox = 4 + ((hash2(cx, cz, this.seed + 1) * 6) | 0);
    const oz = 4 + ((hash2(cx, cz, this.seed + 2) * 6) | 0);
    let surface = 40;
    for (let y = CHUNK_HEIGHT - 2; y > 5; y--) {
      if (data[this.idx(ox, y, oz)] !== BlockId.AIR && data[this.idx(ox, y, oz)] !== BlockId.WATER) {
        surface = y;
        break;
      }
    }
    const base = surface + 1;
    if (base + 4 >= CHUNK_HEIGHT) return;
    for (let dy = 0; dy < 4; dy++) {
      for (let dx = 0; dx < 5; dx++) {
        for (let dz = 0; dz < 5; dz++) {
          const x = ox + dx;
          const z = oz + dz;
          if (x >= CHUNK_SIZE || z >= CHUNK_SIZE) continue;
          const wall = dx === 0 || dx === 4 || dz === 0 || dz === 4;
          const floor = dy === 0;
          const roof = dy === 3;
          if (floor || roof) data[this.idx(x, base + dy, z)] = BlockId.PLANKS;
          else if (wall && !(dx === 2 && dy === 1)) data[this.idx(x, base + dy, z)] = BlockId.COBBLE;
          else data[this.idx(x, base + dy, z)] = BlockId.AIR;
        }
      }
    }
    // chest + loot marker block
    if (ox + 2 < CHUNK_SIZE && oz + 2 < CHUNK_SIZE) {
      data[this.idx(ox + 2, base + 1, oz + 2)] = BlockId.CHEST;
      data[this.idx(ox + 1, base + 1, oz + 1)] = BlockId.TORCH;
    }
  }

  /**
   * Full canopy oak/jungle tree.
   * @param {Uint8Array} data
   * @param {number} lx
   * @param {number} y trunk base
   * @param {number} lz
   * @param {{ tall?: boolean, jungle?: boolean, radius?: number, corrupt?: boolean }} [opts]
   */
  plantTree(data, lx, y, lz, opts = {}) {
    const tall = !!opts.tall || !!opts.jungle;
    const radius = opts.radius ?? (tall ? 3 : 2);
    // taller trunks so canopies read against the sky
    const h = tall
      ? 8 + ((hash2(lx, lz, this.seed + 9) * 5) | 0)
      : 6 + ((hash2(lx, lz, this.seed + 1) * 3) | 0);
    const trunk = opts.corrupt ? BlockId.EBONSTONE : BlockId.WOOD;
    const leaf = opts.corrupt ? BlockId.CORRUPT : BlockId.LEAVES;

    // trunk
    for (let i = 0; i < h; i++) {
      if (y + i >= CHUNK_HEIGHT) break;
      data[this.idx(lx, y + i, lz)] = trunk;
    }

    // thick full canopy (fewer holes — trees must read from a distance)
    const top = y + h - 1;
    const canopyBottom = top - (tall ? 4 : 3);
    for (let yy = canopyBottom; yy <= top + 2; yy++) {
      if (yy < 0 || yy >= CHUNK_HEIGHT) continue;
      const layer = top - yy;
      const rad =
        layer <= -1 ? Math.max(1, radius - 1) : layer === 0 ? radius : layer === 1 ? radius + (tall ? 1 : 0) : Math.max(1, radius - 1);
      for (let dx = -rad; dx <= rad; dx++) {
        for (let dz = -rad; dz <= rad; dz++) {
          if (dx * dx + dz * dz > rad * rad + 0.8) continue;
          if (dx === 0 && dz === 0 && yy < top) continue;
          const x = lx + dx;
          const z = lz + dz;
          if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) continue;
          const i = this.idx(x, yy, z);
          if (data[i] === BlockId.AIR || data[i] === BlockId.LEAVES) {
            if (hash2(x + yy, z + yy, this.seed + 3) > 0.04) data[i] = leaf;
          }
        }
      }
    }
    // peak leaf
    if (top + 1 < CHUNK_HEIGHT) {
      const i = this.idx(lx, top + 1, lz);
      if (data[i] === BlockId.AIR) data[i] = leaf;
    }
    // occasional side branch
    if (hash2(lx, lz, this.seed + 44) > 0.55 && h >= 5) {
      const by = y + 2 + ((hash2(lx, lz, this.seed) * (h - 3)) | 0);
      const dir = hash2(lx + 1, lz, this.seed) > 0.5 ? 1 : -1;
      const bx = lx + dir;
      if (bx >= 0 && bx < CHUNK_SIZE && by < CHUNK_HEIGHT) {
        data[this.idx(bx, by, lz)] = trunk;
        for (const [ox, oz] of [
          [0, 0],
          [dir, 0],
          [0, 1],
          [0, -1],
        ]) {
          const x = bx + ox;
          const z = lz + oz;
          if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) continue;
          if (by + 1 < CHUNK_HEIGHT && data[this.idx(x, by + 1, z)] === BlockId.AIR) {
            data[this.idx(x, by + 1, z)] = leaf;
          }
        }
      }
    }
  }

  /** Tall thin snow pine */
  plantPine(data, lx, y, lz, h) {
    for (let i = 0; i < h; i++) {
      if (y + i >= CHUNK_HEIGHT) break;
      data[this.idx(lx, y + i, lz)] = BlockId.WOOD;
      // conical leaves
      if (i >= 2) {
        const rad = Math.max(1, Math.floor((h - i) / 2));
        for (let dx = -rad; dx <= rad; dx++) {
          for (let dz = -rad; dz <= rad; dz++) {
            if (Math.abs(dx) + Math.abs(dz) > rad) continue;
            if (dx === 0 && dz === 0) continue;
            const x = lx + dx;
            const z = lz + dz;
            if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) continue;
            const idx = this.idx(x, y + i, z);
            if (data[idx] === BlockId.AIR) data[idx] = BlockId.LEAVES;
          }
        }
      }
    }
    if (y + h < CHUNK_HEIGHT) data[this.idx(lx, y + h, lz)] = BlockId.LEAVES;
  }

  plantCactus(data, lx, y, lz, h) {
    for (let i = 0; i < h; i++) {
      if (y + i >= CHUNK_HEIGHT) break;
      // use living wood as cactus stand-in (green-brown); leaves tip
      data[this.idx(lx, y + i, lz)] = BlockId.LIVING_WOOD;
    }
    if (y + h < CHUNK_HEIGHT) data[this.idx(lx, y + h, lz)] = BlockId.LEAVES;
  }

  plantBush(data, lx, y, lz) {
    if (y >= CHUNK_HEIGHT) return;
    data[this.idx(lx, y, lz)] = BlockId.LEAVES;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = lx + dx;
      const z = lz + dz;
      if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) continue;
      if (hash2(x, z, this.seed + 12) > 0.35 && data[this.idx(x, y, z)] === BlockId.AIR) {
        data[this.idx(x, y, z)] = BlockId.LEAVES;
      }
    }
    if (y + 1 < CHUNK_HEIGHT && hash2(lx, lz, this.seed + 13) > 0.4) {
      data[this.idx(lx, y + 1, lz)] = BlockId.LEAVES;
    }
  }

  drapeVines(data, lx, y, lz, len) {
    for (let i = 0; i < len; i++) {
      const yy = y - i;
      if (yy < 1) break;
      // hang beside trunk
      for (const [dx, dz] of [
        [2, 0],
        [-2, 0],
        [0, 2],
        [0, -2],
      ]) {
        const x = lx + dx;
        const z = lz + dz;
        if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) continue;
        const idx = this.idx(x, yy, z);
        if (data[idx] === BlockId.AIR) data[idx] = BlockId.VINE;
      }
    }
  }

  idx(x, y, z) {
    return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
  }

  applyModsToChunk(chunk) {
    const baseX = chunk.cx * CHUNK_SIZE;
    const baseZ = chunk.cz * CHUNK_SIZE;
    for (const [k, id] of this.modifications) {
      const [xs, ys, zs] = k.split(",");
      const x = +xs;
      const y = +ys;
      const z = +zs;
      if (y < 0 || y >= CHUNK_HEIGHT) continue;
      if (x < baseX || x >= baseX + CHUNK_SIZE || z < baseZ || z >= baseZ + CHUNK_SIZE) continue;
      const lx = x - baseX;
      const lz = z - baseZ;
      chunk.data[this.idx(lx, y, lz)] = id;
    }
  }

  getBlock(x, y, z) {
    x = Math.floor(x);
    y = Math.floor(y);
    z = Math.floor(z);
    if (y < 0 || y >= CHUNK_HEIGHT) return BlockId.AIR;
    const cx = this.chunkCoord(x);
    const cz = this.chunkCoord(z);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return BlockId.AIR;
    const lx = x - cx * CHUNK_SIZE;
    const lz = z - cz * CHUNK_SIZE;
    return chunk.data[this.idx(lx, y, lz)];
  }

  setBlock(x, y, z, id) {
    x = Math.floor(x);
    y = Math.floor(y);
    z = Math.floor(z);
    if (y < 0 || y >= CHUNK_HEIGHT) return false;
    const cx = this.chunkCoord(x);
    const cz = this.chunkCoord(z);
    const chunk = this.ensureChunk(cx, cz);
    const lx = x - cx * CHUNK_SIZE;
    const lz = z - cz * CHUNK_SIZE;
    const i = this.idx(lx, y, lz);
    if (chunk.data[i] === id) return false;
    if (chunk.data[i] === BlockId.BEDROCK && id === BlockId.AIR) return false;
    chunk.data[i] = id;
    this.modifications.set(this.modKey(x, y, z), id);
    this.markDirty(cx, cz);
    if (lx === 0) this.markDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.markDirty(cx + 1, cz);
    if (lz === 0) this.markDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.markDirty(cx, cz + 1);
    return true;
  }

  /** @returns {number[][]} */
  exportModifications() {
    const out = [];
    for (const [k, id] of this.modifications) {
      const [x, y, z] = k.split(",").map(Number);
      out.push([x, y, z, id]);
    }
    return out;
  }

  /** @param {number[][]} list */
  importModifications(list) {
    this.modifications.clear();
    if (!Array.isArray(list)) return;
    for (const row of list) {
      if (!Array.isArray(row) || row.length < 4) continue;
      const [x, y, z, id] = row;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
      this.modifications.set(this.modKey(x | 0, y | 0, z | 0), id | 0);
    }
    // re-apply to loaded chunks
    for (const chunk of this.chunks.values()) {
      // regenerate base then apply — expensive; instead just apply mods over current
      this.applyModsToChunk(chunk);
      this.dirty.add(this.key(chunk.cx, chunk.cz));
    }
  }

  markDirty(cx, cz) {
    const k = this.key(cx, cz);
    if (this.chunks.has(k)) this.dirty.add(k);
  }

  isSolidAt(x, y, z) {
    const id = this.getBlock(x, y, z);
    if (id === BlockId.DOOR) {
      // open doors are walk-through
      return !this.isDoorOpenAt(x, y, z);
    }
    // platforms: solid only as thin floor — full solid for now (step-up friendly)
    return isSolid(id);
  }

  /** Resolve bottom cell of a door stack (doors are 2 tall). */
  doorBottomKey(x, y, z) {
    x = Math.floor(x);
    y = Math.floor(y);
    z = Math.floor(z);
    if (this.getBlock(x, y, z) !== BlockId.DOOR) return null;
    if (this.getBlock(x, y - 1, z) === BlockId.DOOR) {
      return this.modKey(x, y - 1, z);
    }
    return this.modKey(x, y, z);
  }

  isDoorOpenAt(x, y, z) {
    const k = this.doorBottomKey(x, y, z);
    return k ? this.doorOpen.has(k) : false;
  }

  getDoorFacing(x, y, z) {
    const k = this.doorBottomKey(x, y, z);
    if (!k) return 0;
    return this.doorFacing.get(k) ?? 0;
  }

  /**
   * Toggle door open/closed. Returns true if toggled.
   */
  toggleDoor(x, y, z) {
    const k = this.doorBottomKey(x, y, z);
    if (!k) return false;
    if (this.doorOpen.has(k)) this.doorOpen.delete(k);
    else this.doorOpen.add(k);
    const [bx, by, bz] = k.split(",").map(Number);
    // remesh both door cells + neighbors
    this.markDirty(this.chunkCoord(bx), this.chunkCoord(bz));
    this.markDirty(this.chunkCoord(bx - 1), this.chunkCoord(bz));
    this.markDirty(this.chunkCoord(bx + 1), this.chunkCoord(bz));
    this.markDirty(this.chunkCoord(bx), this.chunkCoord(bz - 1));
    this.markDirty(this.chunkCoord(bx), this.chunkCoord(bz + 1));
    void by;
    return true;
  }

  /**
   * Place a 2-tall door. Returns false if no space.
   * @param {number} facing 0=+z facing (panel faces player approach)
   */
  placeDoor(x, y, z, facing = 0) {
    x = Math.floor(x);
    y = Math.floor(y);
    z = Math.floor(z);
    const belowOk = this.getBlock(x, y, z) === BlockId.AIR || this.getBlock(x, y, z) === BlockId.WATER;
    const aboveOk =
      this.getBlock(x, y + 1, z) === BlockId.AIR || this.getBlock(x, y + 1, z) === BlockId.WATER;
    if (!belowOk || !aboveOk) return false;
    this.setBlock(x, y, z, BlockId.DOOR);
    this.setBlock(x, y + 1, z, BlockId.DOOR);
    const k = this.modKey(x, y, z);
    this.doorOpen.delete(k);
    this.doorFacing.set(k, facing & 3);
    return true;
  }

  /** Break door stack (both halves), clean open/facing state. Returns drop count. */
  breakDoor(x, y, z) {
    const k = this.doorBottomKey(x, y, z);
    if (!k) {
      if (this.getBlock(x, y, z) === BlockId.DOOR) {
        this.setBlock(x, y, z, BlockId.AIR);
        return 1;
      }
      return 0;
    }
    const [bx, by, bz] = k.split(",").map(Number);
    this.setBlock(bx, by, bz, BlockId.AIR);
    if (this.getBlock(bx, by + 1, bz) === BlockId.DOOR) this.setBlock(bx, by + 1, bz, BlockId.AIR);
    this.doorOpen.delete(k);
    this.doorFacing.delete(k);
    return 1;
  }

  exportDoorState() {
    return {
      open: [...this.doorOpen],
      facing: [...this.doorFacing.entries()],
    };
  }

  importDoorState(data) {
    this.doorOpen.clear();
    this.doorFacing.clear();
    if (!data) return;
    if (Array.isArray(data.open)) {
      for (const k of data.open) if (typeof k === "string") this.doorOpen.add(k);
    }
    if (Array.isArray(data.facing)) {
      for (const row of data.facing) {
        if (Array.isArray(row) && typeof row[0] === "string") {
          this.doorFacing.set(row[0], (row[1] | 0) & 3);
        }
      }
    }
  }

  updateChunksAround(px, pz) {
    const pcx = this.chunkCoord(px);
    const pcz = this.chunkCoord(pz);
    const needed = new Set();
    const rd = this.renderDistance;

    for (let dz = -rd; dz <= rd; dz++) {
      for (let dx = -rd; dx <= rd; dx++) {
        if (dx * dx + dz * dz > rd * rd + 1) continue;
        const cx = pcx + dx;
        const cz = pcz + dz;
        const k = this.key(cx, cz);
        needed.add(k);
        this.ensureChunk(cx, cz);
      }
    }

    for (const k of [...this.chunks.keys()]) {
      if (!needed.has(k)) {
        this.chunks.delete(k);
        this.dirty.delete(k);
        const mesh = this.meshes.get(k);
        if (mesh) {
          this.group.remove(mesh);
          mesh.geometry.dispose();
          // shared material — do not dispose
          this.meshes.delete(k);
        }
      }
    }
  }

  rebuildDirty(maxPerFrame = 3) {
    let n = 0;
    for (const k of [...this.dirty]) {
      if (n >= maxPerFrame) break;
      const chunk = this.chunks.get(k);
      if (!chunk) {
        this.dirty.delete(k);
        continue;
      }
      this.rebuildMesh(chunk);
      this.dirty.delete(k);
      n++;
    }
    return n;
  }

  rebuildMesh(chunk) {
    const k = this.key(chunk.cx, chunk.cz);
    const old = this.meshes.get(k);
    if (old) {
      this.group.remove(old);
      old.geometry.dispose();
    }

    const getBlock = (x, y, z) => {
      if (y < 0 || y >= CHUNK_HEIGHT) return BlockId.AIR;
      if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
        return chunk.data[this.idx(x, y, z)];
      }
      const wx = chunk.cx * CHUNK_SIZE + x;
      const wz = chunk.cz * CHUNK_SIZE + z;
      return this.getBlock(wx, y, wz);
    };

    const toWorld = (x, y, z) => ({
      x: chunk.cx * CHUNK_SIZE + x,
      y,
      z: chunk.cz * CHUNK_SIZE + z,
    });

    const geometry = meshChunk(chunk, getBlock, {
      isDoorOpen: (x, y, z) => {
        const w = toWorld(x, y, z);
        return this.isDoorOpenAt(w.x, w.y, w.z);
      },
      getDoorFacing: (x, y, z) => {
        const w = toWorld(x, y, z);
        return this.getDoorFacing(w.x, w.y, w.z);
      },
    });
    if (!geometry) {
      this.meshes.delete(k);
      return;
    }

    const mesh = new THREE.Mesh(geometry, this.sharedMaterial);
    mesh.position.set(chunk.cx * CHUNK_SIZE, 0, chunk.cz * CHUNK_SIZE);
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.meshes.set(k, mesh);
  }

  raycast(origin, direction, maxDist = 6.5) {
    const ox = origin.x;
    const oy = origin.y;
    const oz = origin.z;
    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;

    let x = Math.floor(ox);
    let y = Math.floor(oy);
    let z = Math.floor(oz);

    const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;

    const tDeltaX = stepX !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dy) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dz) : Infinity;

    let tMaxX =
      stepX > 0 ? (Math.floor(ox) + 1 - ox) * tDeltaX : stepX < 0 ? (ox - Math.floor(ox)) * tDeltaX : Infinity;
    let tMaxY =
      stepY > 0 ? (Math.floor(oy) + 1 - oy) * tDeltaY : stepY < 0 ? (oy - Math.floor(oy)) * tDeltaY : Infinity;
    let tMaxZ =
      stepZ > 0 ? (Math.floor(oz) + 1 - oz) * tDeltaZ : stepZ < 0 ? (oz - Math.floor(oz)) * tDeltaZ : Infinity;

    let face = null;
    let dist = 0;

    for (let i = 0; i < maxDist * 3; i++) {
      const id = this.getBlock(x, y, z);
      if (isSolid(id) || (id && BLOCKS[id] && !BLOCKS[id].fluid && id !== BlockId.AIR)) {
        if (id !== BlockId.AIR && id !== BlockId.WATER) {
          return { x, y, z, id, face, dist };
        }
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          dist = tMaxX;
          if (dist > maxDist) break;
          x += stepX;
          tMaxX += tDeltaX;
          face = stepX > 0 ? [-1, 0, 0] : [1, 0, 0];
        } else {
          dist = tMaxZ;
          if (dist > maxDist) break;
          z += stepZ;
          tMaxZ += tDeltaZ;
          face = stepZ > 0 ? [0, 0, -1] : [0, 0, 1];
        }
      } else if (tMaxY < tMaxZ) {
        dist = tMaxY;
        if (dist > maxDist) break;
        y += stepY;
        tMaxY += tDeltaY;
        face = stepY > 0 ? [0, -1, 0] : [0, 1, 0];
      } else {
        dist = tMaxZ;
        if (dist > maxDist) break;
        z += stepZ;
        tMaxZ += tDeltaZ;
        face = stepZ > 0 ? [0, 0, -1] : [0, 0, 1];
      }
    }
    return null;
  }

  findSpawn() {
    for (let r = 0; r < 40; r++) {
      const x = ((hash2(r, this.seed, 1) - 0.5) * r * 2) | 0;
      const z = ((hash2(r, this.seed, 2) - 0.5) * r * 2) | 0;
      this.updateChunksAround(x, z);
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          this.ensureChunk(this.chunkCoord(x) + dx, this.chunkCoord(z) + dz);
        }
      }
      for (let y = CHUNK_HEIGHT - 2; y > 10; y--) {
        if (this.isSolidAt(x, y, z) && !this.isSolidAt(x, y + 1, z) && !this.isSolidAt(x, y + 2, z)) {
          const id = this.getBlock(x, y, z);
          if (id === BlockId.WATER || id === BlockId.LEAVES) continue;
          return { x: x + 0.5, y: y + 1.01, z: z + 0.5 };
        }
      }
    }
    return { x: 0.5, y: WORLD_SEA_LEVEL + 5, z: 0.5 };
  }

  surfaceY(x, z) {
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      if (this.isSolidAt(x, y, z)) return y;
    }
    return WORLD_SEA_LEVEL;
  }

  /**
   * Build a real starter cabin at spawn: walls, roof, door, light, table, chair,
   * workbench, furnace, chest — so housing + crafting works immediately.
   * @param {number} sx
   * @param {number} sy floor y (player feet)
   * @param {number} sz
   */
  buildStarterCamp(sx, sy, sz) {
    const ox = Math.floor(sx) - 3;
    const oy = Math.floor(sy);
    const oz = Math.floor(sz) - 3;
    // clear + floor platform 7x7
    for (let dx = 0; dx < 7; dx++) {
      for (let dz = 0; dz < 7; dz++) {
        const x = ox + dx;
        const z = oz + dz;
        // floor
        this.setBlock(x, oy - 1, z, BlockId.PLANKS);
        // clear interior air
        for (let dy = 0; dy < 5; dy++) {
          this.setBlock(x, oy + dy, z, BlockId.AIR);
        }
      }
    }
    // walls + roof
    for (let dx = 0; dx < 7; dx++) {
      for (let dz = 0; dz < 7; dz++) {
        const x = ox + dx;
        const z = oz + dz;
        const edge = dx === 0 || dx === 6 || dz === 0 || dz === 6;
        for (let dy = 0; dy < 4; dy++) {
          if (edge) {
            // door hole front center
            if (dz === 0 && dx === 3 && (dy === 0 || dy === 1)) continue;
            this.setBlock(x, oy + dy, z, BlockId.PLANKS);
          }
        }
        // roof
        this.setBlock(x, oy + 4, z, BlockId.WOOD);
      }
    }
    // door + furniture + stations (2-tall functional door, closed by default)
    this.placeDoor(ox + 3, oy, oz, 0);
    this.setBlock(ox + 1, oy, oz + 2, BlockId.WORKBENCH);
    this.setBlock(ox + 2, oy, oz + 2, BlockId.FURNACE);
    this.setBlock(ox + 3, oy, oz + 2, BlockId.ANVIL);
    this.setBlock(ox + 5, oy, oz + 2, BlockId.TABLE);
    this.setBlock(ox + 5, oy, oz + 3, BlockId.CHAIR);
    this.setBlock(ox + 1, oy + 2, oz + 1, BlockId.TORCH);
    this.setBlock(ox + 5, oy + 2, oz + 1, BlockId.TORCH);
    this.setBlock(ox + 1, oy, oz + 5, BlockId.CHEST);
    this.setBlock(ox + 5, oy, oz + 5, BlockId.BED);
    // mark chest for starter loot (world flag)
    this.starterChest = { x: ox + 1, y: oy, z: oz + 5 };
    // small porch path
    for (let i = 1; i <= 3; i++) {
      this.setBlock(ox + 3, oy - 1, oz - i, BlockId.COBBLE);
    }
    // fishing pond next to cabin
    const px = ox + 9;
    const pz = oz + 2;
    for (let dx = 0; dx < 5; dx++) {
      for (let dz = 0; dz < 5; dz++) {
        const x = px + dx;
        const z = pz + dz;
        this.setBlock(x, oy - 2, z, BlockId.DIRT);
        this.setBlock(x, oy - 1, z, BlockId.WATER);
        this.setBlock(x, oy, z, BlockId.AIR);
        this.setBlock(x, oy + 1, z, BlockId.AIR);
      }
    }
    // shore
    for (let i = 0; i < 5; i++) {
      this.setBlock(px - 1, oy - 1, pz + i, BlockId.SAND);
      this.setBlock(px + 5, oy - 1, pz + i, BlockId.SAND);
    }

    // visible forest ring so New World always shows trees from the cabin door
    this.plantForestRing(ox + 3, oy, oz + 3, 10, 22);
  }

  /**
   * Plant a ring of full trees around a point (world coords).
   * @param {number} cx
   * @param {number} cy floor y
   * @param {number} cz
   * @param {number} innerR clear radius (cabin)
   * @param {number} outerR forest radius
   */
  plantForestRing(cx, cy, cz, innerR, outerR) {
    let planted = 0;
    // random scatter in annulus — not a polar grid
    for (let attempt = 0; attempt < 80 && planted < 22; attempt++) {
      const ang = hash2(cx + attempt, cz + planted, this.seed + 9) * Math.PI * 2;
      const dist =
        innerR +
        1.5 +
        hash2(cz + attempt, cx + planted, this.seed + 11) * (outerR - innerR - 1.5);
      const jx = (hash2(attempt, planted, this.seed) - 0.5) * 3;
      const jz = (hash2(planted, attempt, this.seed + 3) - 0.5) * 3;
      const x = Math.floor(cx + Math.cos(ang) * dist + jx);
      const z = Math.floor(cz + Math.sin(ang) * dist + jz);
      const dx = x - cx;
      const dz = z - cz;
      if (dx * dx + dz * dz < innerR * innerR) continue;
      const sy = this.surfaceY(x, z);
      if (sy < 5 || sy >= CHUNK_HEIGHT - 14) continue;
      const ground = this.getBlock(x, sy, z);
      if (ground === BlockId.WATER || ground === BlockId.AIR) continue;
      if (this.getBlock(x, sy + 1, z) !== BlockId.AIR) continue;
      // spacing: skip if another trunk is close
      let near = false;
      for (let oz = -3; oz <= 3 && !near; oz++) {
        for (let ox = -3; ox <= 3 && !near; ox++) {
          if (this.getBlock(x + ox, sy + 2, z + oz) === BlockId.WOOD) near = true;
        }
      }
      if (near) continue;
      this.plantTreeWorld(x, sy + 1, z, {
        tall: hash2(x, z, this.seed) > 0.4,
        radius: 2 + ((hash2(z, x, this.seed + 5) * 2) | 0),
      });
      planted++;
    }
  }

  /**
   * Plant a tree using world setBlock (cross-chunk safe).
   */
  plantTreeWorld(x, y, z, opts = {}) {
    const tall = !!opts.tall;
    const radius = opts.radius ?? 2;
    const h = tall ? 7 + ((hash2(x, z, this.seed) * 4) | 0) : 5 + ((hash2(x, z, this.seed + 1) * 3) | 0);
    for (let i = 0; i < h; i++) {
      this.setBlock(x, y + i, z, BlockId.WOOD);
    }
    const top = y + h - 1;
    const canopyBottom = top - (tall ? 3 : 2);
    for (let yy = canopyBottom; yy <= top + 2; yy++) {
      const layer = top - yy;
      const rad = layer <= -1 ? 1 : layer === 0 ? radius - 1 : layer === 1 ? radius : Math.max(1, radius - 1);
      for (let dx = -rad; dx <= rad; dx++) {
        for (let dz = -rad; dz <= rad; dz++) {
          if (dx * dx + dz * dz > rad * rad + 0.8) continue;
          if (dx === 0 && dz === 0 && yy < top) continue;
          const wx = x + dx;
          const wz = z + dz;
          if (this.getBlock(wx, yy, wz) === BlockId.AIR) {
            this.setBlock(wx, yy, wz, BlockId.LEAVES);
          }
        }
      }
    }
    if (this.getBlock(x, top + 1, z) === BlockId.AIR) this.setBlock(x, top + 1, z, BlockId.LEAVES);
  }

  /**
   * Underground cabin with chest (called from chunk gen occasionally).
   * @param {Uint8Array} data
   * @param {number} lx
   * @param {number} y floor
   * @param {number} lz
   */
  placeCaveCabin(data, lx, y, lz) {
    if (lx < 2 || lz < 2 || lx > CHUNK_SIZE - 6 || lz > CHUNK_SIZE - 6) return;
    if (y < 8 || y > 50) return;
    for (let dx = 0; dx < 5; dx++) {
      for (let dz = 0; dz < 5; dz++) {
        for (let dy = 0; dy < 4; dy++) {
          const x = lx + dx;
          const yy = y + dy;
          const z = lz + dz;
          if (yy >= CHUNK_HEIGHT) continue;
          const edge = dx === 0 || dx === 4 || dz === 0 || dz === 4 || dy === 0 || dy === 3;
          const i = this.idx(x, yy, z);
          if (edge) data[i] = BlockId.COBBLE;
          else data[i] = BlockId.AIR;
        }
      }
    }
    // torch + chest
    data[this.idx(lx + 2, y + 2, lz + 2)] = BlockId.TORCH;
    data[this.idx(lx + 2, y + 1, lz + 2)] = BlockId.CHEST;
  }

  dispose() {
    for (const mesh of this.meshes.values()) {
      this.group.remove(mesh);
      mesh.geometry.dispose();
    }
    this.meshes.clear();
    this.chunks.clear();
    this.sharedMaterial.dispose();
    this.atlas?.texture?.dispose?.();
    this.scene.remove(this.group);
  }
}
