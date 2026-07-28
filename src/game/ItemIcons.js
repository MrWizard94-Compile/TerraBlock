/**
 * Item icons for inventory / hotbar / drops.
 * Procedural crisp pixel art always; on localhost/dev optionally overlays
 * gitignored local textures (never shipped).
 */
import * as THREE from "three";
import { ITEMS } from "./items.js";
import { BLOCKS } from "./blocks.js";
import { LOCAL_DEV_TILES, LOCAL_DEV_TEXTURE_BASE, useLocalDevTextures } from "./BlockTextures.js";

const SIZE = 48;
/** @type {Map<string, string>} */
const cache = new Map();
/** @type {Map<string, THREE.CanvasTexture>} */
const texCache = new Map();

/** TerraBlock item id → local MC-style basenames (item_* or block faces). */
const LOCAL_ITEM_FILES = {
  dirt: ["dirt.png"],
  stone: ["stone.png"],
  sand: ["sand.png"],
  wood: ["oak_log.png"],
  planks: ["oak_planks.png"],
  brick: ["bricks.png"],
  cobble: ["cobblestone.png"],
  glass: ["glass.png"],
  clay: ["clay.png"],
  ice: ["ice.png"],
  ash: ["soul_sand.png"],
  platform: ["oak_planks.png"],
  torch: ["torch.png"],
  coal: ["item_coal.png", "coal_ore.png"],
  copper_ore: ["copper_ore.png", "item_raw_copper.png"],
  iron_ore: ["iron_ore.png", "item_raw_iron.png"],
  silver_ore: ["iron_ore.png"],
  gold_ore: ["gold_ore.png", "item_raw_gold.png"],
  crystal: ["item_diamond.png", "diamond_ore.png"],
  hellstone: ["netherrack.png"],
  demonite: ["obsidian.png"],
  copper_bar: ["item_copper_ingot.png"],
  iron_bar: ["item_iron_ingot.png"],
  silver_bar: ["item_iron_ingot.png"],
  gold_bar: ["item_gold_ingot.png"],
  hellstone_bar: ["item_netherite_ingot.png", "item_gold_ingot.png"],
  gel: ["item_slime_ball.png"],
  wood_pick: ["item_wooden_pickaxe.png"],
  wood_axe: ["item_wooden_axe.png"],
  wood_hammer: ["item_wooden_axe.png"],
  wood_sword: ["item_wooden_sword.png"],
  copper_pick: ["item_copper_pickaxe.png", "item_stone_pickaxe.png"],
  copper_axe: ["item_copper_axe.png", "item_stone_axe.png"],
  copper_sword: ["item_copper_sword.png", "item_stone_sword.png"],
  iron_pick: ["item_iron_pickaxe.png"],
  iron_axe: ["item_iron_axe.png"],
  iron_hammer: ["item_iron_axe.png"],
  iron_sword: ["item_iron_sword.png"],
  silver_pick: ["item_iron_pickaxe.png"],
  silver_sword: ["item_iron_sword.png"],
  gold_pick: ["item_golden_pickaxe.png"],
  gold_axe: ["item_golden_axe.png"],
  gold_sword: ["item_golden_sword.png"],
  molten_pick: ["item_diamond_pickaxe.png", "item_netherite_pickaxe.png"],
  molten_sword: ["item_diamond_sword.png", "item_netherite_sword.png"],
  wooden_arrow: ["item_arrow.png"],
  flaming_arrow: ["item_arrow.png", "item_spectral_arrow.png"],
  wood_bow: ["item_bow.png"],
  gold_bow: ["item_bow.png"],
  musket_ball: ["item_arrow.png"],
  apple: ["item_apple.png"],
  mushroom: ["item_red_mushroom.png", "item_brown_mushroom.png"],
  healing_potion: ["item_potion.png", "item_splash_potion.png"],
  lesser_healing: ["item_potion.png"],
  mana_potion: ["item_potion.png"],
  copper_coin: ["item_copper_ingot.png"],
  silver_coin: ["item_iron_ingot.png"],
  gold_coin: ["item_gold_ingot.png"],
  platinum_coin: ["item_netherite_ingot.png"],
  workbench: ["crafting_table_front.png"],
  furnace: ["furnace_front.png"],
  anvil: ["anvil.png"],
  door: ["item_oak_door.png", "oak_door_bottom.png"],
  chest: ["barrel_side.png"],
  chair: ["oak_planks.png"],
  table: ["oak_planks.png"],
  bed: ["red_wool.png"],
  wood_pole: ["item_fishing_rod.png"],
  reinforced_pole: ["item_fishing_rod.png"],
  trout: ["item_cod.png", "item_salmon.png"],
  bass: ["item_cod.png"],
  bomb: ["item_tnt_minecart.png", "tnt_side.png"],
  dynamite: ["tnt_side.png"],
  life_crystal: ["item_heart_of_the_sea.png", "redstone_block.png"],
  mana_crystal: ["item_lapis_lazuli.png", "item_echo_shard.png"],
};

