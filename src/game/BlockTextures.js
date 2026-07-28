/**
 * Block texture atlas for voxel faces.
 * Product ships procedural tiles only.
 * Optional DEV-only overlay from gitignored local/textures/blocks/ (never in dist).
 */
import * as THREE from "three";
import { BlockId, BLOCKS } from "./blocks.js";

export const TILE_SIZE = 32;
/** tiles per row in atlas */
export const ATLAS_COLS = 16;

/**
 * Face role for multi-texture blocks
 * 0 = side, 1 = top, 2 = bottom
 */
export function faceRole(faceIndex) {
  if (faceIndex === 2) return 1; // +y top
  if (faceIndex === 3) return 2; // -y bottom
  return 0; // sides
}

/** Stable tile index for (blockId, role) */
export function tileIndex(blockId, role = 0) {
  return blockId * 3 + (role % 3);
}

/**
 * UV corners for a tile in atlas (0-1).
 * @returns {number[][]}
 */
export function tileUVs(blockId, role, atlasCols = ATLAS_COLS) {
  const idx = tileIndex(blockId, role);
  const col = idx % atlasCols;
  const row = Math.floor(idx / atlasCols);
  const u0 = col / atlasCols;
  const v0 = 1 - (row + 1) / atlasCols;
  const u1 = (col + 1) / atlasCols;
  const v1 = 1 - row / atlasCols;
  const pad = 0.5 / (atlasCols * TILE_SIZE);
  const uu0 = u0 + pad;
  const uu1 = u1 - pad;
  const vv0 = v0 + pad;
  const vv1 = v1 - pad;
  return [
    [uu0, vv0],
    [uu0, vv1],
    [uu1, vv1],
    [uu1, vv0],
  ];
}

/**
 * Per-face UV order.
 */
export function faceUVs(blockId, faceIndex) {
  const role = faceRole(faceIndex);
  const base = tileUVs(blockId, role);
  const orders = [
    [0, 1, 2, 3],
    [3, 2, 1, 0],
    [0, 3, 2, 1],
    [1, 2, 3, 0],
    [0, 1, 2, 3],
    [3, 2, 1, 0],
  ];
  const ord = orders[faceIndex] || [0, 1, 2, 3];
  return ord.map((i) => base[i]);
}

function clamp(v, a = 0, b = 255) {
  return Math.max(a, Math.min(b, v | 0));
}

function hash(x, y, s) {
  let n = x * 374761393 + y * 668265263 + s * 1274126177;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967296;
}

function put(img, ox, oy, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= TILE_SIZE || y >= TILE_SIZE) return;
  const i = ((oy + y) * (ATLAS_COLS * TILE_SIZE) + (ox + x)) * 4;
  img.data[i] = r;
  img.data[i + 1] = g;
  img.data[i + 2] = b;
  img.data[i + 3] = a;
}

/**
 * Paint one TILE_SIZE² tile.
 */
