import * as THREE from "three";

/**
 * World-space floating damage / heal numbers (DOM-free, Three.js sprites via canvas textures).
 */
export class FloatingText {
  constructor(scene) {
    this.scene = scene;
    /** @type {{ mesh: THREE.Sprite, vel: THREE.Vector3, life: number }[]} */
    this.items = [];
    this._cache = new Map();
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {string} text
   * @param {string} [color]
   */
  spawn(x, y, z, text, color = "#ffffff") {
    const key = `${text}|${color}`;
    let mat = this._cache.get(key);
    if (!mat) {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, 128, 64);
      ctx.font = "bold 36px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.strokeText(text, 64, 32);
      ctx.fillStyle = color;
      ctx.fillText(text, 64, 32);
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthTest: true,
        depthWrite: false,
      });
      this._cache.set(key, mat);
    }

    const mesh = new THREE.Sprite(mat.clone());
    mesh.position.set(x, y, z);
    mesh.scale.set(1.2, 0.6, 1);
    this.scene.add(mesh);
    this.items.push({
      mesh,
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.8, 1.8 + Math.random(), (Math.random() - 0.5) * 0.8),
      life: 0.85,
    });
  }

  /** @param {number} dt */
  update(dt) {
    for (const it of this.items) {
      it.life -= dt;
      it.mesh.position.addScaledVector(it.vel, dt);
      it.vel.y -= 2 * dt;
      const a = Math.max(0, it.life / 0.85);
      it.mesh.material.opacity = a;
      it.mesh.scale.set(1.2 * (0.8 + a * 0.2), 0.6 * (0.8 + a * 0.2), 1);
    }
    this.items = this.items.filter((it) => {
      if (it.life <= 0) {
        this.scene.remove(it.mesh);
        it.mesh.material.dispose();
        return false;
      }
      return true;
    });
  }

  clear() {
    for (const it of this.items) {
      this.scene.remove(it.mesh);
      it.mesh.material.dispose();
    }
    this.items = [];
  }
}