function parseColor(c) {
  if (!c) return [180, 180, 180];
  if (c.startsWith("#")) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  return [180, 180, 180];
}

function clamp(v, a = 0, b = 255) {
  return Math.max(a, Math.min(b, v | 0));
}

function hash(x, y, s) {
  let n = x * 374761393 + y * 668265263 + s * 1274126177;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967296;
}

function px(img, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  img.data[i] = r;
  img.data[i + 1] = g;
  img.data[i + 2] = b;
  img.data[i + 3] = a;
}

function rect(img, x0, y0, w, h, r, g, b, a = 255) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) px(img, x, y, r, g, b, a);
  }
}

function line(img, x0, y0, x1, y1, r, g, b, thick = 1) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  for (;;) {
    for (let t = 0; t < thick; t++) {
      px(img, x + t, y, r, g, b);
      px(img, x, y + t, r, g, b);
    }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function circle(img, cx, cy, rad, r, g, b, a = 255) {
  const rr = rad * rad;
  for (let y = cy - rad; y <= cy + rad; y++) {
    for (let x = cx - rad; x <= cx + rad; x++) {
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d <= rr) {
        const edge = d > rr * 0.72;
        const m = edge ? 0.65 : 1;
        px(img, x, y, clamp(r * m), clamp(g * m), clamp(b * m), a);
      }
    }
  }
}

function outlineDark(img) {
  const copy = new Uint8ClampedArray(img.data);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      if (copy[i + 3] < 128) continue;
      let edge = false;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) {
          edge = true;
          break;
        }
        if (copy[(ny * SIZE + nx) * 4 + 3] < 80) {
          edge = true;
          break;
        }
      }
      if (edge) {
        img.data[i] = clamp(copy[i] * 0.4);
        img.data[i + 1] = clamp(copy[i + 1] * 0.4);
        img.data[i + 2] = clamp(copy[i + 2] * 0.4);
      }
    }
  }
}

function shadeNoise(img, seed) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      if (img.data[i + 3] < 128) continue;
      const n = 0.9 + hash(x, y, seed) * 0.2;
      img.data[i] = clamp(img.data[i] * n);
      img.data[i + 1] = clamp(img.data[i + 1] * n);
      img.data[i + 2] = clamp(img.data[i + 2] * n);
    }
  }
}

function drawBlockCube(img, r, g, b) {
  // isometric cube with bevel
  const top = [
    [14, 8],
    [34, 8],
    [40, 16],
    [24, 22],
    [8, 16],
  ];
  // fill top diamond
  for (let y = 8; y < 22; y++) {
    for (let x = 8; x < 40; x++) {
      const u = (x - 24) / 16;
      const v = (y - 15) / 7;
      if (Math.abs(u) + Math.abs(v) < 1.05) {
        const hi = y < 12 ? 1.2 : 1.05;
        px(img, x, y, clamp(r * hi), clamp(g * hi), clamp(b * hi));
      }
    }
  }
  // left face
  for (let y = 16; y < 38; y++) {
    for (let x = 8; x < 24; x++) {
      const t = (y - 16) / 22;
      if (x > 8 + t * 2 && x < 24 - t * 0) {
        px(img, x, y, clamp(r * 0.78), clamp(g * 0.78), clamp(b * 0.78));
      }
    }
  }
  // right face
  for (let y = 16; y < 38; y++) {
    for (let x = 24; x < 40; x++) {
      px(img, x, y, clamp(r * 0.55), clamp(g * 0.55), clamp(b * 0.55));
    }
  }
  // re-shape left/right as proper diamond extrusion
  for (let y = 16; y < 36; y++) {
    const row = y - 16;
    for (let x = 8; x < 24; x++) {
      if (x >= 8 && x <= 22 && row < 18) {
        const n = hash(x, y, 3);
        px(img, x, y, clamp(r * (0.72 + n * 0.08)), clamp(g * (0.72 + n * 0.08)), clamp(b * (0.72 + n * 0.08)));
      }
    }
    for (let x = 24; x < 40; x++) {
      if (x >= 24 && x <= 38 && row < 18) {
        const n = hash(x, y, 4);
        px(img, x, y, clamp(r * (0.5 + n * 0.08)), clamp(g * (0.5 + n * 0.08)), clamp(b * (0.5 + n * 0.08)));
      }
    }
  }
  void top;
}