function paintTile(img, ox, oy, blockId, role, def) {
  const base = role === 1 && def.topColor ? def.topColor : role === 2 && def.bottomColor ? def.bottomColor : def.color;
  const [br, bg, bb] = base || [128, 128, 128];
  const name = (def.name || "").toLowerCase();
  const style = pickStyle(blockId, name, role);

  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = hash(x + blockId * 17, y + role * 31, blockId + role * 3);
      const n2 = hash(x * 3 + 1, y * 5 + 2, blockId * 9 + role);
      const n3 = hash(x + y * 2, y - x, blockId + 99);
      let r = br;
      let g = bg;
      let b = bb;
      let a = 255;

      // subtle base dither (higher contrast than before)
      const shade = 0.78 + n * 0.36;
      r = clamp(r * shade);
      g = clamp(g * shade);
      b = clamp(b * shade);

      if (style === "grass_top") {
        // rich green carpet with blade streaks
        r = clamp(0x3d + n * 40);
        g = clamp(0xa8 + n2 * 50);
        b = clamp(0x2e + n * 25);
        if (n2 > 0.55) {
          g = clamp(g + 35);
          r = clamp(r - 10);
        }
        // blade lines
        if ((x + (y % 3)) % 4 === 0 && n > 0.35) {
          g = clamp(g + 40);
          r = clamp(r * 0.85);
        }
        // dirt flecks
        if (n3 > 0.94) {
          r = clamp(0x6b + n * 20);
          g = clamp(0x4a + n * 15);
          b = clamp(0x28);
        }
      } else if (style === "grass_side") {
        // grass fringe top 8px, dirt body
        if (y < 8) {
          const t = 1 - y / 8;
          const gr = 0x4a + n * 30;
          const gg = 0xb0 + n2 * 40;
          const gb = 0x32;
          r = clamp(0x8b * (1 - t) + gr * t);
          g = clamp(0x5a * (1 - t) + gg * t);
          b = clamp(0x2b * (1 - t) + gb * t);
          if (n > 0.65 && y < 5) g = clamp(g + 40);
        } else {
          r = clamp(0x8b * (0.82 + n * 0.28));
          g = clamp(0x5a * (0.82 + n2 * 0.25));
          b = clamp(0x2b * (0.82 + n * 0.22));
          if (n > 0.9) {
            r *= 0.7;
            g *= 0.7;
            b *= 0.65;
          }
        }
      } else if (style === "dirt") {
        r = clamp(0x7a * (0.85 + n * 0.3));
        g = clamp(0x4e * (0.85 + n2 * 0.28));
        b = clamp(0x2a * (0.85 + n * 0.22));
        if (n > 0.88) {
          r = clamp(r * 0.65);
          g = clamp(g * 0.65);
          b = clamp(b * 0.6);
        }
        if (n2 > 0.93) {
          r = clamp(r + 28);
          g = clamp(g + 18);
        }
      } else if (style === "stone") {
        r = clamp(0x7a * (0.88 + n * 0.22));
        g = clamp(0x7f * (0.88 + n * 0.22));
        b = clamp(0x88 * (0.88 + n * 0.2));
        // cracks
        const crack = Math.abs(Math.sin(x * 0.55 + y * 0.2) * Math.cos(y * 0.45 + x * 0.1));
        if (crack > 0.82 || n > 0.91) {
          r = clamp(r * 0.55);
          g = clamp(g * 0.55);
          b = clamp(b * 0.58);
        }
        if (n2 < 0.07) {
          r = clamp(r + 40);
          g = clamp(g + 40);
          b = clamp(b + 45);
        }
      } else if (style === "ore") {
        // stone host
        r = clamp(0x72 * (0.88 + n * 0.2));
        g = clamp(0x76 * (0.88 + n * 0.2));
        b = clamp(0x7e * (0.88 + n * 0.2));
        // ore blobs
        if (n2 > 0.72) {
          r = br;
          g = bg;
          b = bb;
          if (n > 0.45) {
            r = clamp(br * 1.35);
            g = clamp(bg * 1.35);
            b = clamp(bb * 1.35);
          }
          // bright core
          if (n3 > 0.7) {
            r = clamp(r + 50);
            g = clamp(g + 50);
            b = clamp(b + 40);
          }
        }
      } else if (style === "wood_side") {
        // bark: vertical stripes + dark grooves
        const band = Math.sin(x * 0.7 + n * 1.5) * 0.5 + 0.5;
        r = clamp(0x6b * (0.7 + band * 0.45));
        g = clamp(0x42 * (0.7 + band * 0.4));
        b = clamp(0x26 * (0.7 + band * 0.35));
        if (x % 5 === 0 || x % 7 === 1) {
          r = clamp(r * 0.55);
          g = clamp(g * 0.55);
          b = clamp(b * 0.5);
        }
        // knots
        if (n > 0.96) {
          r = clamp(r * 0.4);
          g = clamp(g * 0.4);
          b = clamp(b * 0.35);
        }
      } else if (style === "wood_end") {
        // growth rings
        const cx = x - 15.5;
        const cy = y - 15.5;
        const d = Math.sqrt(cx * cx + cy * cy);
        const ring = Math.sin(d * 1.1) * 0.5 + 0.5;
        r = clamp(0x9a * (0.75 + ring * 0.4));
        g = clamp(0x6e * (0.75 + ring * 0.35));
        b = clamp(0x3a * (0.75 + ring * 0.3));
        if (d < 3) {
          r = clamp(r * 0.7);
          g = clamp(g * 0.7);
        }
      } else if (style === "leaves") {
        // dense foliage — mostly opaque, high green pop
        const leaf = n > 0.18;
        if (!leaf) {
          a = 0;
        } else {
          r = clamp(0x2f + n * 35);
          g = clamp(0x8f + n2 * 55);
          b = clamp(0x2a + n * 20);
          // highlight / shadow clusters
          if (n2 > 0.7) g = clamp(g + 45);
          if (n < 0.35) {
            r = clamp(r * 0.7);
            g = clamp(g * 0.75);
            b = clamp(b * 0.7);
          }
          // occasional yellow-green
          if (n3 > 0.92) {
            r = clamp(r + 40);
            g = clamp(g + 20);
          }
        }
      } else if (style === "sand") {
        r = clamp(0xd8 * (0.9 + n * 0.15));
        g = clamp(0xc0 * (0.9 + n * 0.14));
        b = clamp(0x6a * (0.9 + n2 * 0.12));
        if (n > 0.88) {
          r = clamp(r + 20);
          g = clamp(g + 15);
        }
        if ((x + y) % 6 === 0 && n2 > 0.4) {
          r = clamp(r * 0.9);
          g = clamp(g * 0.9);
        }
      } else if (style === "snow") {
        r = g = b = clamp(0xe8 + n * 20);
        if (n > 0.9) {
          r = 0xc8;
          g = 0xd0;
          b = 0xe0;
        }
      } else if (style === "planks") {
        // horizontal boards with grain
        const row = Math.floor(y / 5);
        if (y % 5 === 0) {
          r = 70;
          g = 48;
          b = 28;
        } else {
          const j = hash(x, row, blockId);
          r = clamp(0xc4 * (0.82 + j * 0.28));
          g = clamp(0xa3 * (0.82 + j * 0.25));
          b = clamp(0x5a * (0.82 + j * 0.2));
          if (n > 0.85) g = clamp(g + 15);
        }
      } else if (style === "brick") {
        const brow = Math.floor(y / 6);
        const off = brow % 2 === 0 ? 0 : 8;
        if (y % 6 === 0 || (x + off) % 10 === 0) {
          r = 85;
          g = 82;
          b = 88;
        } else {
          const j = hash(Math.floor((x + off) / 10), brow, blockId);
          r = clamp(br * (0.78 + j * 0.35));
          g = clamp(bg * (0.78 + j * 0.3));
          b = clamp(bb * (0.78 + j * 0.25));
        }
      } else if (style === "glass") {
        a = 120;
        r = clamp(180 + n * 40);
        g = clamp(210 + n * 30);
        b = clamp(230 + n * 25);
        if (x === 0 || y === 0 || x === TILE_SIZE - 1 || y === TILE_SIZE - 1) a = 200;
        if ((x + y) % 11 === 0) a = 160;
      } else if (style === "torch") {
        // full tile used on cross-planes: stick bottom, bright flame top
        a = 0;
        const cx = x - 15.5;
        // wooden stick (center column)
        if (Math.abs(cx) <= 3 && y >= 0 && y <= 18) {
          a = 255;
          r = clamp(0x6a + n * 20);
          g = clamp(0x3e + n * 12);
          b = clamp(0x1e);
          if (Math.abs(cx) >= 2) {
            r = clamp(r * 0.75);
            g = clamp(g * 0.75);
          }
        }
        // flame bulb
        const fy = y - 24;
        if (y >= 16 && y <= 31 && cx * cx * 0.9 + fy * fy * 0.55 < 70) {
          a = 255;
          const core = cx * cx + fy * fy * 0.5 < 18;
          r = 255;
          g = clamp(core ? 220 : 120 + n * 90);
          b = clamp(core ? 80 : 20 + n * 30);
        }
      } else if (style === "door") {
        // door face: frame + panels + handle + window
        const frame = x < 3 || x > 28 || y < 2 || y > 29;
        const mid = y >= 14 && y <= 16;
        const win = x >= 8 && x <= 23 && y >= 18 && y <= 26;
        if (frame || mid) {
          r = clamp(0x4a + n * 15);
          g = clamp(0x2e + n * 10);
          b = clamp(0x14);
        } else if (win) {
          a = 200;
          r = clamp(0x7a + n * 40);
          g = clamp(0xb0 + n * 30);
          b = clamp(0xd0 + n * 25);
          // mullion
          if (x >= 14 && x <= 17) {
            a = 255;
            r = 0x5a;
            g = 0x38;
            b = 0x18;
          }
        } else {
          // wood panels
          r = clamp(0x8b * (0.85 + n * 0.25));
          g = clamp(0x5a * (0.85 + n * 0.22));
          b = clamp(0x2b * (0.85 + n * 0.18));
          if ((x > 5 && x < 14) || (x > 17 && x < 26)) {
            if (n2 > 0.7) g = clamp(g + 12);
          }
        }
        // handle
        if (x >= 24 && x <= 27 && y >= 12 && y <= 15) {
          r = 0xc0;
          g = 0xa0;
          b = 0x40;
        }
      } else if (style === "water") {
        a = 175;
        r = clamp(30 + n * 35);
        g = clamp(90 + n2 * 50);
        b = clamp(190 + n * 55);
        // wave lines
        if (Math.sin(x * 0.5 + y * 0.3) > 0.7) {
          r = clamp(r + 40);
          g = clamp(g + 50);
          b = clamp(b + 30);
        }
      } else if (style === "crystal") {
        r = clamp(br * (0.85 + n * 0.4));
        g = clamp(bg * (0.85 + n * 0.4));
        b = clamp(bb * (0.85 + n * 0.4));
        if (n > 0.75) {
          r = clamp(r + 60);
          g = clamp(g + 60);
          b = clamp(b + 80);
        }
        if (n2 > 0.94) r = g = b = 255;
      } else if (style === "hell") {
        r = clamp(0x4a * (0.8 + n * 0.4));
        g = clamp(0x3a * (0.8 + n * 0.3));
        b = clamp(0x32 * (0.8 + n * 0.25));
        if (n > 0.86) {
          r = 255;
          g = clamp(70 + n2 * 90);
          b = 15;
        }
      } else if (style === "cloud") {
        a = n > 0.2 ? 240 : 0;
        r = g = b = clamp(245 + n * 10);
      } else if (style === "mushroom") {
        a = 0;
        // stem
        if (x >= 13 && x <= 18 && y >= 0 && y <= 14) {
          a = 255;
          r = 220;
          g = 210;
          b = 190;
        }
        // cap
        const cx = x - 15.5;
        const cy = y - 20;
        if (cx * cx + cy * cy < 90 && y >= 12) {
          a = 255;
          r = clamp(0xd0 + n * 30);
          g = clamp(0x50 + n * 20);
          b = clamp(0x40);
          if (n2 > 0.85) {
            r = g = b = 240;
          }
        }
      } else {
        if (n > 0.9) {
          r = clamp(r * 0.65);
          g = clamp(g * 0.65);
          b = clamp(b * 0.65);
        }
        if (n2 < 0.06) {
          r = clamp(r + 30);
          g = clamp(g + 30);
          b = clamp(b + 30);
        }
      }

      put(img, ox, oy, x, y, r, g, b, a);
    }
  }

  // soft bevel outline for solid tiles
  if (style !== "leaves" && style !== "torch" && style !== "mushroom" && style !== "cloud" && style !== "glass" && style !== "water") {
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        if (x === 0 || y === 0) {
          const i = ((oy + y) * (ATLAS_COLS * TILE_SIZE) + (ox + x)) * 4;
          img.data[i] = clamp(img.data[i] * 1.12);
          img.data[i + 1] = clamp(img.data[i + 1] * 1.12);
          img.data[i + 2] = clamp(img.data[i + 2] * 1.12);
        }
        if (x === TILE_SIZE - 1 || y === TILE_SIZE - 1) {
          const i = ((oy + y) * (ATLAS_COLS * TILE_SIZE) + (ox + x)) * 4;
          img.data[i] = clamp(img.data[i] * 0.72);
          img.data[i + 1] = clamp(img.data[i + 1] * 0.72);
          img.data[i + 2] = clamp(img.data[i + 2] * 0.72);
        }
      }
    }
  }
}

