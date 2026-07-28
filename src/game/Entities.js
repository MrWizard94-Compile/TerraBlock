import * as THREE from "three";
import { GRAVITY, CHUNK_HEIGHT } from "./constants.js";
import { ENEMY_TYPES } from "./enemies.js";
import { createEntitySprite, kindFromEnemyDef } from "./EntityArt.js";

export { ENEMY_TYPES };

let nextId = 1;

export class EntityManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.entities = [];
    this.projectiles = [];
    this.group = new THREE.Group();
    scene.add(this.group);
    this.spawnTimer = 0;
    this.boss = null;
  }

  clear() {
    for (const e of this.entities) this.disposeEntity(e);
    for (const p of this.projectiles) this.disposeProjectile(p);
    this.entities = [];
    this.projectiles = [];
    this.boss = null;
  }

  disposeEntity(e) {
    if (e.mesh) {
      this.group.remove(e.mesh);
      const spr = e.mesh.userData?.sprite;
      if (spr) {
        // entity textures are cached globally — do not dispose the shared map
        spr.material?.dispose?.();
      }
      const sh = e.mesh.userData?.shadow;
      if (sh) {
        sh.geometry?.dispose?.();
        sh.material?.dispose?.();
      }
      e.mesh.geometry?.dispose?.();
      if (e.mesh.material?.dispose) e.mesh.material.dispose();
    }
    if (e.segments) {
      for (const s of e.segments) {
        this.group.remove(s.mesh);
        s.mesh.geometry?.dispose();
        s.mesh.material?.dispose();
      }
      e.segments = null;
    }
  }

  disposeProjectile(p) {
    if (p.mesh) {
      this.group.remove(p.mesh);
      // sprites share map texture; only dispose material
      p.mesh.material?.dispose?.();
      p.mesh.geometry?.dispose?.();
    }
  }

  hasBoss() {
    return this.boss && !this.boss.dead;
  }

  getBoss() {
    return this.hasBoss() ? this.boss : null;
  }

  spawnEnemy(type, x, y, z) {
    const def = ENEMY_TYPES[type];
    if (!def) return null;
    const mesh = createEnemyMesh(def);
    mesh.position.set(x, y, z);
    this.group.add(mesh);
    // difficulty scaling applied at spawn via world flag on game - patched after
    const e = {
      id: nextId++,
      type,
      pos: new THREE.Vector3(x, y, z),
      vel: new THREE.Vector3(),
      hp: def.hp,
      maxHp: def.hp,
      damage: def.damage,
      speed: def.speed,
      height: def.height,
      width: def.width,
      mesh,
      dead: false,
      hurtTime: 0,
      attackCd: 0,
      ai: def.ai,
      flying: def.flying || false,
      xp: def.xp || 1,
      drops: def.drops || [],
      boss: def.boss || false,
      phase: 0,
      age: 0,
      segments: null,
    };
    this.entities.push(e);
    if (def.boss) this.boss = e;
    return e;
  }

  spawnProjectile(opts) {
    const r = opts.radius || 0.15;
    const color = opts.color || 0xffffff;
    const mesh = createProjectileSprite(color, r);
    mesh.position.set(opts.x, opts.y, opts.z);
    this.group.add(mesh);
    const p = {
      pos: new THREE.Vector3(opts.x, opts.y, opts.z),
      vel: new THREE.Vector3(opts.vx, opts.vy, opts.vz),
      damage: opts.damage,
      knockback: opts.knockback || 2,
      friendly: opts.friendly,
      life: opts.life || 2,
      maxLife: opts.life || 2,
      mesh,
      radius: r,
      gravity: opts.gravity ?? 0,
      explode: opts.explode || 0,
      trail: opts.trail !== false,
    };
    this.projectiles.push(p);
    return p;
  }

  update(dt, player, game) {
    this.spawnTimer += dt;
    // Was 2.5s — felt like a slime rain. Surface day is sparse now.
    if (this.spawnTimer > 5.5) {
      this.spawnTimer = 0;
      this.tryNaturalSpawn(player, game);
    }

    for (const e of this.entities) {
      if (e.dead) continue;
      e.age += dt;
      e.hurtTime = Math.max(0, e.hurtTime - dt);
      e.attackCd = Math.max(0, e.attackCd - dt);
      this.updateAI(e, dt, player, game);
      this.applyPhysics(e, dt);
      if (e.mesh) {
        e.mesh.position.copy(e.pos);
        const spr = e.mesh.userData?.sprite || e.mesh;
        if (e.hurtTime > 0) {
          if (spr.material?.color) spr.material.color.setHex(0xff8888);
          if (spr.material) spr.material.opacity = 0.75;
        } else if (spr.material?.color) {
          spr.material.color.setHex(0xffffff);
          spr.material.opacity = 1;
        }
        // idle bob for flyers/slimes
        if (e.flying || e.ai === "slime") {
          const bob = Math.sin(e.age * 4 + e.id) * 0.08;
          if (spr.position) spr.position.y = bob;
        }
      }
    }

    // projectiles
    for (const p of this.projectiles) {
      p.life -= dt;
      p.vel.y -= (p.gravity || 0) * dt;
      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);
      // soft pulse + trail spark
      const lifeFrac = Math.max(0, p.life / (p.maxLife || 2));
      const base = (p.radius || 0.15) * 4;
      p.mesh.scale.setScalar(base * (0.75 + lifeFrac * 0.35));
      if (p.mesh.material) p.mesh.material.opacity = 0.55 + lifeFrac * 0.4;
      if (p.trail && Math.random() < dt * 18) {
        const col = p.mesh.material?.color;
        const rgb = col
          ? [(col.r * 255) | 0, (col.g * 255) | 0, (col.b * 255) | 0]
          : [255, 255, 255];
        game?.particles?.burst?.(p.pos.x, p.pos.y, p.pos.z, rgb, 1, { mode: "spark" });
      }

      if (this.world.isSolidAt(p.pos.x, p.pos.y, p.pos.z)) {
        if (p.explode) this.explodeAt(p.pos, p.explode, p.damage, game, p.friendly);
        p.life = 0;
        continue;
      }

      if (p.friendly) {
        for (const e of this.entities) {
          if (e.dead) continue;
          if (this.hitEntity(p.pos, p.radius, e)) {
            const dir = e.pos.clone().sub(p.pos).normalize();
            e.hurt(p.damage, dir, p.knockback, game);
            if (p.explode) this.explodeAt(p.pos, p.explode, p.damage, game, true);
            p.life = 0;
            break;
          }
        }
      } else {
        if (this.hitPlayer(p.pos, p.radius, player)) {
          player.hurt(p.damage, p.pos, game);
          p.life = 0;
        }
      }
      if (p.life <= 0 && p.explode && p.friendly) {
        this.explodeAt(p.pos, p.explode, p.damage, game, true);
      }
    }

    // cleanup
    this.entities = this.entities.filter((e) => {
      if (e.dead) {
        if (e === this.boss) this.boss = null;
        this.disposeEntity(e);
        return false;
      }
      // despawn far
      if (!e.boss && e.pos.distanceTo(player.pos) > 80) {
        this.disposeEntity(e);
        return false;
      }
      return true;
    });

    this.projectiles = this.projectiles.filter((p) => {
      if (p.life <= 0) {
        this.disposeProjectile(p);
        return false;
      }
      return true;
    });
  }

  hitEntity(pos, r, e) {
    const dx = pos.x - e.pos.x;
    const dy = pos.y - (e.pos.y + e.height * 0.5);
    const dz = pos.z - e.pos.z;
    const hw = e.width * 0.5 + r;
    const hh = e.height * 0.5 + r;
    return Math.abs(dx) < hw && Math.abs(dy) < hh && Math.abs(dz) < hw;
  }

  hitPlayer(pos, r, player) {
    const dx = pos.x - player.pos.x;
    const dy = pos.y - (player.pos.y + 0.85);
    const dz = pos.z - player.pos.z;
    return Math.abs(dx) < 0.4 + r && Math.abs(dy) < 0.9 + r && Math.abs(dz) < 0.4 + r;
  }

  applyPhysics(e, dt) {
    if (e.flying) {
      e.pos.addScaledVector(e.vel, dt);
      // soft collision
      if (this.world.isSolidAt(e.pos.x, e.pos.y, e.pos.z)) {
        e.pos.y += 0.2;
      }
      return;
    }

    e.vel.y -= GRAVITY * dt;
    if (e.vel.y < -30) e.vel.y = -30;

    for (const axis of ["x", "y", "z"]) {
      const next = e.pos[axis] + e.vel[axis] * dt;
      const test = e.pos.clone();
      test[axis] = next;
      if (!this.entityCollides(test, e)) {
        e.pos[axis] = next;
      } else {
        if (axis === "y") e.vel.y = 0;
        else e.vel[axis] = 0;
      }
    }
  }

  entityCollides(pos, e) {
    const hw = e.width * 0.5;
    const minX = pos.x - hw;
    const maxX = pos.x + hw;
    const minY = pos.y;
    const maxY = pos.y + e.height;
    const minZ = pos.z - hw;
    const maxZ = pos.z + hw;
    for (let y = Math.floor(minY); y <= Math.floor(maxY); y++) {
      for (let z = Math.floor(minZ); z <= Math.floor(maxZ); z++) {
        for (let x = Math.floor(minX); x <= Math.floor(maxX); x++) {
          if (this.world.isSolidAt(x, y, z)) return true;
        }
      }
    }
    return false;
  }

  updateAI(e, dt, player, game) {
    const toPlayer = player.pos.clone().sub(e.pos);
    const dist = toPlayer.length();
    const def = ENEMY_TYPES[e.type];

    if (e.ai === "slime") {
      if (dist < 28) {
        if (e.vel.y === 0 && Math.random() < dt * 1.2) {
          const dir = toPlayer.clone();
          dir.y = 0;
          dir.normalize();
          e.vel.x = dir.x * e.speed;
          e.vel.z = dir.z * e.speed;
          e.vel.y = 8 + Math.random() * 3;
        }
      }
      this.tryTouchDamage(e, player, game, 1.2);
    } else if (e.ai === "walker") {
      if (dist < 32) {
        const dir = toPlayer.clone();
        dir.y = 0;
        if (dir.lengthSq() > 0.01) dir.normalize();
        // slow approach — don't bullet-rush the player
        const chase = Math.min(1, dist / 8);
        e.vel.x = dir.x * e.speed * (0.55 + chase * 0.45);
        e.vel.z = dir.z * e.speed * (0.55 + chase * 0.45);
        // jump gaps / steps
        if (this.world.isSolidAt(e.pos.x + dir.x * 1.2, e.pos.y, e.pos.z + dir.z * 1.2) && e.vel.y === 0) {
          e.vel.y = 8.5;
        }
        // face player (sprite flip via scale if available)
        const spr = e.mesh?.userData?.sprite;
        if (spr) spr.scale.x = Math.abs(spr.scale.x) * (dir.x >= 0 ? 1 : -1);
      }
      this.tryTouchDamage(e, player, game, 0.95);
    } else if (e.ai === "flyer") {
      if (dist < 40) {
        const target = player.eyePosition();
        const dir = target.clone().sub(e.pos).normalize();
        e.vel.lerp(dir.multiplyScalar(e.speed), 1 - Math.pow(0.05, dt));
        if (e.attackCd <= 0 && dist < 22) {
          e.attackCd = def.attackRate || 1.8;
          const d = target.clone().sub(e.pos).normalize();
          this.spawnProjectile({
            x: e.pos.x,
            y: e.pos.y,
            z: e.pos.z,
            vx: d.x * 14,
            vy: d.y * 14,
            vz: d.z * 14,
            damage: e.damage,
            friendly: false,
            color: def.projColor || 0xff6b6b,
            life: 3,
            radius: 0.2,
          });
        }
      }
      this.tryTouchDamage(e, player, game, 1.0);
    } else if (e.ai === "boss_eye") {
      this.aiBossEye(e, dt, player, game);
    } else if (e.ai === "boss_slime") {
      this.aiBossSlime(e, dt, player, game);
    } else if (e.ai === "boss_worm") {
      this.aiBossWorm(e, dt, player, game);
    } else if (e.ai === "boss_skeletron") {
      this.aiBossSkeletron(e, dt, player, game);
    } else if (e.ai === "boss_wall") {
      this.aiBossWall(e, dt, player, game);
    } else if (e.ai === "boss_brain") {
      this.aiBossBrain(e, dt, player, game);
    } else if (e.ai === "boss_bee") {
      this.aiBossBee(e, dt, player, game);
    } else if (e.ai === "boss_plantera") {
      this.aiBossPlantera(e, dt, player, game);
    } else if (e.ai === "boss_golem") {
      this.aiBossGolem(e, dt, player, game);
    } else if (e.ai === "boss_cultist") {
      this.aiBossCultist(e, dt, player, game);
    } else if (e.ai === "boss_moon") {
      this.aiBossMoon(e, dt, player, game);
    }
  }

  explodeAt(pos, radius, damage, game, friendly) {
    const r = Math.ceil(radius);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (dx * dx + dy * dy + dz * dz > r * r) continue;
          const x = Math.floor(pos.x + dx);
          const y = Math.floor(pos.y + dy);
          const z = Math.floor(pos.z + dz);
          const id = this.world.getBlock(x, y, z);
          if (id && id !== 15 && id !== 0) {
            this.world.setBlock(x, y, z, 0);
          }
        }
      }
    }
    if (friendly) {
      for (const e of this.entities) {
        if (e.dead) continue;
        if (e.pos.distanceTo(pos) < radius + 1) {
          e.hurt(damage, e.pos.clone().sub(pos).normalize(), 6, game);
        }
      }
    }
    game.particles?.burst(pos.x, pos.y, pos.z, [255, 120, 40], 20);
    game.audio?.play("boss");
  }

  aiBossBrain(e, dt, player, game) {
    // orbit + teleport + creepers
    const ang = e.age * 1.2;
    const target = player.pos.clone();
    target.x += Math.cos(ang) * 8;
    target.z += Math.sin(ang) * 8;
    target.y += 3;
    const dir = target.sub(e.pos);
    const len = dir.length() || 1;
    e.vel.lerp(dir.multiplyScalar(9 / len), 1 - Math.pow(0.04, dt));
    if (e.attackCd <= 0) {
      e.attackCd = 1.1;
      if (Math.random() < 0.4) {
        e.pos.copy(player.pos).add(new THREE.Vector3((Math.random() - 0.5) * 10, 4, (Math.random() - 0.5) * 10));
      }
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        this.spawnProjectile({
          x: e.pos.x,
          y: e.pos.y,
          z: e.pos.z,
          vx: Math.cos(a) * 10,
          vy: -2,
          vz: Math.sin(a) * 10,
          damage: e.damage,
          friendly: false,
          color: 0xe84393,
          life: 3,
        });
      }
    }
    this.tryTouchDamage(e, player, game, 2);
  }

  aiBossBee(e, dt, player, game) {
    const phase2 = e.hp < e.maxHp * 0.5;
    const target = player.eyePosition();
    target.y += Math.sin(e.age * 3) * 2;
    const dir = target.sub(e.pos);
    const len = dir.length() || 1;
    e.vel.lerp(dir.multiplyScalar((phase2 ? 14 : 10) / len), 1 - Math.pow(0.05, dt));
    if (e.attackCd <= 0) {
      e.attackCd = phase2 ? 0.5 : 0.9;
      const d = player.eyePosition().sub(e.pos).normalize();
      this.spawnProjectile({
        x: e.pos.x,
        y: e.pos.y,
        z: e.pos.z,
        vx: d.x * 16,
        vy: d.y * 16,
        vz: d.z * 16,
        damage: e.damage,
        friendly: false,
        color: 0xf1c40f,
        life: 2.5,
      });
      if (Math.random() < 0.4) {
        this.spawnEnemy("hornet", e.pos.x, e.pos.y, e.pos.z);
      }
    }
    this.tryTouchDamage(e, player, game, 1.8);
  }

  aiBossPlantera(e, dt, player, game) {
    const phase2 = e.hp < e.maxHp * 0.5;
    e.phase = phase2 ? 1 : 0;
    const dir = player.pos.clone().sub(e.pos);
    const len = dir.length() || 1;
    e.vel.lerp(dir.multiplyScalar((phase2 ? 9 : 5) / len), 1 - Math.pow(0.06, dt));
    if (e.attackCd <= 0) {
      e.attackCd = phase2 ? 0.45 : 0.8;
      for (let i = 0; i < (phase2 ? 8 : 4); i++) {
        const a = (i / 8) * Math.PI * 2 + e.age;
        this.spawnProjectile({
          x: e.pos.x,
          y: e.pos.y,
          z: e.pos.z,
          vx: Math.cos(a) * 12,
          vy: Math.sin(e.age + i) * 4,
          vz: Math.sin(a) * 12,
          damage: e.damage,
          friendly: false,
          color: 0xe84393,
          life: 3,
        });
      }
    }
    this.tryTouchDamage(e, player, game, 2.5);
    if (e.mesh) e.mesh.scale.setScalar(1 + Math.sin(e.age * 2) * 0.1);
  }

  aiBossGolem(e, dt, player, game) {
    const to = player.pos.clone().sub(e.pos);
    to.y = 0;
    if (to.lengthSq() > 0.01) to.normalize();
    e.vel.x = to.x * e.speed;
    e.vel.z = to.z * e.speed;
    if (e.vel.y === 0 && Math.random() < dt * 0.8) e.vel.y = 10;
    if (e.attackCd <= 0) {
      e.attackCd = 1.2;
      const d = player.eyePosition().sub(e.pos).normalize();
      this.spawnProjectile({
        x: e.pos.x,
        y: e.pos.y + 2,
        z: e.pos.z,
        vx: d.x * 18,
        vy: d.y * 18,
        vz: d.z * 18,
        damage: e.damage,
        friendly: false,
        color: 0xe17055,
        life: 3,
        radius: 0.3,
      });
    }
    this.tryTouchDamage(e, player, game, 2.2);
  }

  aiBossCultist(e, dt, player, game) {
    this.aiBossSkeletron(e, dt, player, game);
    if (Math.random() < dt * 0.4) {
      this.spawnEnemy("dark_caster", e.pos.x + (Math.random() - 0.5) * 6, e.pos.y, e.pos.z + (Math.random() - 0.5) * 6);
    }
  }

  aiBossMoon(e, dt, player, game) {
    const target = player.pos.clone();
    target.y += 6;
    const dir = target.sub(e.pos);
    const len = dir.length() || 1;
    e.vel.lerp(dir.multiplyScalar(6 / len), 1 - Math.pow(0.03, dt));
    if (e.attackCd <= 0) {
      e.attackCd = 0.55;
      for (let i = -2; i <= 2; i++) {
        const d = player.eyePosition().sub(e.pos).normalize();
        this.spawnProjectile({
          x: e.pos.x + i,
          y: e.pos.y,
          z: e.pos.z,
          vx: d.x * 14,
          vy: d.y * 14,
          vz: d.z * 14,
          damage: e.damage,
          friendly: false,
          color: 0x81ecec,
          life: 4,
          radius: 0.35,
        });
      }
    }
    this.tryTouchDamage(e, player, game, 3);
  }

  tryTouchDamage(e, player, game, range) {
    if (e.attackCd > 0) return;
    const dx = player.pos.x - e.pos.x;
    const dy = player.pos.y + 0.8 - (e.pos.y + e.height * 0.5);
    const dz = player.pos.z - e.pos.z;
    if (Math.hypot(dx, dy, dz) < range + e.width) {
      player.hurt(e.damage, e.pos, game);
      const cd = game?.progression?.diff?.touchCd ?? 1.2;
      e.attackCd = e.boss ? Math.max(0.9, cd * 0.85) : cd;
    }
  }

  aiBossEye(e, dt, player, game) {
    const phase2 = e.hp < e.maxHp * 0.45;
    e.phase = phase2 ? 1 : 0;
    const target = player.eyePosition().clone();
    target.y += 2 + Math.sin(e.age * 1.5) * 1.5;
    // circle
    const angle = e.age * (phase2 ? 1.6 : 0.9);
    const radius = phase2 ? 6 : 10;
    target.x = player.pos.x + Math.cos(angle) * radius;
    target.z = player.pos.z + Math.sin(angle) * radius;

    const dir = target.sub(e.pos);
    const dist = dir.length() || 1;
    dir.multiplyScalar(1 / dist);
    const speed = phase2 ? 12 : 8;
    e.vel.lerp(dir.multiplyScalar(speed), 1 - Math.pow(0.02, dt));

    // charge occasionally
    if (Math.floor(e.age * 0.4) !== Math.floor((e.age - dt) * 0.4)) {
      const charge = player.pos.clone().sub(e.pos).normalize().multiplyScalar(phase2 ? 22 : 16);
      e.vel.copy(charge);
      e.vel.y += 2;
    }

    if (e.attackCd <= 0) {
      e.attackCd = phase2 ? 0.7 : 1.2;
      const d = player.eyePosition().sub(e.pos).normalize();
      this.spawnProjectile({
        x: e.pos.x,
        y: e.pos.y,
        z: e.pos.z,
        vx: d.x * 16,
        vy: d.y * 16,
        vz: d.z * 16,
        damage: e.damage,
        friendly: false,
        color: 0xff4757,
        life: 3,
        radius: 0.25,
      });
    }
    this.tryTouchDamage(e, player, game, 1.8);
    if (e.mesh) e.mesh.lookAt(player.pos);
  }

  aiBossSlime(e, dt, player, game) {
    const toP = player.pos.clone().sub(e.pos);
    toP.y = 0;
    if (e.vel.y === 0 && Math.random() < dt * 0.9) {
      const dir = toP.lengthSq() > 0.01 ? toP.normalize() : new THREE.Vector3(1, 0, 0);
      e.vel.x = dir.x * (e.speed * 1.4);
      e.vel.z = dir.z * (e.speed * 1.4);
      e.vel.y = 12;
      // spawn minions
      if (Math.random() < 0.35) {
        this.spawnEnemy("slime", e.pos.x + (Math.random() - 0.5) * 3, e.pos.y + 1, e.pos.z + (Math.random() - 0.5) * 3);
      }
    }
    // squash scale animation
    if (e.mesh) {
      const squash = e.vel.y < 0 ? 1.15 : 0.9;
      e.mesh.scale.set(squash, 2 - squash, squash);
    }
    this.tryTouchDamage(e, player, game, 2.2);
  }

  aiBossWorm(e, dt, player, game) {
    // burrowing snake towards player
    if (!e.segments) {
      e.segments = [];
      for (let i = 0; i < 12; i++) {
        const geo = new THREE.SphereGeometry(0.55 - i * 0.02, 8, 8);
        const mat = new THREE.MeshLambertMaterial({ color: i === 0 ? 0xa29bfe : 0x6c5ce7 });
        const m = new THREE.Mesh(geo, mat);
        this.group.add(m);
        e.segments.push({ mesh: m, pos: e.pos.clone() });
      }
    }

    const target = player.pos.clone();
    target.y += 1;
    // undulate underground then rise
    const dive = Math.sin(e.age * 0.7) > 0.3;
    if (dive) target.y = Math.max(4, player.pos.y - 4);

    const dir = target.sub(e.pos);
    const len = dir.length() || 1;
    dir.multiplyScalar(1 / len);
    e.vel.lerp(dir.multiplyScalar(e.speed), 1 - Math.pow(0.08, dt));
    e.pos.addScaledVector(e.vel, dt);

    // follow segments
    let prev = e.pos.clone();
    for (const seg of e.segments) {
      const d = prev.clone().sub(seg.pos);
      if (d.length() > 0.7) {
        d.normalize().multiplyScalar(0.7);
        seg.pos.copy(prev).sub(d);
      }
      seg.mesh.position.copy(seg.pos);
      prev = seg.pos.clone();
    }
    if (e.mesh) e.mesh.visible = false;

    this.tryTouchDamage(e, player, game, 1.5);
    // segment damage zones
    for (const seg of e.segments) {
      const dx = player.pos.x - seg.pos.x;
      const dy = player.pos.y + 0.8 - seg.pos.y;
      const dz = player.pos.z - seg.pos.z;
      if (Math.hypot(dx, dy, dz) < 1.1 && e.attackCd <= 0) {
        player.hurt(e.damage, seg.pos, game);
        e.attackCd = 0.6;
      }
    }
  }

  tryNaturalSpawn(player, game) {
    const maxMobs = game.dayNight.bloodMoon ? 22 : 12;
    if (this.entities.filter((e) => !e.boss).length >= maxMobs) return;
    const isNight = game.dayNight.isNight;
    const blood = game.dayNight.bloodMoon;
    const deep = player.pos.y < 20;
    // Day surface: 0–1 attempt; night a few; blood/deep more
    let count = blood ? 4 : isNight ? 2 : deep ? 2 : Math.random() < 0.55 ? 1 : 0;
    if (deep && isNight) count += 1;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 28;
      const x = player.pos.x + Math.cos(angle) * dist;
      const z = player.pos.z + Math.sin(angle) * dist;
      let sy = this.world.surfaceY(x, z) + 1;
      if (deep) sy = Math.max(4, player.pos.y + (Math.random() - 0.5) * 8);
      if (sy >= CHUNK_HEIGHT - 2) continue;
      if (Math.abs(sy - player.pos.y) > 24) continue;

      let type = "slime";
      const r = Math.random();
      const hard = !!game.progression?.hardmode;
      if (blood) {
        type = r < 0.5 ? "blood_zombie" : r < 0.75 ? "demon_eye" : "skeleton";
      } else if (deep) {
        type = r < 0.35 ? "bat" : r < 0.55 ? "skeleton" : r < 0.75 ? "fire_imp" : r < 0.9 ? "demon" : "angry_bones";
      } else if (isNight) {
        if (hard) {
          type = r < 0.3 ? "wraith" : r < 0.55 ? "poss_armor" : r < 0.75 ? "corruptor" : "zombie";
        } else if (r < 0.35) type = "zombie";
        else if (r < 0.58) type = "skeleton";
        else if (r < 0.82) type = "demon_eye";
        else type = "slime"; // rare night slime, not the default
      } else {
        // Day surface: uncommon wildlife, not a slime carpet
        // ~12% of successful day attempts (already thinned by count roll)
        if (Math.random() > (hard ? 0.18 : 0.12)) continue;
        if (hard && r > 0.9) type = "moss_hornet";
        else if (r < 0.55) type = "green_slime";
        else if (r < 0.88) type = "slime";
        else type = "purple_slime";
      }

      if (this.world.isSolidAt(x, sy, z)) continue;
      this.spawnEnemy(type, x, sy, z);
    }
  }

  aiBossSkeletron(e, dt, player, game) {
    const phase2 = e.hp < e.maxHp * 0.4;
    const target = player.eyePosition().clone();
    target.y += 3 + Math.sin(e.age * 1.2) * 2;
    const ang = e.age * (phase2 ? 1.4 : 0.8);
    target.x = player.pos.x + Math.cos(ang) * (phase2 ? 7 : 11);
    target.z = player.pos.z + Math.sin(ang) * (phase2 ? 7 : 11);
    const dir = target.sub(e.pos);
    const len = dir.length() || 1;
    e.vel.lerp(dir.multiplyScalar((phase2 ? 11 : 7) / len), 1 - Math.pow(0.03, dt));

    if (Math.floor(e.age * 0.5) !== Math.floor((e.age - dt) * 0.5)) {
      e.vel.add(player.pos.clone().sub(e.pos).normalize().multiplyScalar(phase2 ? 18 : 12));
    }
    if (e.attackCd <= 0) {
      e.attackCd = phase2 ? 0.55 : 0.95;
      for (let i = 0; i < (phase2 ? 3 : 1); i++) {
        const spread = (i - 1) * 0.15;
        const d = player.eyePosition().sub(e.pos).normalize();
        const c = Math.cos(spread);
        const s = Math.sin(spread);
        const dx = d.x * c - d.z * s;
        const dz = d.x * s + d.z * c;
        this.spawnProjectile({
          x: e.pos.x,
          y: e.pos.y + 0.5,
          z: e.pos.z,
          vx: dx * 15,
          vy: d.y * 15,
          vz: dz * 15,
          damage: e.damage,
          friendly: false,
          color: 0xf5f0e6,
          life: 3,
          radius: 0.22,
        });
      }
    }
    this.tryTouchDamage(e, player, game, 2.0);
    if (e.mesh) e.mesh.rotation.y += dt * 2;
  }

  aiBossWall(e, dt, player, game) {
    // advance toward player along X/Z, stay mid height, barrage
    const target = player.pos.clone();
    target.y = player.pos.y + 1.5;
    const dir = target.sub(e.pos);
    const len = dir.length() || 1;
    dir.multiplyScalar(1 / len);
    e.vel.lerp(dir.multiplyScalar(e.speed * 0.55), 1 - Math.pow(0.05, dt));
    e.vel.y *= 0.9;

    if (e.attackCd <= 0) {
      e.attackCd = 0.4;
      for (let i = -2; i <= 2; i++) {
        this.spawnProjectile({
          x: e.pos.x,
          y: e.pos.y + i * 0.6,
          z: e.pos.z,
          vx: dir.x * 12,
          vy: dir.y * 6 + i * 0.5,
          vz: dir.z * 12,
          damage: e.damage,
          friendly: false,
          color: 0xff4757,
          life: 3.5,
          radius: 0.28,
        });
      }
    }
    this.tryTouchDamage(e, player, game, 2.8);
    if (e.mesh) {
      e.mesh.scale.set(1.2 + Math.sin(e.age * 3) * 0.08, 1.4, 1.2);
    }
  }

  raycastEnemy(origin, dir, maxDist) {
    let best = null;
    let bestT = maxDist;
    for (const e of this.entities) {
      if (e.dead) continue;
      // sphere approx at center
      const center = e.pos.clone();
      center.y += e.height * 0.5;
      const radius = Math.max(e.width, e.height) * 0.55;
      const to = center.clone().sub(origin);
      const t = to.dot(dir);
      if (t < 0 || t > bestT) continue;
      const closest = origin.clone().addScaledVector(dir, t);
      if (closest.distanceTo(center) <= radius) {
        bestT = t;
        best = e;
      }
    }
    return best;
  }

  /** attach hurt method to entities */
  attachHurt() {
    // method on prototype via assignment when spawning - done in hurtEntity
  }
}