function drawPick(img, r, g, b) {
  line(img, 12, 38, 26, 18, 120, 78, 40, 3);
  line(img, 20, 12, 38, 16, r, g, b, 4);
  line(img, 20, 12, 32, 26, r, g, b, 3);
  rect(img, 32, 10, 8, 8, clamp(r * 1.15), clamp(g * 1.15), clamp(b * 1.1));
  // metal shine
  px(img, 34, 12, 255, 255, 255);
  px(img, 35, 13, 255, 255, 255);
}

function drawAxe(img, r, g, b) {
  line(img, 14, 38, 24, 16, 120, 78, 40, 3);
  for (let y = 8; y < 24; y++) {
    const w = Math.max(2, (y - 6) | 0);
    for (let x = 22; x < 22 + w + 4; x++) {
      if (x < 40) px(img, x, y, r, g, b);
    }
  }
  line(img, 22, 10, 38, 14, clamp(r * 1.1), clamp(g * 1.1), clamp(b * 1.1), 2);
}

function drawHammer(img, r, g, b) {
  line(img, 14, 38, 24, 18, 120, 78, 40, 3);
  rect(img, 16, 8, 20, 12, r, g, b);
  rect(img, 18, 10, 16, 4, clamp(r * 1.2), clamp(g * 1.15), clamp(b * 1.1));
  rect(img, 18, 18, 16, 2, clamp(r * 0.6), clamp(g * 0.6), clamp(b * 0.6));
}

function drawSword(img, r, g, b) {
  line(img, 14, 36, 34, 12, r, g, b, 3);
  line(img, 15, 36, 35, 12, clamp(r * 1.25), clamp(g * 1.25), clamp(b * 1.2), 1);
  // tip
  line(img, 34, 12, 38, 8, clamp(r * 1.1), clamp(g * 1.1), clamp(b * 1.1), 2);
  // guard
  line(img, 10, 32, 20, 28, 210, 185, 70, 3);
  rect(img, 10, 34, 6, 8, 100, 65, 35);
  circle(img, 12, 42, 3, 190, 160, 50);
}

function drawBow(img, r, g, b) {
  for (let t = 0; t <= 28; t++) {
    const a = -0.95 + (t / 28) * 1.9;
    const x = 26 + Math.sin(a) * 14;
    const y = 24 + Math.cos(a) * 16;
    px(img, x | 0, y | 0, r, g, b);
    px(img, (x | 0) + 1, y | 0, r, g, b);
    px(img, x | 0, (y | 0) + 1, clamp(r * 0.8), clamp(g * 0.8), clamp(b * 0.8));
  }
  line(img, 14, 8, 14, 40, 230, 230, 235, 1);
}

function drawStaff(img, r, g, b) {
  line(img, 16, 40, 26, 12, 130, 85, 45, 3);
  circle(img, 30, 12, 8, r, g, b);
  circle(img, 28, 10, 3, 255, 255, 255, 160);
}

function drawHelmet(img, r, g, b) {
  rect(img, 12, 14, 24, 18, r, g, b);
  rect(img, 14, 10, 20, 6, clamp(r * 1.12), clamp(g * 1.12), clamp(b * 1.1));
  rect(img, 16, 20, 16, 5, 18, 18, 28);
  rect(img, 8, 20, 5, 12, clamp(r * 0.75), clamp(g * 0.75), clamp(b * 0.75));
  rect(img, 35, 20, 5, 12, clamp(r * 0.75), clamp(g * 0.75), clamp(b * 0.75));
  // rivets
  px(img, 14, 16, 255, 255, 200);
  px(img, 32, 16, 255, 255, 200);
}

function drawChest(img, r, g, b) {
  rect(img, 12, 12, 24, 26, r, g, b);
  rect(img, 6, 12, 8, 10, clamp(r * 0.9), clamp(g * 0.9), clamp(b * 0.9));
  rect(img, 34, 12, 8, 10, clamp(r * 0.9), clamp(g * 0.9), clamp(b * 0.9));
  rect(img, 18, 18, 12, 12, clamp(r * 1.18), clamp(g * 1.18), clamp(b * 1.12));
  line(img, 18, 24, 30, 24, clamp(r * 0.5), clamp(g * 0.5), clamp(b * 0.5), 1);
}