function pickStyle(blockId, name, role) {
  if (blockId === BlockId.GRASS || blockId === BlockId.JUNGLE_GRASS) {
    return role === 1 ? "grass_top" : role === 2 ? "dirt" : "grass_side";
  }
  if (blockId === BlockId.DIRT || name.includes("dirt")) return "dirt";
  if (blockId === BlockId.STONE || name.includes("cobble") || name.includes("dungeon")) return "stone";
  if (
    name.includes("ore") ||
    name.includes("demonite") ||
    name.includes("mythril") ||
    name.includes("adamant") ||
    name.includes("chloro") ||
    name.includes("hellstone") ||
    name.includes("crystal ore")
  )
    return "ore";
  if (blockId === BlockId.WOOD || name.includes("living wood")) return role === 1 || role === 2 ? "wood_end" : "wood_side";
  if (blockId === BlockId.LEAVES || name.includes("leaf") || name.includes("vine")) return "leaves";
  if (blockId === BlockId.SAND || name.includes("sand")) return "sand";
  if (blockId === BlockId.SNOW || name.includes("snow") || name.includes("ice")) return "snow";
  if (
    blockId === BlockId.PLANKS ||
    name.includes("plank") ||
    name.includes("work") ||
    name.includes("table") ||
    name.includes("chair") ||
    name.includes("door") ||
    name.includes("platform") ||
    name.includes("bench") ||
    name.includes("bed") ||
    name.includes("chest") ||
    name.includes("anvil") ||
    name.includes("furnace")
  )
    return "planks";
  if (blockId === BlockId.BRICK || name.includes("brick")) return "brick";
  if (blockId === BlockId.GLASS) return "glass";
  if (blockId === BlockId.TORCH) return "torch";
  if (blockId === BlockId.DOOR) return "door";
  if (blockId === BlockId.WATER) return "water";
  if (blockId === BlockId.MUSHROOM) return "mushroom";
  if (blockId === BlockId.CRYSTAL_ORE || name.includes("life crystal") || name.includes("glow")) return "crystal";
  if (blockId === BlockId.HELLSTONE || name.includes("hell") || name.includes("ash")) return "hell";
  if (blockId === BlockId.CLOUD) return "cloud";
  if (name.includes("corrupt") || name.includes("ebon") || name.includes("pearl")) return "stone";
  return "generic";
}

