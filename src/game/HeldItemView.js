/**
 * First-person held item + arm viewmodel with walk bob and swing.
 * Compact Minecraft-style arm — no giant blue cube.
 */
import * as THREE from "three";
import { ITEMS } from "./items.js";
import { itemIconTexture } from "./ItemIcons.js";

export class HeldItemView {
  /**
   * @param {THREE.Camera} camera
   */
  constructor(camera) {
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.name = "heldItem";
    camera.add(this.group);

    // Forearm (skin) — slim box so it doesn't dominate the view
    const skin = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
    const sleeve = new THREE.MeshLambertMaterial({ color: 0x4a6741 });
    this.arm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.07), skin);
    this.sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.09), sleeve);
    this.sleeve.position.y = 0.1;
    this.arm.add(this.sleeve);
    // hand
    this.hand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.09), skin);
    this.hand.position.set(0, -0.12, 0.02);
    this.arm.add(this.hand);
    this.group.add(this.arm);

    this.itemPivot = new THREE.Group();
    this.group.add(this.itemPivot);
    this.itemMesh = null;
    this._currentId = null;
    this.swing = 0;
    this.bob = 0;
    this.visible = true;

    this._rest();
  }

  _rest() {
    // bottom-right corner, modest FOV footprint
    this.group.position.set(0.32, -0.28, -0.42);
    this.group.rotation.set(0.12, -0.45, 0.08);
    this.arm.position.set(0.04, -0.02, 0.04);
    this.arm.rotation.set(0.55, 0.15, -0.25);
    this.itemPivot.position.set(0.0, 0.02, -0.06);
    this.itemPivot.rotation.set(-0.55, 0.75, 0.15);
  }

  /**
   * @param {string|null} itemId
   */
  setItem(itemId) {
    if (itemId === this._currentId) return;
    this._currentId = itemId;
    if (this.itemMesh) {
      this.itemPivot.remove(this.itemMesh);
      this.itemMesh.geometry?.dispose?.();
      this.itemMesh.material?.dispose?.();
      this.itemMesh = null;
    }
    if (!itemId || !ITEMS[itemId]) return;

    const def = ITEMS[itemId];
    const tex = itemIconTexture(itemId);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.18,
      side: THREE.DoubleSide,
      depthTest: true,
    });

    // Size by item class
    let s = 0.26;
    if (def.tool || def.weapon === "melee") s = 0.32;
    else if (def.weapon === "ranged" || def.weapon === "magic" || def.weapon === "summon") s = 0.3;
    else if (def.place !== undefined && def.place !== null) s = 0.2;
    else if (def.potion || def.heal) s = 0.18;

    const geo = new THREE.PlaneGeometry(s, s);
    this.itemMesh = new THREE.Mesh(geo, mat);
    // tools hang slightly forward
    if (def.tool || def.weapon) {
      this.itemMesh.rotation.z = -0.35;
      this.itemMesh.position.set(0.04, 0.04, 0);
    }
    this.itemPivot.add(this.itemMesh);
  }

  /** Trigger attack/mine swing */
  punch() {
    this.swing = 1;
  }

  /**
   * @param {number} dt
   * @param {object} player
   * @param {boolean} moving
   * @param {boolean} punching
   */
  update(dt, player, moving, punching) {
    if (!this.visible || player?.dead) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    const id = player.inventory?.selectedItem?.id || null;
    this.setItem(id);

    if (punching && this.swing < 0.25) this.swing = 1;
    if (this.swing > 0) {
      this.swing = Math.max(0, this.swing - dt * 5.2);
    }

    if (moving) this.bob += dt * 11;
    else this.bob *= 0.88;

    const bobY = Math.sin(this.bob) * 0.014;
    const bobX = Math.cos(this.bob * 0.5) * 0.008;
    const t = this.swing > 0 ? 1 - this.swing : 0;
    // ease-out arc for swing
    const swingA = Math.sin(t * Math.PI) * (this.swing > 0 ? 1 : 0);

    this.group.position.set(0.32 + bobX, -0.28 + bobY - swingA * 0.06, -0.42 + swingA * 0.1);
    this.group.rotation.set(0.12 - swingA * 1.05, -0.45 + swingA * 0.55, 0.08 + swingA * 0.65);
    this.arm.rotation.set(0.55 - swingA * 1.35, 0.15, -0.25 + swingA * 0.45);
    this.itemPivot.rotation.set(-0.55 - swingA * 1.5, 0.75 + swingA * 0.9, 0.15);
  }

  dispose() {
    this.camera.remove(this.group);
    if (this.itemMesh) {
      this.itemMesh.geometry.dispose();
      this.itemMesh.material.dispose();
    }
    this.arm.geometry.dispose();
    this.arm.material.dispose();
    this.sleeve.geometry.dispose();
    this.sleeve.material.dispose();
    this.hand.geometry.dispose();
    this.hand.material.dispose();
  }
}