function drawLegs(img, r, g, b) {
  rect(img, 12, 12, 10, 26, r, g, b);
  rect(img, 26, 12, 10, 26, r, g, b);
  rect(img, 12, 10, 24, 8, clamp(r * 1.08), clamp(g * 1.08), clamp(b * 1.05));
  rect(img, 12, 34, 10, 4, clamp(r * 0.6), clamp(g * 0.6), clamp(b * 0.6));
  rect(img, 26, 34, 10, 4, clamp(r * 0.6), clamp(g * 0.6), clamp(b * 0.6));
}

function drawPotion(img, r, g, b) {
  rect(img, 18, 8, 12, 6, 190, 210, 220, 220);
  rect(img, 14, 14, 20, 22, 170, 200, 210, 200);
  rect(img, 16, 20, 16, 14, r, g, b, 235);
  rect(img, 20, 6, 8, 4, 130, 85, 40);
  rect(img, 17, 16, 3, 10, 255, 255, 255, 140);
  // liquid meniscus
  rect(img, 16, 20, 16, 2, clamp(r * 1.2), clamp(g * 1.2), clamp(b * 1.15), 200);
}

function drawCoin(img, r, g, b) {
  circle(img, 24, 24, 14, r, g, b);
  circle(img, 24, 24, 10, clamp(r * 1.15), clamp(g * 1.15), clamp(b * 1.05));
  rect(img, 22, 16, 4, 16, clamp(r * 0.45), clamp(g * 0.45), clamp(b * 0.35));
  rect(img, 18, 22, 12, 3, clamp(r * 0.45), clamp(g * 0.45), clamp(b * 0.35));
}

function drawAccessory(img, r, g, b) {
  for (let y = 12; y < 36; y++) {
    for (let x = 12; x < 36; x++) {
      const cx = x - 23.5;
      const cy = y - 24.5;
      const d = cx * cx + cy * cy;
      if (d < 120 && d > 55) px(img, x, y, r, g, b);
    }
  }
  rect(img, 20, 8, 8, 8, clamp(r * 1.35), clamp(g * 1.25), clamp(b * 1.4));
  px(img, 22, 10, 255, 255, 255);
}

function drawBossItem(img, r, g, b) {
  circle(img, 24, 24, 14, r, g, b);
  rect(img, 18, 18, 12, 12, 16, 16, 24);
  circle(img, 24, 24, 4, 255, 70, 70);
  px(img, 24, 24, 255, 200, 200);
}

function drawMount(img, r, g, b) {
  rect(img, 10, 20, 28, 12, r, g, b);
  rect(img, 14, 14, 20, 10, clamp(r * 0.85), clamp(g * 0.85), clamp(b * 0.85));
  rect(img, 8, 28, 6, 10, 95, 65, 35);
  rect(img, 34, 28, 6, 10, 95, 65, 35);
}

function drawFish(img, r, g, b) {
  for (let y = 18; y < 30; y++) {
    for (let x = 8; x < 32; x++) {
      const cy = Math.abs(y - 23.5);
      const maxW = 5 - cy;
      if (x > 12 - maxW && x < 28 + maxW) {
        const n = hash(x, y, 9);
        px(img, x, y, clamp(r * (0.9 + n * 0.2)), clamp(g * (0.9 + n * 0.2)), clamp(b * (0.9 + n * 0.2)));
      }
    }
  }
  line(img, 30, 24, 42, 16, r, g, b, 2);
  line(img, 30, 24, 42, 32, r, g, b, 2);
  px(img, 14, 22, 255, 255, 255);
  px(img, 14, 23, 20, 20, 30);
}

function drawIngot(img, r, g, b) {
  // metal bar with bevel
  for (let y = 16; y < 32; y++) {
    for (let x = 10; x < 38; x++) {
      const edge = y < 18 || y > 29 || x < 12 || x > 35;
      const top = y < 20;
      const m = edge ? 0.55 : top ? 1.2 : 0.9;
      const n = hash(x, y, 11);
      px(img, x, y, clamp(r * m * (0.95 + n * 0.1)), clamp(g * m * (0.95 + n * 0.1)), clamp(b * m * (0.95 + n * 0.1)));
    }
  }
  // shine streak
  line(img, 14, 18, 30, 18, 255, 255, 255, 1);
}