/**
 * DEV/localhost-only local placeholder map (gitignored local/textures/blocks/).
 * Roles: 0 = side, 1 = top, 2 = bottom. Basename lists tried in order.
 * Never ships; production builds do not load these.
 */
const same3 = (...names) => ({ 0: names, 1: names, 2: names });

export const LOCAL_DEV_TILES = {
  [BlockId.GRASS]: {
    0: ["grass_block_side.png", "grass_side.png"],
    1: ["grass_block_top.png", "grass_top.png"],
    2: ["dirt.png"],
  },
  [BlockId.DIRT]: same3("dirt.png"),
  [BlockId.STONE]: same3("stone.png"),
  [BlockId.SAND]: same3("sand.png"),
  [BlockId.WOOD]: {
    0: ["oak_log.png", "log_side.png", "tree.png"],
    1: ["oak_log_top.png", "log_top.png", "tree_top.png"],
    2: ["oak_log_top.png", "log_top.png", "tree_top.png"],
  },
  [BlockId.LEAVES]: same3("oak_leaves.png", "leaves.png", "azalea_leaves.png"),
  [BlockId.COAL_ORE]: same3("coal_ore.png"),
  [BlockId.IRON_ORE]: same3("iron_ore.png"),
  [BlockId.GOLD_ORE]: same3("gold_ore.png"),
  [BlockId.CRYSTAL_ORE]: same3("diamond_ore.png", "amethyst_block.png", "crystal_ore.png"),
  [BlockId.TORCH]: same3("torch.png"),
  [BlockId.PLANKS]: same3("oak_planks.png", "planks.png", "wood.png"),
  [BlockId.BRICK]: same3("bricks.png", "brick.png"),
  [BlockId.SNOW]: {
    0: ["grass_block_snow.png", "snow.png", "powder_snow.png"],
    1: ["snow.png", "powder_snow.png"],
    2: ["dirt.png"],
  },
  [BlockId.BEDROCK]: same3("bedrock.png"),
  [BlockId.WATER]: same3("water_still.png", "water.png"),
  [BlockId.MUSHROOM]: same3("red_mushroom_block.png", "mushroom_block_inside.png", "brown_mushroom_block.png"),
  [BlockId.CORRUPT]: same3("crying_obsidian.png", "purple_concrete.png", "obsidian.png"),
  [BlockId.HELLSTONE]: same3("netherrack.png", "magma.png"),
  [BlockId.COPPER_ORE]: same3("copper_ore.png"),
  [BlockId.CLAY]: same3("clay.png"),
  [BlockId.GLASS]: same3("glass.png"),
  [BlockId.COBBLE]: same3("cobblestone.png", "cobble.png"),
  [BlockId.LIFE_CRYSTAL]: same3("redstone_block.png", "amethyst_block.png", "glowstone.png"),
  [BlockId.CHEST]: {
    // Modern MC chest is entity-atlas; barrel is a solid block stand-in
    0: ["barrel_side.png", "oak_planks.png"],
    1: ["barrel_top.png", "oak_planks.png"],
    2: ["barrel_bottom.png", "oak_planks.png"],
  },
  [BlockId.PLATFORM]: same3("oak_planks.png", "oak_trapdoor.png", "ladder.png"),
  [BlockId.ICE]: same3("ice.png", "packed_ice.png", "blue_ice.png"),
  [BlockId.ASH]: same3("soul_sand.png", "basalt_side.png", "tuff.png"),
  [BlockId.DEMONITE]: same3("obsidian.png", "blackstone.png", "crying_obsidian.png"),
  [BlockId.WORKBENCH]: {
    0: ["crafting_table_front.png", "crafting_table_side.png"],
    1: ["crafting_table_top.png"],
    2: ["oak_planks.png", "crafting_table_side.png"],
  },
  [BlockId.FURNACE]: {
    0: ["furnace_front.png", "furnace_side.png"],
    1: ["furnace_top.png"],
    2: ["furnace_top.png"],
  },
  [BlockId.ANVIL]: {
    0: ["anvil.png", "chipped_anvil.png", "iron_block.png"],
    1: ["anvil_top.png", "anvil.png", "iron_block.png"],
    2: ["anvil.png", "iron_block.png"],
  },
  [BlockId.CHAIR]: same3("oak_planks.png", "ladder.png"),
  [BlockId.TABLE]: same3("oak_planks.png", "crafting_table_top.png"),
  [BlockId.DOOR]: {
    0: ["oak_door_bottom.png", "door.png"],
    1: ["oak_door_top.png", "oak_door_bottom.png"],
    2: ["oak_door_bottom.png"],
  },
  [BlockId.BENCH]: same3("oak_planks.png", "stripped_oak_log.png"),
  [BlockId.BED]: {
    0: ["red_wool.png", "white_wool.png", "oak_planks.png"],
    1: ["red_wool.png", "white_wool.png"],
    2: ["oak_planks.png"],
  },
  [BlockId.HELLFORGE]: {
    0: ["blast_furnace_front.png", "furnace_front.png", "nether_bricks.png"],
    1: ["blast_furnace_top.png", "furnace_top.png"],
    2: ["nether_bricks.png", "furnace_top.png"],
  },
  [BlockId.JUNGLE_GRASS]: {
    0: ["grass_block_side.png", "podzol_side.png"],
    1: ["moss_block.png", "azalea_leaves.png", "jungle_leaves.png"],
    2: ["dirt.png"],
  },
  [BlockId.VINE]: same3("vine.png", "oak_leaves.png", "azalea_leaves.png"),
  [BlockId.DUNGEON_BRICK]: same3("stone_bricks.png", "mossy_stone_bricks.png", "deepslate_bricks.png"),
  [BlockId.CLOUD]: same3("white_wool.png", "snow.png", "powder_snow.png"),
  [BlockId.SILVER_ORE]: same3("iron_ore.png", "raw_iron_block.png"),
  [BlockId.MYTHRIL_ORE]: same3("emerald_ore.png", "diamond_ore.png", "copper_ore.png"),
  [BlockId.ADAMANTITE_ORE]: same3("redstone_ore.png", "nether_gold_ore.png", "ancient_debris_side.png"),
  [BlockId.CHLOROPHYTE_ORE]: same3("emerald_ore.png", "moss_block.png", "lime_concrete.png"),
  [BlockId.PEARLSTONE]: same3("end_stone.png", "calcite.png", "diorite.png"),
  [BlockId.EBONSTONE]: same3("blackstone.png", "obsidian.png", "deepslate.png"),
  [BlockId.LIVING_WOOD]: {
    0: ["jungle_log.png", "oak_log.png", "mangrove_log.png"],
    1: ["jungle_log_top.png", "oak_log_top.png"],
    2: ["jungle_log_top.png", "oak_log_top.png"],
  },
};

