/**
 * Minecraft-style multi-stage block break crack overlay textures.
 */
import * as THREE from "three";

const STAGES = 10;
/** @type {THREE.CanvasTexture[]} */
let stageTextures = null;

function paintCrack(stage) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  // crack density grows with stage
  const density = 4 + stage * 3;
  const seed = stage * 97 + 13;
  ctx.strokeStyle = `rgba(0,0,0,${0.35 + stage * 0.06})`;
  ctx.lineWidth = 1.5 + stage * 0.15;
  ctx.lineCap = "round";

  function rnd(i) {
    let n = (i * 374761393 + seed * 668265263) | 0;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967296;
  }

  // radiating cracks from random centers
  const centers = 1 + Math.floor(stage / 3);
  for (let c = 0; c < centers; c++) {
    const cx = 12 + rnd(c * 3) * 40;
    const cy = 12 + rnd(c * 3 + 1) * 40;
    const branches = density;
    for (let b = 0; b < branches; b++) {
      const ang = (b / branches) * Math.PI * 2 + rnd(b + c * 20) * 0.6;
      let x = cx;
      let y = cy;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const segs = 3 + ((rnd(b + 50) * 4) | 0);
      for (let s = 0; s < segs; s++) {
        const len = 4 + rnd(s + b * 7) * (6 + stage);
        const a2 = ang + (rnd(s + 90) - 0.5) * 0.9;
        x += Math.cos(a2) * len;
        y += Math.sin(a2) * len;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // edge chips at high stages
  if (stage >= 5) {
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    for (let i = 0; i < stage; i++) {
      const x = rnd(i + 200) * size;
      const y = rnd(i + 300) * size;
      ctx.fillRect(x, y, 2 + rnd(i) * 3, 2 + rnd(i + 1) * 3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export function getBreakStageTextures() {
  if (!stageTextures) {
    stageTextures = [];
    for (let i = 0; i < STAGES; i++) stageTextures.push(paintCrack(i));
  }
  return stageTextures;
}

/**
 * Create a crack overlay mesh for the scene.
 * @returns {THREE.Mesh}
 */
export function createBreakOverlay() {
  const texs = getBreakStageTextures();
  const mat = new THREE.MeshBasicMaterial({
    map: texs[0],
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.01, 1.01, 1.01), mat);
  mesh.visible = false;
  mesh.userData.stageTextures = texs;
  return mesh;
}

/**
 * @param {THREE.Mesh} overlay
 * @param {number} progress 0..1
 */
export function setBreakProgress(overlay, progress) {
  if (!overlay) return;
  if (progress <= 0) {
    overlay.visible = false;
    return;
  }
  overlay.visible = true;
  const texs = overlay.userData.stageTextures || getBreakStageTextures();
  const idx = Math.min(texs.length - 1, Math.floor(progress * texs.length));
  if (overlay.material.map !== texs[idx]) {
    overlay.material.map = texs[idx];
    overlay.material.needsUpdate = true;
  }
  overlay.material.opacity = 0.55 + progress * 0.4;
}
