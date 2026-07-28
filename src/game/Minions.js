/**
 * Summoner minions — follow player and attack nearby enemies.
 */
import * as THREE from "three";
import { createEntitySprite } from "./EntityArt.js";

export class MinionSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    /** @type {Minion[]} */
    this.minions = [];
    this.maxMinions = 1;
  }

  setSlots(n) {
    this.maxMinions = Math.max(1, Math.min(8, n | 0));
    while (this.minions.length > this.maxMinions) {
      this.despawnOne();
    }
  }

  /**
   * @param {string} type slime|hornet|shark|stardust
   * @param {number} damage
   */
  spawn(type, damage) {
    if (this.minions.length >= this.maxMinions) this.despawnOne();
    const colors = {
      slime: 0x74b9ff,
      hornet: 0xf1c40f,
      shark: 0x636e72,
      stardust: 0x81ecec,
    };
    const mesh = createEntitySprite(`minion_${type}`, colors[type] || 0x74b9ff, "minion", 0.55, 0.55, 0x112233);
    this.group.add(mesh);
    this.minions.push({
      type,
      damage,
      mesh,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      attackCd: 0,
    });
    return true;
  }

  despawnOne() {
    const m = this.minions.pop();
    if (!m) return;
    this.group.remove(m.mesh);
    // shared entity atlas textures — dispose material only
    m.mesh.material?.dispose?.();
  }

  clear() {
    while (this.minions.length) this.despawnOne();
  }

  /**
   * @param {number} dt
   * @param {object} player
   * @param {object} entities EntityManager
   * @param {object} game
   */
  update(dt, player, entities, game) {
    const enemies = entities.entities.filter((e) => !e.dead && !e.boss);
    this.minions.forEach((m, i) => {
      m.attackCd = Math.max(0, m.attackCd - dt);
      const orbit = (i / Math.max(1, this.minions.length)) * Math.PI * 2 + performance.now() * 0.001;
      const target = player.pos.clone();
      target.x += Math.cos(orbit) * 2.2;
      target.z += Math.sin(orbit) * 2.2;
      target.y += 1.2 + Math.sin(performance.now() * 0.003 + i) * 0.3;

      // chase nearest enemy if close
      let focus = null;
      let best = 14;
      for (const e of enemies) {
        const d = e.pos.distanceTo(player.pos);
        if (d < best) {
          best = d;
          focus = e;
        }
      }
      if (focus) {
        target.copy(focus.pos);
        target.y += focus.height * 0.5;
      }

      const dir = target.sub(m.pos);
      const len = dir.length() || 1;
      m.vel.lerp(dir.multiplyScalar(12 / len), 1 - Math.pow(0.05, dt));
      m.pos.addScaledVector(m.vel, dt);
      m.mesh.position.copy(m.pos);

      if (focus && m.attackCd <= 0 && m.pos.distanceTo(focus.pos) < 2.2) {
        m.attackCd = 0.45;
        focus.hurt(m.damage, focus.pos.clone().sub(m.pos).normalize(), 2, game);
        game.particles?.burst(focus.pos.x, focus.pos.y + 0.5, focus.pos.z, [120, 200, 255], 4);
      }
    });
  }
}

/**
 * @typedef {object} Minion
 * @property {string} type
 * @property {number} damage
 * @property {THREE.Mesh} mesh
 * @property {THREE.Vector3} pos
 * @property {THREE.Vector3} vel
 * @property {number} attackCd
 */