/** Extra guaranteed drops so bosses always advance gear */
const BOSS_BONUS_LOOT = {
  king_slime: [
    ["gold_bar", 8],
    ["gel", 40],
    ["slimy_saddle", 1],
  ],
  eye: [
    ["demonite", 20],
    ["lens", 10],
    ["gold_bar", 6],
  ],
  eater: [
    ["demonite_bar", 12],
    ["shadow_scale", 20],
  ],
  brain: [
    ["tissue_sample", 20],
    ["crystal", 12],
  ],
  queen_bee: [
    ["beenade", 30],
    ["vine", 25],
    ["honey", 20],
  ],
  skeletron: [
    ["bone", 50],
    ["dungeon_brick", 40],
    ["gold_bar", 10],
  ],
  deerclops: [
    ["ice", 50],
    ["bone", 30],
  ],
  wall: [
    ["hellstone_bar", 25],
    ["pwnhammer", 1],
    ["warrior_emblem", 1],
  ],
  twins: [
    ["hallowed_bar", 25],
    ["soul_of_sight", 25],
  ],
  destroyer: [
    ["hallowed_bar", 25],
    ["soul_of_might", 25],
  ],
  prime: [
    ["hallowed_bar", 25],
    ["soul_of_fright", 25],
  ],
  plantera: [
    ["chlorophyte_bar", 20],
    ["temple_key", 1],
  ],
  golem: [
    ["beetle_husks", 25],
    ["picksaw", 1],
  ],
  moonlord: [
    ["luminite", 60],
    ["last_prism", 1],
  ],
};

