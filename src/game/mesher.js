import * as THREE from "three";
import { CHUNK_SIZE, CHUNK_HEIGHT, FACE_VERTS, FACE_SHADE } from "./constants.js";
import { BlockId, isTransparent, BLOCKS } from "./blocks.js";
import { faceUVs } from "./BlockTextures.js";

/**
 * Build a BufferGeometry for a chunk: face culling, AO, texture UVs, shade colors.
 * Special non-cube meshes: torch, 2-tall doors, furniture.
 * @param {object} chunk
 * @param {(x:number,y:number,z:number)=>number} getBlock local chunk coords
 * @param {{ isDoorOpen?: Function, getDoorFacing?: Function }} [opts]
 */
export function meshChunk(chunk, getBlock, opts = {}) {
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const indices = [];
  let v = 0;
  const isDoorOpen = opts.isDoorOpen || (() => false);
  const getDoorFacing = opts.getDoorFacing || (() => 0);

  const pushQuad = (verts, nx, ny, nz, shade, uvFace, lightBoost = 1) => {
    for (let i = 0; i < 4; i++) {
      const p = verts[i];
      positions.push(p[0], p[1], p[2]);
      normals.push(nx, ny, nz);
      const c = Math.min(1, shade * lightBoost);
      colors.push(c, c, c);
      uvs.push(uvFace[i][0], uvFace[i][1]);
    }
    indices.push(v, v + 1, v + 2, v, v + 2, v + 3);
    v += 4;
  };

  const ao = (x, y, z, dx, dy, dz, ux, uy, uz, vx, vy, vz) => {
    const s1 = !isTransparent(getBlock(x + dx + ux, y + dy + uy, z + dz + uz)) ? 1 : 0;
    const s2 = !isTransparent(getBlock(x + dx + vx, y + dy + vy, z + dz + vz)) ? 1 : 0;
    const c =
      s1 && s2
        ? 1
        : !isTransparent(getBlock(x + dx + ux + vx, y + dy + uy + vy, z + dz + uz + vz))
          ? 1
          : 0;
    return 1 - (s1 + s2 + c) * 0.12;
  };

  for (let y = 0; y < CHUNK_HEIGHT; y++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const id = getBlock(x, y, z);
        if (id === BlockId.AIR) continue;
        const def = BLOCKS[id];
        if (!def) continue;

        if (id === BlockId.TORCH) {
          meshTorch(x, y, z, id, pushQuad);
          continue;
        }

        if (id === BlockId.DOOR) {
          // only mesh from bottom half of the stack
          if (getBlock(x, y - 1, z) === BlockId.DOOR) continue;
          meshDoor(x, y, z, id, getBlock, pushQuad, isDoorOpen(x, y, z), getDoorFacing(x, y, z));
          continue;
        }

        if (id === BlockId.CHAIR) {
          meshChair(x, y, z, id, pushQuad);
          continue;
        }
        if (id === BlockId.TABLE || id === BlockId.BENCH) {
          meshTable(x, y, z, id, pushQuad, id === BlockId.BENCH);
          continue;
        }
        if (id === BlockId.BED) {
          meshBed(x, y, z, id, pushQuad);
          continue;
        }
        if (id === BlockId.PLATFORM) {
          meshPlatform(x, y, z, id, pushQuad);
          continue;
        }
        if (id === BlockId.ANVIL) {
          meshAnvil(x, y, z, id, pushQuad);
          continue;
        }
        if (id === BlockId.CHEST) {
          meshChest(x, y, z, id, pushQuad);
          continue;
        }

        for (let f = 0; f < 6; f++) {
          const nx = f === 0 ? 1 : f === 1 ? -1 : 0;
          const ny = f === 2 ? 1 : f === 3 ? -1 : 0;
          const nz = f === 4 ? 1 : f === 5 ? -1 : 0;
          const neighbor = getBlock(x + nx, y + ny, z + nz);
          if (!shouldDrawFace(id, neighbor)) continue;

          const face = FACE_VERTS[f];
          const shade = FACE_SHADE[f];
          const lightBoost = def.light ? 1.25 : 1;
          const uvFace = faceUVs(id, f);

          for (let i = 0; i < 4; i++) {
            const p = face[i];
            positions.push(x + p[0], y + p[1], z + p[2]);
            normals.push(nx, ny, nz);

            const px = p[0] === 1 ? 1 : -1;
            const py = p[1] === 1 ? 1 : -1;
            const pz = p[2] === 1 ? 1 : -1;
            let a = 1;
            if (f === 0 || f === 1) {
              a = ao(x, y, z, nx, 0, 0, 0, py, 0, 0, 0, pz);
            } else if (f === 2 || f === 3) {
              a = ao(x, y, z, 0, ny, 0, px, 0, 0, 0, 0, pz);
            } else {
              a = ao(x, y, z, 0, 0, nz, px, 0, 0, 0, py, 0);
            }

            const m = shade * a * lightBoost;
            const n = 0.96 + ((x * 73 + y * 37 + z * 19 + f * 5) % 11) * 0.003;
            const c = Math.min(1, m * n);
            colors.push(c, c, c);

            const uv = uvFace[i];
            uvs.push(uv[0], uv[1]);
          }

          indices.push(v, v + 1, v + 2, v, v + 2, v + 3);
          v += 4;
        }
      }
    }
  }

  if (positions.length === 0) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}

