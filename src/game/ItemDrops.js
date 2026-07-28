import * as THREE from "three";
import { ITEMS } from "./items.js";
import { itemIconTexture } from "./ItemIcons.js";

/**
 * World item pickups — textured billboard sprites + magnet pickup.
 */
export class ItemDropSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    /** @type {Drop[]} */
    this.drops = [];
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {string} itemId
   * @param {number} [count]
   */
  spawn(x, y, z, itemId, count = 1) {
    if (!ITEMS[itemId] || count <= 0) return;
    const tex = itemIconTexture(itemId);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: false,
    });
    const mesh = new THREE.Sprite(mat);
    mesh.scale.set(0.55, 0.55, 0.55);
    mesh.position.set(x, y, z);
    this.group.add(mesh);
    this.drops.push({
      mesh,
      itemId,
      count,
      pos: new THREE.Vector3(x, y, z),
      vel: new THREE.Vector3((Math.random() - 0.5) * 3, 4 + Math.random() * 2, (Math.random() - 0.5) * 3),
      life: 120,
      age: 0,
    });
  }

  /**
   * @param {number} dt
   * @param {import('./Player.js').Player} player
   * @param {object} game
   */
  update(dt, player, game) {
    const world = game.world;
    for (const d of this.drops) {
      d.age += dt;
      d.life -= dt;
      d.vel.y -= 18 * dt;
      if (d.vel.y < -20) d.vel.y = -20;

      const nextY = d.pos.y + d.vel.y * dt;
      if (world.isSolidAt(d.pos.x, nextY, d.pos.z) && d.vel.y < 0) {
        d.vel.y = 0;
        d.vel.x *= 0.85;
        d.vel.z *= 0.85;
      } else {
        d.pos.y = nextY;
      }
      d.pos.x += d.vel.x * dt;
      d.pos.z += d.vel.z * dt;

      if (d.age > 0.4) {
        const to = player.pos.clone();
        to.y += 0.9;
        const dist = d.pos.distanceTo(to);
        if (dist < 2.8) {
          const dir = to.sub(d.pos).normalize();
          d.pos.addScaledVector(dir, 12 * dt);
        }
        if (dist < 1.1) {
          const added = player.inventory.add(d.itemId, d.count);
          if (added > 0) {
            game.audio.play("pickup");
            if (added < d.count) {
              d.count -= added;
            } else {
              d.life = 0;
            }
          }
        }
      }

      d.mesh.position.copy(d.pos);
      d.mesh.position.y += Math.sin(d.age * 4) * 0.06;
      // face camera automatically (sprite)
      const pulse = 0.5 + Math.sin(d.age * 3) * 0.05;
      d.mesh.scale.set(pulse, pulse, pulse);
    }

    this.drops = this.drops.filter((d) => {
      if (d.life <= 0) {
        this.group.remove(d.mesh);
        d.mesh.material.dispose();
        return false;
      }
      return true;
    });
  }

  clear() {
    for (const d of this.drops) {
      this.group.remove(d.mesh);
      d.mesh.material.dispose();
    }
    this.drops = [];
  }
}

/**
 * @typedef {object} Drop
 * @property {THREE.Sprite} mesh
 * @property {string} itemId
 * @property {number} count
 * @property {THREE.Vector3} pos
 * @property {THREE.Vector3} vel
 * @property {number} life
 * @property {number} age
 */