// Monkey-patch hurt onto entities when needed
export function hurtEntity(e, amount, dir, knockback, game) {
  if (e.dead) return;
  // real i-frames so spam-clicking doesn't delete packs instantly
  if (e.hurtTime > 0.12) return;
  e.hp -= amount;
  e.hurtTime = e.boss ? 0.28 : 0.35;
  if (dir && dir.lengthSq?.() > 0.01) {
    const d = dir.clone().normalize();
    const kb = (knockback || 2) * (e.boss ? 0.45 : 1);
    e.vel.x += d.x * kb * 1.4;
    e.vel.z += d.z * kb * 1.4;
    e.vel.y += Math.max(2.5, kb * 0.55);
  } else if (dir) {
    e.vel.x += (dir.x || 0) * (knockback || 2);
    e.vel.z += (dir.z || 0) * (knockback || 2);
    e.vel.y += (knockback || 2) * 0.4;
  }
  if (e.hp <= 0) {
    e.dead = true;
    killEntity(e, game);
  }
}

function killEntity(e, game) {
  const player = game.player;
  player.killCount++;
  game.particles.burst(e.pos.x, e.pos.y + e.height * 0.5, e.pos.z, [255, 100, 100], 14);
  game.audio.play("kill");

  for (const drop of e.drops || []) {
    if (Math.random() <= (drop.chance ?? 1)) {
      const raw = drop.count || 1;
      const c = typeof raw === "function" ? raw() : raw;
      const added = player.inventory.add(drop.item, c);
      if (added < c && game.drops) {
        game.drops.spawn(e.pos.x, e.pos.y + 0.5, e.pos.z, drop.item, c - added);
      }
    }
  }

  // copper coins baseline + material scraps
  player.inventory.add("copper_coin", 5 + ((Math.random() * 20) | 0));
  if (!e.boss && Math.random() < 0.25) player.inventory.add("gel", 1);
  if (!e.boss && e.type?.includes("skeleton") && Math.random() < 0.4) player.inventory.add("bone", 1);
  if (!e.boss && e.type === "demon_eye" && Math.random() < 0.35) player.inventory.add("lens", 1);

  game.bestiary?.onKill(e.type);

  const finishedEvent = game.events?.onEnemyKilled(e.type);
  if (finishedEvent === "goblin_army") {
    game.progression.goblinsDefeated = true;
    game.progression.refreshNpcUnlocks();
    game.ui.toast("Goblin Army defeated! Goblin Tinkerer available.");
    game.achievements?.onEvent?.("goblin_army");
  }
  if (finishedEvent === "solar_eclipse") {
    game.ui.toast("Solar Eclipse survived!");
  }
  if (finishedEvent === "pirate_invasion") {
    game.progression.piratesDefeated = true;
    game.progression.refreshNpcUnlocks();
    game.ui.toast("Pirates defeated! Pirate NPC available.");
    game.achievements?.onEvent?.("pirate_invasion");
  }
  if (finishedEvent === "frost_legion") {
    game.progression.frostDefeated = true;
    game.progression.refreshNpcUnlocks();
    game.ui.toast("Frost Legion defeated!");
  }
  if (finishedEvent === "martian_madness") {
    game.progression.martiansDefeated = true;
    game.progression.refreshNpcUnlocks();
    game.ui.toast("Martians defeated!");
  }

  // expert+ loot bonus copper
  const lootMul = game.progression?.diff?.loot || 1;
  if (lootMul > 1) {
    player.inventory.add("copper_coin", Math.floor(10 * lootMul));
  }

  game.achievements?.onKill(e.type, game.progression?.bossesDefeated || player.bossesDefeated);
  game.achievements?.onBestiary?.(game.bestiary?.completion?.() || 0);

  if (e.boss) {
    player.bossesDefeated.add(e.type);
    const result = game.progression?.onBossKill(e.type);
    player.maxHp = Math.min(400, player.maxHp + 20);
    player.hp = player.maxHp;
    player.inventory.add("boss_trophy", 1);
    player.inventory.add("gold_coin", Math.floor(10 * lootMul));
    // guaranteed progression packages per boss
    const bonus = BOSS_BONUS_LOOT[e.type];
    if (bonus) {
      for (const [item, count] of bonus) {
        const n = typeof count === "function" ? count() : count;
        const added = player.inventory.add(item, n);
        if (added < n && game.drops) {
          game.drops.spawn(e.pos.x, e.pos.y + 1, e.pos.z, item, n - added);
        }
      }
    }
    game.ui.toast(`${ENEMY_TYPES[e.type]?.name || "Boss"} defeated! +20 Max HP`);
    if (result?.hardmodeJustUnlocked) {
      game.ui.toast("HARDMODE has been unleashed!");
      game.achievements?.unlock?.("hardmode");
      game.audio.play("boss");
    }
    if (e.type === "moonlord") {
      game.victory = true;
      game.ui.toast("✦ YOU ARE THE TERRARIAN ✦ Moon Lord defeated!");
      game.ui.showVictory?.(game);
      game.achievements?.unlock?.("moonlord");
      game.achievements?.unlock?.("completionist");
      game.saveGame(true);
    }
    game.audio.play("boss");
    game.audio.setMusicMode(game.dayNight.isNight ? "night" : "day");
    game.achievements?.onKill(e.type, game.progression?.bossesDefeated);
    game.npcs?.syncUnlocks(game.progression, game.world, player);
    if (e.segments) {
      for (const s of e.segments) {
        game.entities.group.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
      }
      e.segments = null;
    }
  }
}