/** Cross-shaped torch standing on block center */
function meshTorch(x, y, z, id, pushQuad) {
  const uv = faceUVs(id, 0);
  const uv2 = faceUVs(id, 4);
  // half-pixel inset so it sits in cell
  const t = 0.12; // half thickness
  const h0 = 0.02;
  const h1 = 0.92;
  // plane facing X (spans Z)
  pushQuad(
    [
      [x + 0.5, y + h0, z + 0.5 - t],
      [x + 0.5, y + h1, z + 0.5 - t],
      [x + 0.5, y + h1, z + 0.5 + t],
      [x + 0.5, y + h0, z + 0.5 + t],
    ],
    1,
    0,
    0,
    1.15,
    uv,
    1.3
  );
  pushQuad(
    [
      [x + 0.5, y + h0, z + 0.5 + t],
      [x + 0.5, y + h1, z + 0.5 + t],
      [x + 0.5, y + h1, z + 0.5 - t],
      [x + 0.5, y + h0, z + 0.5 - t],
    ],
    -1,
    0,
    0,
    1.05,
    uv,
    1.3
  );
  // plane facing Z (spans X)
  pushQuad(
    [
      [x + 0.5 - t, y + h0, z + 0.5],
      [x + 0.5 - t, y + h1, z + 0.5],
      [x + 0.5 + t, y + h1, z + 0.5],
      [x + 0.5 + t, y + h0, z + 0.5],
    ],
    0,
    0,
    1,
    1.1,
    uv2,
    1.3
  );
  pushQuad(
    [
      [x + 0.5 + t, y + h0, z + 0.5],
      [x + 0.5 + t, y + h1, z + 0.5],
      [x + 0.5 - t, y + h1, z + 0.5],
      [x + 0.5 - t, y + h0, z + 0.5],
    ],
    0,
    0,
    -1,
    1.0,
    uv2,
    1.3
  );
}

/**
 * 2-block-tall thin door panel. Closed fills the doorway; open swings 90°.
 * facing: 0 = panel in XY (normal ±Z), 1 = panel in ZY (normal ±X), …
 */
function meshDoor(x, y, z, id, getBlock, pushQuad, open, facing) {
  // infer facing from walls if not set: panel perpendicular to open corridor
  let f = facing | 0;
  if (f === 0 && !open) {
    const wallX =
      !isTransparent(getBlock(x + 1, y, z)) || !isTransparent(getBlock(x - 1, y, z));
    const wallZ =
      !isTransparent(getBlock(x, y, z + 1)) || !isTransparent(getBlock(x, y, z - 1));
    if (wallX && !wallZ) f = 0; // walls on X → door faces Z
    else if (wallZ && !wallX) f = 1;
  }

  const hasTop = getBlock(x, y + 1, z) === BlockId.DOOR;
  const h = hasTop ? 2 : 1;
  const t = 0.07; // half thickness
  const uvBot = faceUVs(id, 0);
  const uvTop = faceUVs(id, 1);

  // closed: centered in cell; open: hinged to left edge and rotated into room
  if (!open) {
    if (f === 0 || f === 2) {
      // panel faces Z
      const zc = z + 0.5;
      pushDoorPanel(pushQuad, x + 0.02, x + 0.98, y, y + h, zc - t, zc + t, true, uvBot, uvTop, h);
    } else {
      const xc = x + 0.5;
      pushDoorPanel(pushQuad, xc - t, xc + t, y, y + h, z + 0.02, z + 0.98, false, uvBot, uvTop, h);
    }
  } else {
    // open: swing to the side (hinge on min-X or min-Z edge)
    if (f === 0 || f === 2) {
      // was facing Z, open into +X half of cell as thin slab along X wall
      const xc = x + 0.08;
      pushDoorPanel(pushQuad, xc - t, xc + t, y, y + h, z + 0.02, z + 0.98, false, uvBot, uvTop, h);
    } else {
      const zc = z + 0.08;
      pushDoorPanel(pushQuad, x + 0.02, x + 0.98, y, y + h, zc - t, zc + t, true, uvBot, uvTop, h);
    }
  }
}