function drawOreChunk(img, r, g, b, seed) {
  for (let i = 0; i < 55; i++) {
    const x = 8 + ((hash(i, 1, seed) * 28) | 0);
    const y = 10 + ((hash(i, 2, seed) * 26) | 0);
    const s = 3 + ((hash(i, 3, seed) * 5) | 0);
    const m = 0.75 + hash(i, 4, seed) * 0.45;
    rect(img, x, y, s, s, clamp(r * m), clamp(g * m), clamp(b * m));
  }
  // sparkle
  for (let i = 0; i < 6; i++) {
    const x = 12 + ((hash(i, 8, seed) * 24) | 0);
    const y = 12 + ((hash(i, 9, seed) * 24) | 0);
    px(img, x, y, 255, 255, 255);
  }
}

function drawGeneric(img, r, g, b, seed) {
  for (let y = 10; y < 38; y++) {
    for (let x = 10; x < 38; x++) {
      const n = hash(x, y, seed);
      const edge = x < 12 || x > 35 || y < 12 || y > 35;
      const m = edge ? 0.55 : 0.88 + n * 0.25;
      px(img, x, y, clamp(r * m), clamp(g * m), clamp(b * m));
    }
  }
}

/**
 * Classify and paint icon for item id.
 */
function paintIcon(itemId) {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const img = ctx.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i++) img.data[i] = 0;

  const def = ITEMS[itemId];
  if (!def) {
    drawGeneric(img, 200, 50, 200, 1);
    outlineDark(img);
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  const [r, g, b] = parseColor(def.color);
  const name = (def.name || itemId).toLowerCase();
  let seed = 0;
  for (let i = 0; i < itemId.length; i++) seed = (seed + itemId.charCodeAt(i) * (i + 1)) | 0;

  if (def.place !== undefined && def.place !== null && BLOCKS[def.place]) {
    const bc = BLOCKS[def.place].color || [r, g, b];
    drawBlockCube(img, bc[0], bc[1], bc[2]);
  } else if (def.tool === "pick" || name.includes("pickaxe") || name.includes("picksaw")) {
    drawPick(img, r, g, b);
  } else if (def.tool === "axe" || (name.includes("axe") && !name.includes("pickaxe"))) {
    drawAxe(img, r, g, b);
  } else if (def.tool === "hammer" || name.includes("hammer")) {
    drawHammer(img, r, g, b);
  } else if (def.weapon === "melee" || name.includes("sword") || name.includes("blade") || name.includes("edge")) {
    drawSword(img, r, g, b);
  } else if (def.weapon === "ranged" || name.includes("bow") || name.includes("shark") || name.includes("gun") || name.includes("cannon")) {
    drawBow(img, r, g, b);
  } else if (def.weapon === "magic" || def.weapon === "summon" || name.includes("staff") || name.includes("scythe") || name.includes("prism")) {
    drawStaff(img, r, g, b);
  } else if (def.armor === "head" || name.includes("helmet") || name.includes("hat") || name.includes("fedora")) {
    drawHelmet(img, r, g, b);
  } else if (def.armor === "chest" || name.includes("mail") || name.includes("breast") || name.includes("robe") || name.includes("plate")) {
    drawChest(img, r, g, b);
  } else if (def.armor === "legs" || name.includes("greave") || name.includes("legging")) {
    drawLegs(img, r, g, b);
  } else if (def.potion || def.heal || name.includes("potion") || name.includes("flask")) {
    drawPotion(img, r, g, b);
  } else if (name.includes("coin")) {
    drawCoin(img, r, g, b);
  } else if (def.accessory || def.mount) {
    if (def.mount) drawMount(img, r, g, b);
    else drawAccessory(img, r, g, b);
  } else if (def.boss || name.includes("crown") || name.includes("eye") || name.includes("voodoo") || name.includes("sigil") || name.includes("doll")) {
    drawBossItem(img, r, g, b);
  } else if (name.includes("fish") || name.includes("bass") || name.includes("trout") || name.includes("carp") || name.includes("cod") || name.includes("tetra")) {
    drawFish(img, r, g, b);
  } else if (def.fishingPower || name.includes("pole")) {
    line(img, 12, 40, 20, 10, 130, 85, 45, 3);
    line(img, 20, 10, 36, 14, 220, 220, 225, 1);
    circle(img, 34, 30, 3, 70, 150, 210);
  } else if (def.grapple || name.includes("hook") || name.includes("whip")) {
    line(img, 10, 34, 36, 14, 170, 170, 180, 3);
    rect(img, 34, 10, 8, 8, r, g, b);
  } else if (def.bomb || name.includes("bomb") || name.includes("dynamite") || name.includes("grenade")) {
    circle(img, 24, 26, 12, 45, 45, 50);
    line(img, 24, 14, 28, 6, 220, 90, 40, 2);
    px(img, 28, 5, 255, 220, 60);
  } else if (name.includes("bar") && !name.includes("piggy")) {
    drawIngot(img, r, g, b);
  } else if (
    name.includes("gel") ||
    name.includes("mushroom") ||
    name.includes("ore") ||
    name.includes("soul") ||
    name.includes("crystal") ||
    name.includes("scale") ||
    name.includes("bone") ||
    name.includes("lens")
  ) {
    drawOreChunk(img, r, g, b, seed);
  } else {
    drawGeneric(img, r, g, b, seed);
  }

  shadeNoise(img, seed);
  outlineDark(img);
  ctx.putImageData(img, 0, 0);
  return canvas;
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

function canvasFromImage(img) {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  // letterbox pixel art
  const s = Math.min(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
  const w = Math.max(1, Math.floor(img.naturalWidth * s));
  const h = Math.max(1, Math.floor(img.naturalHeight * s));
  const ox = ((SIZE - w) / 2) | 0;
  const oy = ((SIZE - h) / 2) | 0;
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, ox, oy, w, h);
  return canvas;
}

/**
 * DEV/localhost only: replace icon cache entries with local MC item/block tiles.
 * Never used in packaged production builds.
 */
export async function preloadLocalItemIcons() {
  if (!useLocalDevTextures()) return { loaded: 0, failed: 0 };
  let loaded = 0;
  let failed = 0;

  // Map placeable items via block tiles
  for (const [itemId, def] of Object.entries(ITEMS)) {
    const files = LOCAL_ITEM_FILES[itemId] ? [...LOCAL_ITEM_FILES[itemId]] : [];
    if (def.place !== undefined && def.place !== null && LOCAL_DEV_TILES[def.place]) {
      const roles = LOCAL_DEV_TILES[def.place];
      const side = roles[0] || roles[1];
      if (side) files.push(...side);
    }
    if (!files.length) continue;

    let img = null;
    for (const f of files) {
      img = await loadImage(`${LOCAL_DEV_TEXTURE_BASE}${f}`);
      if (img) break;
    }
    if (!img) {
      failed += 1;
      continue;
    }
    const canvas = canvasFromImage(img);
    const url = canvas.toDataURL("image/png");
    cache.set(itemId, url);
    if (texCache.has(itemId)) {
      const tex = texCache.get(itemId);
      tex.image = canvas;
      tex.needsUpdate = true;
    }
    loaded += 1;
  }

  try {
    window.dispatchEvent(new CustomEvent("terrablock-icons-ready", { detail: { loaded, failed } }));
  } catch {
    /* ignore */
  }
  return { loaded, failed };
}

/**
 * Data URL for CSS background-image.
 * @param {string} itemId
 */
export function itemIconUrl(itemId) {
  if (!itemId) return "";
  if (cache.has(itemId)) return cache.get(itemId);
  const canvas = paintIcon(itemId);
  const url = canvas.toDataURL("image/png");
  cache.set(itemId, url);
  return url;
}

/**
 * Three.js texture for world drops / held items.
 * @param {string} itemId
 */
export function itemIconTexture(itemId) {
  if (texCache.has(itemId)) return texCache.get(itemId);
  // ensure cache url exists
  itemIconUrl(itemId);
  const canvas = paintIcon(itemId);
  // if local preload already set url, rebuild from that? keep procedural for 3d until preload updates
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  texCache.set(itemId, tex);
  return tex;
}

/**
 * HTML for a slot icon element.
 * @param {string} itemId
 * @param {string} [extraClass]
 */
export function itemIconHtml(itemId, extraClass = "slot-icon") {
  const url = itemIconUrl(itemId);
  return `<div class="${extraClass}" style="background-image:url(${url});background-size:contain;background-repeat:no-repeat;background-position:center;background-color:transparent;image-rendering:pixelated" title="${ITEMS[itemId]?.name || itemId}"></div>`;
}

/** Pre-warm common icons (optional) */
export function warmItemIcons(ids = []) {
  for (const id of ids) itemIconUrl(id);
}
