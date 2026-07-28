/**
 * Procedural sprite textures for enemies, NPCs, bosses, minions.
 */
import * as THREE from "three";

const cache = new Map();

function hash(x, y, s) {
  let n = x * 374761393 + y * 668265263 + s * 1274126177;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967296;
}

function px(data, size, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  data[i] = r | 0;
  data[i + 1] = g | 0;
  data[i + 2] = b | 0;
  data[i + 3] = a | 0;
}

function rgb(hex) {
  if (typeof hex === "number") {
    return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
  }
  return [180, 180, 180];
}

/**
 * @param {string} key
 * @param {number} colorHex
 * @param {'slime'|'humanoid'|'eye'|'flyer'|'boss'|'npc'|'minion'} kind
 * @param {number} [emissive]
 */
export function entityTexture(key, colorHex, kind = "humanoid", emissive = 0) {
  const cacheKey = `${key}|${kind}|${colorHex}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i++) d[i] = 0;

  const [cr, cg, cb] = rgb(colorHex);
  const [er, eg, eb] = rgb(emissive);

  if (kind === "slime") {
    for (let y = 20; y < 56; y++) {
      for (let x = 8; x < 56; x++) {
        const cx = (x - 32) / 22;
        const cy = (y - 40) / 16;
        if (cx * cx + cy * cy < 1) {
          const n = hash(x, y, key.length);
          const shade = 0.75 + n * 0.35;
          px(d, size, x, y, cr * shade, cg * shade, cb * shade, 230);
        }
      }
    }
    // eyes
    px(d, size, 24, 34, 20, 20, 30, 255);
    px(d, size, 25, 34, 20, 20, 30, 255);
    px(d, size, 38, 34, 20, 20, 30, 255);
    px(d, size, 39, 34, 20, 20, 30, 255);
    // shine
    for (let y = 24; y < 32; y++) {
      for (let x = 18; x < 28; x++) {
        if (hash(x, y, 3) > 0.5) px(d, size, x, y, 255, 255, 255, 80);
      }
    }
  } else if (kind === "eye") {
    for (let y = 8; y < 56; y++) {
      for (let x = 8; x < 56; x++) {
        const cx = (x - 32) / 24;
        const cy = (y - 32) / 24;
        if (cx * cx + cy * cy < 1) {
          const n = hash(x, y, 7);
          px(d, size, x, y, cr * (0.7 + n * 0.4), cg * (0.7 + n * 0.3), cb * (0.7 + n * 0.3), 255);
        }
      }
    }
    // iris
    for (let y = 20; y < 44; y++) {
      for (let x = 20; x < 44; x++) {
        const cx = (x - 32) / 10;
        const cy = (y - 32) / 10;
        if (cx * cx + cy * cy < 1) px(d, size, x, y, 40, 10, 10, 255);
      }
    }
    for (let y = 26; y < 38; y++) {
      for (let x = 26; x < 38; x++) {
        const cx = (x - 32) / 5;
        const cy = (y - 32) / 5;
        if (cx * cx + cy * cy < 1) px(d, size, x, y, 10, 10, 15, 255);
      }
    }
    // veins
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      for (let t = 8; t < 22; t++) {
        const x = (32 + Math.cos(a) * t) | 0;
        const y = (32 + Math.sin(a) * t) | 0;
        px(d, size, x, y, 180, 40, 40, 180);
      }
    }
  } else if (kind === "humanoid" || kind === "npc") {
    // head
    for (let y = 6; y < 22; y++) {
      for (let x = 20; x < 44; x++) {
        const cx = (x - 32) / 11;
        const cy = (y - 14) / 8;
        if (cx * cx + cy * cy < 1) {
          const skin = kind === "npc" ? [200, 150, 110] : [cr, cg, cb];
          px(d, size, x, y, skin[0], skin[1], skin[2], 255);
        }
      }
    }
    // eyes
    px(d, size, 26, 14, 20, 20, 30, 255);
    px(d, size, 36, 14, 20, 20, 30, 255);
    // body
    for (let y = 22; y < 44; y++) {
      for (let x = 18; x < 46; x++) {
        const n = hash(x, y, 2);
        px(d, size, x, y, cr * (0.85 + n * 0.2), cg * (0.85 + n * 0.2), cb * (0.85 + n * 0.2), 255);
      }
    }
    // arms
    for (let y = 24; y < 42; y++) {
      for (let x = 12; x < 18; x++) px(d, size, x, y, cr * 0.9, cg * 0.9, cb * 0.9, 255);
      for (let x = 46; x < 52; x++) px(d, size, x, y, cr * 0.9, cg * 0.9, cb * 0.9, 255);
    }
    // legs
    for (let y = 44; y < 60; y++) {
      for (let x = 22; x < 30; x++) px(d, size, x, y, cr * 0.7, cg * 0.7, cb * 0.7, 255);
      for (let x = 34; x < 42; x++) px(d, size, x, y, cr * 0.7, cg * 0.7, cb * 0.7, 255);
    }
    if (kind === "npc") {
      // smile
      px(d, size, 28, 18, 80, 40, 30, 255);
      px(d, size, 32, 19, 80, 40, 30, 255);
      px(d, size, 36, 18, 80, 40, 30, 255);
    }
  } else if (kind === "flyer") {
    // body
    for (let y = 16; y < 40; y++) {
      for (let x = 16; x < 48; x++) {
        const cx = (x - 32) / 14;
        const cy = (y - 28) / 10;
        if (cx * cx + cy * cy < 1) px(d, size, x, y, cr, cg, cb, 255);
      }
    }
    // wings
    for (let y = 18; y < 36; y++) {
      for (let x = 4; x < 18; x++) {
        if (hash(x, y, 1) > 0.4) px(d, size, x, y, er || cr * 0.6, eg || cg * 0.6, eb || cb * 0.8, 160);
      }
      for (let x = 46; x < 60; x++) {
        if (hash(x, y, 2) > 0.4) px(d, size, x, y, er || cr * 0.6, eg || cg * 0.6, eb || cb * 0.8, 160);
      }
    }
    px(d, size, 28, 26, 255, 255, 255, 255);
    px(d, size, 36, 26, 255, 255, 255, 255);
  } else if (kind === "boss") {
    // large imposing shape
    for (let y = 4; y < 60; y++) {
      for (let x = 6; x < 58; x++) {
        const cx = (x - 32) / 26;
        const cy = (y - 32) / 28;
        if (cx * cx + cy * cy < 1) {
          const n = hash(x, y, 9);
          const edge = cx * cx + cy * cy > 0.75;
          const rr = edge ? cr * 0.5 : cr * (0.8 + n * 0.35);
          const gg = edge ? cg * 0.5 : cg * (0.8 + n * 0.35);
          const bb = edge ? cb * 0.5 : cb * (0.8 + n * 0.35);
          px(d, size, x, y, rr + er * 0.3, gg + eg * 0.2, bb + eb * 0.2, 255);
        }
      }
    }
    // glowing eyes
    for (let y = 22; y < 30; y++) {
      for (let x = 18; x < 28; x++) px(d, size, x, y, 255, 40, 40, 255);
      for (let x = 36; x < 46; x++) px(d, size, x, y, 255, 40, 40, 255);
    }
  } else if (kind === "minion") {
    for (let y = 16; y < 48; y++) {
      for (let x = 16; x < 48; x++) {
        const cx = (x - 32) / 12;
        const cy = (y - 32) / 12;
        if (cx * cx + cy * cy < 1) {
          px(d, size, x, y, cr, cg, cb, 220);
        }
      }
    }
    px(d, size, 26, 30, 255, 255, 255, 255);
    px(d, size, 36, 30, 255, 255, 255, 255);
  } else {
    for (let y = 8; y < 56; y++) {
      for (let x = 8; x < 56; x++) {
        px(d, size, x, y, cr, cg, cb, 255);
      }
    }
  }

  // outline
  const copy = new Uint8ClampedArray(d);
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = (y * size + x) * 4;
      if (copy[i + 3] < 100) continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const j = ((y + dy) * size + (x + dx)) * 4;
        if (copy[j + 3] < 80) {
          d[i] = copy[i] * 0.35;
          d[i + 1] = copy[i + 1] * 0.35;
          d[i + 2] = copy[i + 2] * 0.35;
          break;
        }
      }
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cache.set(cacheKey, tex);
  return tex;
}

/**
 * Create a billboard sprite mesh for an entity.
 */
export function createEntitySprite(key, colorHex, kind, width, height, emissive = 0) {
  const tex = entityTexture(key, colorHex, kind, emissive);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.15,
    depthWrite: true,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(width * 1.35, height * 1.15, 1);
  sprite.center.set(0.5, 0);
  return sprite;
}

export function kindFromEnemyDef(def) {
  if (def.boss) return "boss";
  if (def.shape === "eye") return "eye";
  if (def.shape === "sphere" && def.ai === "slime") return "slime";
  if (def.flying || def.ai === "flyer") return "flyer";
  return "humanoid";
}