/** Two-sided vertical door panel spanning [x0,x1]×[y0,y1]×[z0,z1] thin axis */
function pushDoorPanel(pushQuad, x0, x1, y0, y1, z0, z1, thinZ, uvBot, uvTop, h) {
  const mid = y0 + (y1 - y0) * 0.5;
  // bottom half UV
  const yA0 = y0;
  const yA1 = h > 1 ? mid : y1;
  // top half UV
  const yB0 = h > 1 ? mid : y1;
  const yB1 = y1;

  const emit = (ya, yb, uv) => {
    if (thinZ) {
      pushQuad(
        [
          [x0, ya, z1],
          [x0, yb, z1],
          [x1, yb, z1],
          [x1, ya, z1],
        ],
        0,
        0,
        1,
        1.05,
        uv,
        1
      );
      pushQuad(
        [
          [x1, ya, z0],
          [x1, yb, z0],
          [x0, yb, z0],
          [x0, ya, z0],
        ],
        0,
        0,
        -1,
        0.92,
        uv,
        1
      );
    } else {
      pushQuad(
        [
          [x1, ya, z0],
          [x1, yb, z0],
          [x1, yb, z1],
          [x1, ya, z1],
        ],
        1,
        0,
        0,
        1.05,
        uv,
        1
      );
      pushQuad(
        [
          [x0, ya, z1],
          [x0, yb, z1],
          [x0, yb, z0],
          [x0, ya, z0],
        ],
        -1,
        0,
        0,
        0.92,
        uv,
        1
      );
    }
  };
  emit(yA0, yA1, uvBot);
  if (h > 1) emit(yB0, yB1, uvTop);
}

function meshChair(x, y, z, id, pushQuad) {
  const uv = faceUVs(id, 0);
  const seatY = y + 0.45;
  // seat
  pushBox(pushQuad, x + 0.18, seatY, z + 0.18, x + 0.82, y + 0.55, z + 0.82, uv, 1);
  // backrest
  pushBox(pushQuad, x + 0.18, seatY, z + 0.7, x + 0.82, y + 1.05, z + 0.88, uv, 0.95);
  // legs
  const leg = 0.1;
  for (const [lx, lz] of [
    [0.22, 0.22],
    [0.68, 0.22],
    [0.22, 0.68],
    [0.68, 0.68],
  ]) {
    pushBox(pushQuad, x + lx, y, z + lz, x + lx + leg, seatY, z + lz + leg, uv, 0.85);
  }
}

function meshTable(x, y, z, id, pushQuad, bench = false) {
  const uv = faceUVs(id, 0);
  const topY = bench ? y + 0.42 : y + 0.72;
  const inset = bench ? 0.08 : 0.06;
  pushBox(pushQuad, x + inset, topY, z + inset, x + 1 - inset, topY + 0.1, z + 1 - inset, uv, 1.05);
  const leg = 0.1;
  const ly1 = topY;
  for (const [lx, lz] of [
    [0.12, 0.12],
    [0.78, 0.12],
    [0.12, 0.78],
    [0.78, 0.78],
  ]) {
    pushBox(pushQuad, x + lx, y, z + lz, x + lx + leg, ly1, z + lz + leg, uv, 0.85);
  }
}

