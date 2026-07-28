/**
 * Explored-chunk minimap renderer (canvas 2D overlay).
 */
import { BlockId } from "./blocks.js";

export class Minimap {
  constructor() {
    this.explored = new Map(); // "cx,cz" -> height color sample
    this.size = 140;
    this.canvas = null;
    this.ctx = null;
    this.visible = true;
  }

  ensureDom(root) {
    if (this.canvas) return;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.canvas.className = "minimap-canvas";
    this.canvas.style.cssText = `
      position:absolute; right:16px; top:96px; width:${this.size}px; height:${this.size}px;
      border:2px solid rgba(255,255,255,0.25); border-radius:8px;
      background:rgba(0,0,0,0.45); image-rendering:pixelated; pointer-events:none;
      box-shadow:0 4px 16px rgba(0,0,0,0.4);
    `;
    root.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
  }

  /**
   * @param {object} world
   * @param {object} player
   * @param {HTMLElement} uiRoot
   */
  update(world, player, uiRoot) {
    if (!this.visible) {
      if (this.canvas) this.canvas.style.display = "none";
      return;
    }
    this.ensureDom(uiRoot);
    this.canvas.style.display = "";

    const pcx = world.chunkCoord(player.pos.x);
    const pcz = world.chunkCoord(player.pos.z);
    for (let dz = -6; dz <= 6; dz++) {
      for (let dx = -6; dx <= 6; dx++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        const k = `${cx},${cz}`;
        if (this.explored.has(k)) continue;
        const chunk = world.getChunk(cx, cz);
        if (!chunk) continue;
        // sample center column surface color
        const lx = 8;
        const lz = 8;
        let color = "#1a3a2a";
        for (let y = 95; y >= 0; y--) {
          const id = chunk.data[y * 16 * 16 + lz * 16 + lx];
          if (id && id !== BlockId.AIR && id !== BlockId.WATER) {
            color = biomeColor(id);
            break;
          }
          if (id === BlockId.WATER) {
            color = "#1e5f9a";
            break;
          }
        }
        this.explored.set(k, color);
      }
    }

    const ctx = this.ctx;
    const s = this.size;
    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = "#0a1620";
    ctx.fillRect(0, 0, s, s);

    const scale = 4;
    const half = s / 2;
    for (const [k, color] of this.explored) {
      const [cx, cz] = k.split(",").map(Number);
      const px = half + (cx - pcx) * scale;
      const py = half + (cz - pcz) * scale;
      if (px < -4 || py < -4 || px > s || py > s) continue;
      ctx.fillStyle = color;
      ctx.fillRect(px, py, scale - 0.5, scale - 0.5);
    }

    // player
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(half, half, 3, 0, Math.PI * 2);
    ctx.fill();
    // facing
    ctx.strokeStyle = "#ffeaa7";
    ctx.beginPath();
    ctx.moveTo(half, half);
    ctx.lineTo(half - Math.sin(player.yaw) * 10, half - Math.cos(player.yaw) * 10);
    ctx.stroke();

    // border label
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "10px sans-serif";
    ctx.fillText("MAP", 6, 12);
  }

  serialize() {
    return [...this.explored.entries()];
  }

  deserialize(entries) {
    this.explored = new Map(Array.isArray(entries) ? entries : []);
  }
}

function biomeColor(id) {
  const map = {
    1: "#3d8c40",
    2: "#8b5a2b",
    3: "#6a7078",
    4: "#d4b56a",
    14: "#e8f0ff",
    18: "#5b3f9a",
    19: "#a03030",
    28: "#3a3530",
    30: "#2d6a3a", // jungle grass if we add
  };
  return map[id] || "#445566";
}
