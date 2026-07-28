import * as THREE from "three";
import { DAY_LENGTH, BLOOD_MOON_CHANCE } from "./constants.js";

export class DayNight {
  constructor(scene) {
    this.scene = scene;
    this.time = 0.25;
    this.paused = false;
    this.bloodMoon = false;
    this._wasNight = false;
    /** @type {((isBlood: boolean) => void) | null} */
    this.onNightStart = null;
    /** @type {(() => void) | null} */
    this.onDayStart = null;

    this.sun = new THREE.DirectionalLight(0xfff4e0, 1.45);
    this.sun.position.set(50, 80, 30);
    scene.add(this.sun);

    // brighter ambient so textured blocks read clearly (not muddy grey)
    this.ambient = new THREE.AmbientLight(0xc5d8e8, 0.72);
    scene.add(this.ambient);

    this.hemi = new THREE.HemisphereLight(0xb8e0ff, 0x5a7a45, 0.55);
    scene.add(this.hemi);

    this.moon = new THREE.DirectionalLight(0x8899cc, 0);
    this.moon.position.set(-40, 60, -20);
    scene.add(this.moon);

    // Visual sun / moon discs
    this.celestials = new THREE.Group();
    scene.add(this.celestials);
    this.sunMesh = makeDisc(0xfff0a0, 6, 1.2);
    this.moonMesh = makeDisc(0xe8eef8, 5, 0.95);
    this.celestials.add(this.sunMesh);
    this.celestials.add(this.moonMesh);

    // Starfield (visible at night)
    this.stars = makeStarfield(220);
    scene.add(this.stars);
  }

  get isNight() {
    return this.time > 0.78 || this.time < 0.22;
  }

  get isDay() {
    return !this.isNight;
  }

  get label() {
    const h = Math.floor(this.time * 24);
    const m = Math.floor((this.time * 24 - h) * 60);
    let phase = this.isNight ? "Night" : this.time < 0.35 ? "Morning" : this.time < 0.6 ? "Day" : "Evening";
    if (this.bloodMoon && this.isNight) phase = "Blood Moon";
    return `${phase}  ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  update(dt, playerPos) {
    if (!this.paused) {
      this.time = (this.time + dt / DAY_LENGTH) % 1;
    }

    const night = this.isNight;
    if (night && !this._wasNight) {
      // night begins
      if (Math.random() < BLOOD_MOON_CHANCE) {
        this.bloodMoon = true;
        this.onNightStart?.(true);
      } else {
        this.bloodMoon = false;
        this.onNightStart?.(false);
      }
    }
    if (!night && this._wasNight) {
      if (this.bloodMoon) this.onDayStart?.();
      this.bloodMoon = false;
    }
    this._wasNight = night;

    const px = playerPos?.x || 0;
    const py = playerPos?.y || 40;
    const pz = playerPos?.z || 0;

    const angle = (this.time - 0.25) * Math.PI * 2;
    const sunX = Math.cos(angle) * 100;
    const sunY = Math.sin(angle) * 80;
    this.sun.position.set(px + sunX, Math.max(10, sunY), pz + 40);
    this.moon.position.set(px - sunX, Math.max(10, -sunY), pz - 40);

    // Discs far from player along light directions
    this.sunMesh.position.set(px + sunX * 1.4, Math.max(20, sunY * 1.4) + py * 0.05, pz + 55);
    this.moonMesh.position.set(px - sunX * 1.4, Math.max(20, -sunY * 1.4) + py * 0.05, pz - 55);
    this.stars.position.set(px, py + 20, pz);

    const elev = Math.sin((this.time - 0.25) * Math.PI * 2);
    const dayAmt = THREE.MathUtils.clamp(elev * 0.5 + 0.5, 0, 1);
    const smooth = dayAmt * dayAmt * (3 - 2 * dayAmt);

    this.sun.intensity = 0.25 + smooth * 1.25;
    this.moon.intensity = (1 - smooth) * (this.bloodMoon ? 0.55 : 0.35);
    this.ambient.intensity = 0.28 + smooth * 0.5;
    this.hemi.intensity = 0.2 + smooth * 0.4;

    this.sunMesh.visible = smooth > 0.05;
    this.sunMesh.material.opacity = THREE.MathUtils.clamp(smooth * 1.2, 0, 0.95);
    this.moonMesh.visible = smooth < 0.85;
    this.moonMesh.material.opacity = THREE.MathUtils.clamp((1 - smooth) * 1.1, 0, 0.9);
    this.moonMesh.material.color.set(this.bloodMoon ? 0xff5555 : 0xe8eef8);
    this.stars.material.opacity = THREE.MathUtils.clamp((1 - smooth) * 0.95, 0, 0.9);
    this.stars.visible = smooth < 0.75;

    const daySky = new THREE.Color(0x6eb6ff);
    const duskSky = new THREE.Color(0xff7f50);
    const nightSky = new THREE.Color(0x0a0e1a);
    const bloodSky = new THREE.Color(0x4a0a12);
    let sky;
    if (this.bloodMoon && this.isNight) {
      sky = bloodSky;
    } else if (this.time > 0.72 && this.time < 0.82) {
      const t = (this.time - 0.72) / 0.1;
      sky = duskSky.clone().lerp(nightSky, t);
    } else if (this.time > 0.18 && this.time < 0.28) {
      const t = (this.time - 0.18) / 0.1;
      sky = nightSky.clone().lerp(duskSky, t * 0.5).lerp(daySky, t);
    } else if (this.isNight) {
      sky = nightSky;
    } else {
      sky = daySky.clone().lerp(new THREE.Color(0x87ceeb), 0.4);
    }
    this.scene.background = sky;
    if (this.scene.fog) {
      this.scene.fog.color.copy(sky);
      // farther fog so forests / hills stay visible at render distance 6
      this.scene.fog.near = 55 + smooth * 20;
      this.scene.fog.far = 120 + smooth * 50;
    }

    this.sun.color.set(smooth > 0.3 ? 0xfff4e0 : 0xffaa77);
    this.moon.color.set(this.bloodMoon ? 0xff4444 : 0x8899cc);
  }
}

function makeDisc(color, size, opacity) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(size, size, 1);
  return s;
}

function makeStarfield(count) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 90 + Math.random() * 40;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.6 + 20;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.55,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}