function meshBed(x, y, z, id, pushQuad) {
  const uv = faceUVs(id, 0);
  const uvTop = faceUVs(id, 1);
  // mattress
  pushBox(pushQuad, x + 0.05, y, z + 0.05, x + 0.95, y + 0.35, z + 0.95, uv, 1);
  // pillow
  pushBox(pushQuad, x + 0.1, y + 0.35, z + 0.55, x + 0.9, y + 0.48, z + 0.9, uvTop, 1.1);
  // headboard
  pushBox(pushQuad, x + 0.05, y, z + 0.85, x + 0.95, y + 0.75, z + 0.98, uv, 0.9);
}

function meshPlatform(x, y, z, id, pushQuad) {
  const uv = faceUVs(id, 1);
  pushBox(pushQuad, x, y + 0.85, z, x + 1, y + 1, z + 1, uv, 1);
}

function meshAnvil(x, y, z, id, pushQuad) {
  const uv = faceUVs(id, 0);
  pushBox(pushQuad, x + 0.2, y, z + 0.25, x + 0.8, y + 0.25, z + 0.75, uv, 0.9);
  pushBox(pushQuad, x + 0.3, y + 0.25, z + 0.35, x + 0.7, y + 0.45, z + 0.65, uv, 0.95);
  pushBox(pushQuad, x + 0.1, y + 0.45, z + 0.28, x + 0.9, y + 0.7, z + 0.72, uv, 1.05);
}

function meshChest(x, y, z, id, pushQuad) {
  const uv = faceUVs(id, 0);
  const uvTop = faceUVs(id, 1);
  pushBox(pushQuad, x + 0.08, y, z + 0.12, x + 0.92, y + 0.7, z + 0.88, uv, 1);
  pushBox(pushQuad, x + 0.08, y + 0.7, z + 0.12, x + 0.92, y + 0.82, z + 0.88, uvTop, 1.05);
  // latch
  pushBox(pushQuad, x + 0.44, y + 0.35, z + 0.05, x + 0.56, y + 0.5, z + 0.14, uvTop, 1.2);
}

/** Axis-aligned box as 6 quads (cheap furniture) */
function pushBox(pushQuad, x0, y0, z0, x1, y1, z1, uv, shade = 1) {
  // +y top
  pushQuad(
    [
      [x0, y1, z0],
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y1, z0],
    ],
    0,
    1,
    0,
    shade * 1.1,
    uv,
    1
  );
  // -y bottom
  pushQuad(
    [
      [x0, y0, z1],
      [x0, y0, z0],
      [x1, y0, z0],
      [x1, y0, z1],
    ],
    0,
    -1,
    0,
    shade * 0.7,
    uv,
    1
  );
  // +x
  pushQuad(
    [
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
      [x1, y0, z1],
    ],
    1,
    0,
    0,
    shade * 0.95,
    uv,
    1
  );
  // -x
  pushQuad(
    [
      [x0, y0, z1],
      [x0, y1, z1],
      [x0, y1, z0],
      [x0, y0, z0],
    ],
    -1,
    0,
    0,
    shade * 0.85,
    uv,
    1
  );
  // +z
  pushQuad(
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ],
    0,
    0,
    1,
    shade,
    uv,
    1
  );
  // -z
  pushQuad(
    [
      [x1, y0, z0],
      [x0, y0, z0],
      [x0, y1, z0],
      [x1, y1, z0],
    ],
    0,
    0,
    -1,
    shade * 0.9,
    uv,
    1
  );
}

function shouldDrawFace(id, neighbor) {
  if (neighbor === BlockId.AIR) return true;
  if (id === BlockId.WATER && neighbor === BlockId.WATER) return false;
  if (neighbor === BlockId.WATER && id !== BlockId.WATER) return true;
  // furniture / torch / door never occlude full faces
  if (
    neighbor === BlockId.TORCH ||
    neighbor === BlockId.DOOR ||
    neighbor === BlockId.CHAIR ||
    neighbor === BlockId.TABLE ||
    neighbor === BlockId.BENCH ||
    neighbor === BlockId.BED ||
    neighbor === BlockId.PLATFORM ||
    neighbor === BlockId.ANVIL ||
    neighbor === BlockId.CHEST
  ) {
    return true;
  }
  if (isTransparent(neighbor) && neighbor !== id) return true;
  if (id === BlockId.LEAVES && neighbor === BlockId.LEAVES) return false;
  if (isTransparent(id) && !isTransparent(neighbor)) return false;
  if (!isTransparent(neighbor)) return false;
  return neighbor !== id;
}
