/**
 * Grappling hook physics helper.
 */
import * as THREE from "three";

export class Grapple {
  constructor() {
    this.active = false;
    this.anchor = new THREE.Vector3();
    this.length = 0;
    this.maxLength = 28;
  }

  /**
   * Fire hook along look dir until solid hit.
   * @param {object} player
   * @param {object} world
   * @param {THREE.Vector3} origin
   * @param {THREE.Vector3} dir
   */
  fire(player, world, origin, dir) {
    const hit = world.raycast(origin, dir, this.maxLength);
    if (!hit) return false;
    this.active = true;
    this.anchor.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
    this.length = origin.distanceTo(this.anchor);
    return true;
  }

  release() {
    this.active = false;
  }

  /**
   * Pull player toward anchor.
   * @param {object} player
   * @param {number} dt
   */
  update(player, _dt) {
    if (!this.active) return;
    const eye = player.pos.clone();
    eye.y += 1.2;
    const to = this.anchor.clone().sub(eye);
    const dist = to.length();
    if (dist < 1.2) {
      this.release();
      return;
    }
    to.normalize();
    const pull = 22;
    player.vel.x = to.x * pull;
    player.vel.y = to.y * pull * 0.85;
    player.vel.z = to.z * pull;
    // release if looking away and press again handled by player
    if (dist > this.maxLength + 2) this.release();
  }
}