/** @deprecated use LOCAL_DEV_TILES */
export const PACK_TILES = LOCAL_DEV_TILES;

/** Vite-dev-only URL for gitignored local placeholders (see vite.config.js). */
export const LOCAL_DEV_TEXTURE_BASE = "/__local_textures/blocks/";

/**
 * Local placeholders load when the Vite middleware can serve them:
 * - import.meta.env.DEV, or
 * - browser on localhost / 127.0.0.1 (playtest / desktop:dev)
 * Never in packaged production builds (file:// or real host, no middleware).
 */
export function useLocalDevTextures() {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) return true;
  } catch {
    /* ignore */
  }
  try {
    if (typeof location !== "undefined") {
      const h = location.hostname;
      if (h === "localhost" || h === "127.0.0.1") return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Resolve a local-dev placeholder URL (dev server only). */
export function packTileUrl(filename) {
  const name = String(filename || "").replace(/^\/+/, "");
  return `${LOCAL_DEV_TEXTURE_BASE}${name}`;
}

function loadImage(url) {
  return new Promise((resolve) => {
    if (typeof Image === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function loadFirstImage(candidates) {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  for (const file of list) {
    if (!file) continue;
    const img = await loadImage(packTileUrl(file));
    if (img) return img;
  }
  return null;
}

/**
 * DEV-only: blit gitignored local placeholders onto atlas.
 * Production / missing files keep procedural paint.
 * @returns {Promise<{ loaded: number, failed: number, skipped?: boolean }>}
 */
export async function applyLocalDevTextures(atlas) {
  if (!useLocalDevTextures()) return { loaded: 0, failed: 0, skipped: true };
  if (!atlas?.canvas || !atlas?.texture) return { loaded: 0, failed: 0 };
  const ctx = atlas.canvas.getContext("2d");
  if (!ctx) return { loaded: 0, failed: 0 };
  ctx.imageSmoothingEnabled = false;

  let loaded = 0;
  let failed = 0;
  const jobs = [];

  for (const [idStr, roles] of Object.entries(LOCAL_DEV_TILES)) {
    const blockId = Number(idStr);
    if (!roles || Number.isNaN(blockId)) continue;
    for (const [roleStr, candidates] of Object.entries(roles)) {
      const role = Number(roleStr);
      jobs.push(
        (async () => {
          const img = await loadFirstImage(candidates);
          if (!img) {
            failed += 1;
            return;
          }
          const idx = tileIndex(blockId, role);
          const col = idx % ATLAS_COLS;
          const row = Math.floor(idx / ATLAS_COLS);
          if (row >= ATLAS_COLS) {
            failed += 1;
            return;
          }
          const ox = col * TILE_SIZE;
          const oy = row * TILE_SIZE;
          ctx.clearRect(ox, oy, TILE_SIZE, TILE_SIZE);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            img,
            0,
            0,
            img.naturalWidth || img.width,
            img.naturalHeight || img.height,
            ox,
            oy,
            TILE_SIZE,
            TILE_SIZE
          );
          loaded += 1;
        })()
      );
    }
  }

  await Promise.all(jobs);
  atlas.texture.needsUpdate = true;
  atlas.packStats = { loaded, failed };
  return { loaded, failed };
}

/** @deprecated name — use applyLocalDevTextures */
export const applyTexturePack = applyLocalDevTextures;

/**
 * Build atlas texture + material (procedural product art).
 * In DEV only, optionally overlays local/textures/blocks/ placeholders.
 * @param {{ loadLocalDev?: boolean }} [opts]
 */
export function createBlockAtlas(opts = {}) {
  const loadLocalDev = opts.loadLocalDev !== false && useLocalDevTextures();
  const size = ATLAS_COLS * TILE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);

  const maxId = Math.max(...Object.keys(BLOCKS).map(Number), 50);
  for (let id = 0; id <= maxId; id++) {
    const def = BLOCKS[id];
    if (!def || id === BlockId.AIR) continue;
    for (let role = 0; role < 3; role++) {
      const idx = tileIndex(id, role);
      const col = idx % ATLAS_COLS;
      const row = Math.floor(idx / ATLAS_COLS);
      if (row >= ATLAS_COLS) continue;
      paintTile(img, col * TILE_SIZE, row * TILE_SIZE, id, role, def);
    }
  }

  ctx.putImageData(img, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 1;
  texture.needsUpdate = true;

  const material = new THREE.MeshLambertMaterial({
    map: texture,
    vertexColors: true,
    transparent: true,
    alphaTest: 0.35,
    side: THREE.FrontSide,
  });

  const atlas = { texture, material, canvas, packReady: null, packStats: null };
  if (loadLocalDev && typeof document !== "undefined") {
    atlas.packReady = applyLocalDevTextures(atlas).catch(() => ({ loaded: 0, failed: -1 }));
  }
  return atlas;
}

export function atlasDataURL(canvas) {
  return canvas.toDataURL("image/png");
}
