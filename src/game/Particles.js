import * as THREE from "three";

/**
 * Soft sprite particles — block break dust, hits, sparks.
 */
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this._tex = makeDotTexture();
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number[]|number|string} color
   * @param {number} [count]
   * @param {{ mode?: 'dust'|'spark'|'heal'|'blood' }} [opts]
   */
  burst(x, y, z, color, count = 8, opts = {}) {
    const c = Array.isArray(color)
      ? new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255)
      : new THREE.Color(color);
    const mode = opts.mode || "dust";
    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: this._tex,
        color: c,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: mode === "spark" || mode === "heal" ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      const mesh = new THREE.Sprite(mat);
      const s = mode === "spark" ? 0.08 + Math.random() * 0.1 : 0.1 + Math.random() * 0.14;
      mesh.scale.set(s, s, s);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);
      const speed = mode === "spark" ? 8 : 5;
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * speed,
          Math.random() * speed * 0.8 + (mode === "heal" ? 2 : 1),
          (Math.random() - 0.5) * speed
        ),
        life: 0.35 + Math.random() * 0.45,
        maxLife: 0.8,
        gravity: mode === "spark" ? 6 : 14,
        spin: (Math.random() - 0.5) * 4,
      });
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.vel.y -= p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      const a = Math.max(0, p.life / p.maxLife);
      p.mesh.material.opacity = a;
      const s = Math.max(0.04, a * 0.2);
      p.mesh.scale.set(s, s, s);
      p.mesh.material.rotation += p.spin * dt;
    }
    this.particles = this.particles.filter((p) => {
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.material.dispose();
        return false;
      }
      return true;
    });
  }
}

function makeDotTexture() {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}