// Add hurt to entities dynamically
const origSpawn = EntityManager.prototype.spawnEnemy;
EntityManager.prototype.spawnEnemy = function (type, x, y, z, gameRef) {
  const e = origSpawn.call(this, type, x, y, z);
  if (e) {
    e.hurt = (amount, dir, knockback, game) => hurtEntity(e, amount, dir, knockback, game);
    // scale by difficulty if game available on manager
    const g = gameRef || this._game;
    const diff = g?.progression?.diff;
    if (diff && !e.boss) {
      e.hp = Math.floor(e.hp * diff.enemyHp);
      e.maxHp = e.hp;
      e.damage = Math.floor(e.damage * diff.enemyDmg);
    } else if (diff && e.boss) {
      e.hp = Math.floor(e.hp * (1 + (diff.enemyHp - 1) * 0.75));
      e.maxHp = e.hp;
      e.damage = Math.floor(e.damage * (1 + (diff.enemyDmg - 1) * 0.6));
    }
    g?.bestiary?.onSee?.(type);
  }
  return e;
};

function createEnemyMesh(def) {
  const kind = kindFromEnemyDef(def);
  const w = Math.max(def.width, 0.6);
  const h = Math.max(def.height, 0.8);
  const sprite = createEntitySprite(def.name || "mob", def.color, kind, w, h, def.emissive || 0);
  const root = new THREE.Group();
  sprite.position.y = 0;
  root.add(sprite);
  // ground shadow disc
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(w * 0.55, 12),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);
  root.userData.sprite = sprite;
  root.userData.shadow = shadow;
  return root;
}

/** Soft glowing projectile sprite (shared canvas) */
let _projTex = null;
function projectileTexture() {
  if (_projTex) return _projTex;
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  _projTex = new THREE.CanvasTexture(c);
  _projTex.magFilter = THREE.LinearFilter;
  return _projTex;
}

function createProjectileSprite(color, radius) {
  const mat = new THREE.SpriteMaterial({
    map: projectileTexture(),
    color,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const spr = new THREE.Sprite(mat);
  const s = Math.max(0.25, radius * 4);
  spr.scale.set(s, s, 1);
  return spr;
}
