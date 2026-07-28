import * as THREE from "three";
import {
  GRAVITY,
  PLAYER_SPEED,
  PLAYER_SPRINT,
  PLAYER_JUMP,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_EYE,
  REACH,
  MAX_HP,
  MAX_MANA,
  MAX_HP_CAP,
  MAX_MANA_CAP,
} from "./constants.js";
import { BLOCKS, blockDrop, BlockId } from "./blocks.js";
import { ITEMS } from "./items.js";
import { Inventory } from "./Inventory.js";
import { BuffManager } from "./Buffs.js";
import { Grapple } from "./Grapple.js";
import { MountSystem } from "./Mounts.js";
import { countCoins, spendCoins } from "./NPCSystem.js";

export class Player {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    this.pos = new THREE.Vector3(0, 50, 0);
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.hp = MAX_HP;
    this.maxHp = MAX_HP;
    this.mana = MAX_MANA;
    this.maxMana = MAX_MANA;
    this.invuln = 0;
    this.hurtFlash = 0;
    this.dead = false;
    this.inventory = new Inventory();
    this.buffs = new BuffManager();
    this.grapple = new Grapple();
    this.mounts = new MountSystem();
    this.breakProgress = 0;
    this.breakTarget = null;
    this.attackCooldown = 0;
    this.lookHit = null;
    this.bossesDefeated = new Set();
    this.killCount = 0;
    this.timeAlive = 0;
    this.playTime = 0;
    this.defense = 0;
    this.mouseSensitivity = 1;
    this.invertY = false;
    this._fallSpeed = 0;
    this._usedExtraJump = false;
    this._rocketFuel = 0;
    this.spawnPoint = null;
    this.potionSick = 0;
    /** seconds since last damage — for out-of-combat regen */
    this.combatTimer = 0;
  }

  recomputeStats() {
    const buffDef = this.buffs.mods().def;
    this.defense = this.inventory.defense + buffDef;
    const acc = this.inventory.accMods;
    this.maxMana = Math.max(this.maxMana, MAX_MANA + (acc.mana || 0));
  }

  spawnAt(x, y, z) {
    this.pos.set(x, y, z);
    this.vel.set(0, 0, 0);
    this.hp = this.maxHp;
    this.mana = this.maxMana;
    this.dead = false;
    this.invuln = 1.5;
    this.recomputeStats();
    this.syncCamera();
  }

  syncCamera() {
    this.camera.position.set(this.pos.x, this.pos.y + PLAYER_EYE, this.pos.z);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  eyePosition() {
    return new THREE.Vector3(this.pos.x, this.pos.y + PLAYER_EYE, this.pos.z);
  }

  lookDir() {
    const e = new THREE.Euler(this.pitch, this.yaw, 0, "YXZ");
    return new THREE.Vector3(0, 0, -1).applyEuler(e).normalize();
  }

  update(dt, input, game) {
    if (this.dead) return;

    this.timeAlive += dt;
    this.playTime += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtFlash = Math.max(0, (this.hurtFlash || 0) - dt * 2.8);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.potionSick = Math.max(0, this.potionSick - dt);
    this.combatTimer = Math.max(0, (this.combatTimer || 0) - dt);
    this.buffs.update(dt);
    this.mounts.update(dt);
    const bmods = this.buffs.mods();
    const acc = this.inventory.accMods;
    const mountMods = this.mounts.mods();
    const manaRegen =
      4 +
      (this.inventory.hasFullSet("shadow") ? 2 : 0) +
      (acc.manaRegen || 0) +
      (bmods.regen > 0 ? 0 : 0);
    this.mana = Math.min(this.maxMana, this.mana + dt * manaRegen);
    // passive life regen when out of combat
    let lifeRegen = (bmods.regen || 0) + (acc.regen || 0);
    if (this.combatTimer <= 0 && this.hp < this.maxHp) lifeRegen += 1.5;
    if (this.onGround && this.combatTimer <= 0) lifeRegen += 0.5;
    if (lifeRegen > 0) {
      this.hp = Math.min(this.maxHp, this.hp + dt * lifeRegen);
    }
    this.recomputeStats();

    // fishing update
    if (game.fishing) {
      const fr = game.fishing.update(dt);
      if (fr?.bite) game.ui?.toast("Fish on! Press F to reel!");
      if (fr?.missed) game.ui?.toast("It got away…");
    }

    const sens = 0.0022 * (this.mouseSensitivity || 1);
    const mouse = input.getMouse ? input.getMouse() : input.mouse;
    const scroll = input.getScroll ? input.getScroll() : input.scroll;
    const locked = input.lockedEffective !== undefined ? input.lockedEffective : input.locked;
    if (locked) {
      this.yaw -= mouse.dx * sens;
      const inv = this.invertY ? -1 : 1;
      this.pitch -= mouse.dy * sens * inv;
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
    }

    for (let i = 0; i < 9; i++) {
      if (input.consumeKey(`Digit${i + 1}`)) this.inventory.select(i);
    }
    if (scroll) {
      let s = this.inventory.selected + scroll;
      s = ((s % 9) + 9) % 9;
      this.inventory.select(s);
    }

    // grapple fire / release
    if (input.consumeKey("KeyR")) {
      const held = this.inventory.selectedItem;
      const isHook = held && ITEMS[held.id]?.grapple;
      if (this.grapple.active) this.grapple.release();
      else if (isHook) {
        this.grapple.fire(this, this.world, this.eyePosition(), this.lookDir());
      }
    }
    this.grapple.update(this, dt);

    // mount toggle
    if (input.consumeKey("KeyV")) {
      const held = this.inventory.selectedItem;
      if (held && ITEMS[held.id]?.mount) {
        const r = this.mounts.toggle(held.id);
        if (r.ok) {
          game.ui?.toast(r.active ? `Mounted: ${r.name}` : "Dismounted");
          if (r.active) game.achievements?.onMount?.();
        }
      } else if (this.mounts.active) {
        this.mounts.dismount();
        game.ui?.toast("Dismounted");
      }
    }

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wish = new THREE.Vector3();
    if (input.pressed("KeyW")) wish.add(forward);
    if (input.pressed("KeyS")) wish.sub(forward);
    if (input.pressed("KeyD")) wish.add(right);
    if (input.pressed("KeyA")) wish.sub(right);
    if (wish.lengthSq() > 0) wish.normalize();

    const sprint = input.pressed("ShiftLeft") || input.pressed("ShiftRight");
    const speedMul =
      (this.inventory.hasFullSet("molten") ? 1.08 : 1) *
      (acc.speed || 1) *
      (bmods.speed || 1) *
      (mountMods.speed || 1);
    const speed = (sprint ? PLAYER_SPRINT : PLAYER_SPEED) * speedMul;
    if (!this.grapple.active) {
      this.vel.x = wish.x * speed;
      this.vel.z = wish.z * speed;
    }

    if (this.onGround) {
      this._usedExtraJump = false;
      this._rocketFuel = 1.2;
    }

    if (input.pressed("Space")) {
      if (this.onGround) {
        this.vel.y = PLAYER_JUMP * (bmods.jump || 1) * (mountMods.jump || 1);
        this.onGround = false;
      } else if (acc.doubleJump && !this._usedExtraJump) {
        this.vel.y = PLAYER_JUMP * 0.95 * (mountMods.jump || 1);
        this._usedExtraJump = true;
      } else if ((acc.rocket || acc.wings || mountMods.fly) && this._rocketFuel > 0) {
        this.vel.y = Math.max(this.vel.y, mountMods.fly ? 10 : 8);
        this._rocketFuel -= dt;
      }
    }

    const gravMul = bmods.grav || 1;
    this.vel.y -= GRAVITY * gravMul * dt;
    if (this.vel.y < -40) this.vel.y = -40;

    this.moveAxis(dt, "x");
    this.moveAxis(dt, "y");
    this.moveAxis(dt, "z");

    if (this.onGround && this._fallSpeed) {
      const fs = this._fallSpeed;
      // softer fall damage — only serious drops hurt
      if (fs < -22 && !acc.noFall) {
        const dmg = Math.floor((-fs - 22) * 1.6);
        this.hurt(dmg, null, game);
      }
      this._fallSpeed = 0;
    }
    if (!this.onGround) this._fallSpeed = this.vel.y;

    this.syncCamera();
    this.lookHit = this.world.raycast(this.eyePosition(), this.lookDir(), REACH);
    this.handleActions(dt, input, game);

    if (input.consumeKey("KeyF") || input.consumeKey("KeyQ")) {
      this.useSelected(game);
    }

    // equip armor with G on selected slot
    if (input.consumeKey("KeyG")) {
      if (this.inventory.equipFromSlot(this.inventory.selected)) {
        this.recomputeStats();
        game.audio.play("equip");
        game.ui.toast(`Equipped · DEF ${this.defense}`);
        if (
          this.inventory.hasFullSet("wood") ||
          this.inventory.hasFullSet("iron") ||
          this.inventory.hasFullSet("gold") ||
          this.inventory.hasFullSet("shadow") ||
          this.inventory.hasFullSet("molten")
        ) {
          game.achievements.onArmorComplete();
        }
      }
    }

    game.achievements.onDepth(this.pos.y);
  }

  moveAxis(dt, axis) {
    const next = this.pos.clone();
    next[axis] += this.vel[axis] * dt;
    if (!this.collides(next)) {
      this.pos[axis] = next[axis];
      if (axis === "y") this.onGround = false;
      return;
    }
    if (axis !== "y" && this.onGround) {
      const step = next.clone();
      step.y += 0.55;
      if (!this.collides(step)) {
        this.pos.x = axis === "x" ? next.x : this.pos.x;
        this.pos.z = axis === "z" ? next.z : this.pos.z;
        this.pos.y = step.y;
        return;
      }
    }
    if (axis === "y") {
      if (this.vel.y < 0) this.onGround = true;
      this.vel.y = 0;
    } else {
      this.vel[axis] = 0;
    }
  }

  collides(pos) {
    const hw = PLAYER_WIDTH * 0.5;
    const minX = pos.x - hw;
    const maxX = pos.x + hw;
    const minY = pos.y;
    const maxY = pos.y + PLAYER_HEIGHT;
    const minZ = pos.z - hw;
    const maxZ = pos.z + hw;

    const x0 = Math.floor(minX);
    const x1 = Math.floor(maxX);
    const y0 = Math.floor(minY);
    const y1 = Math.floor(maxY);
    const z0 = Math.floor(minZ);
    const z1 = Math.floor(maxZ);

    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        for (let x = x0; x <= x1; x++) {
          if (this.world.isSolidAt(x, y, z)) return true;
        }
      }
    }
    return false;
  }

  handleActions(dt, input, game) {
    const weapon = this.inventory.getWeapon();
    const isRanged = weapon && (weapon.weapon === "ranged" || weapon.weapon === "magic");
    const hitEnemy = game.entities.raycastEnemy(
      this.eyePosition(),
      this.lookDir(),
      weapon?.reach || 2.5
    );
    const mouse = input.getMouse ? input.getMouse() : input.mouse;

    if (mouse.left) {
      if (isRanged && this.attackCooldown <= 0) {
        this.rangedAttack(game, weapon);
        this.breakProgress = 0;
        this.breakTarget = null;
      } else if (hitEnemy && this.attackCooldown <= 0) {
        this.meleeAttack(hitEnemy, game);
        this.breakProgress = 0;
        this.breakTarget = null;
      } else if (this.lookHit && !hitEnemy) {
        this.mineBlock(dt, game);
      } else if (weapon?.weapon === "melee" && this.attackCooldown <= 0) {
        this.attackCooldown = weapon.cooldown * 0.8;
        game.audio.play("hit");
      }
    } else {
      this.breakProgress = 0;
      this.breakTarget = null;
    }

    if (mouse.rightDown) {
      // interact first (doors, etc.) then place
      if (!this.tryInteract(game)) this.placeBlock(game);
    }
  }

  /**
   * Right-click interactions: toggle doors, open chests without mining.
   * @returns {boolean} true if interaction consumed the click
   */
  tryInteract(game) {
    const hit = this.lookHit;
    if (!hit) return false;
    if (hit.id === BlockId.DOOR) {
      const ok = this.world.toggleDoor(hit.x, hit.y, hit.z);
      if (ok) {
        game.audio.play("click");
        const open = this.world.isDoorOpenAt(hit.x, hit.y, hit.z);
        game.ui?.toast?.(open ? "Door opened" : "Door closed");
      }
      return true;
    }
    if (hit.id === BlockId.CHEST) {
      if (!this._lootedChests) this._lootedChests = new Set();
      const ck = `${hit.x},${hit.y},${hit.z}`;
      if (this._lootedChests.has(ck)) {
        game.ui?.toast?.("Chest is empty");
        return true;
      }
      this.giveChestLoot(game, hit.x, hit.y, hit.z);
      this._lootedChests.add(ck);
      return true;
    }
    if (hit.id === BlockId.BED) {
      this.spawnPoint = { x: hit.x + 0.5, y: hit.y + 1.01, z: hit.z + 0.5 };
      game.ui?.toast?.("Spawn point set!");
      game.audio.play("click");
      return true;
    }
    return false;
  }

  mineBlock(dt, game) {
    const hit = this.lookHit;
    if (!hit) return;
    const key = `${hit.x},${hit.y},${hit.z}`;
    if (this.breakTarget !== key) {
      this.breakTarget = key;
      this.breakProgress = 0;
    }

    const def = BLOCKS[hit.id];
    if (!def || def.hardness === Infinity) return;

    let power = this.inventory.getMiningPowerFor(hit.id, def);
    if (def.requiresPick && power < 1) power = 0.12;
    const rate =
      (power / Math.max(0.1, def.hardness)) * (ITEMS[this.inventory.selectedItem?.id]?.speed || 1);
    this.breakProgress += rate * dt;

    if (this.breakProgress >= 1) {
      const drop = blockDrop(hit.id);
      // chest loot on break
      if (hit.id === BlockId.CHEST) {
        this.giveChestLoot(game, hit.x, hit.y, hit.z);
      }
      // doors are 2-tall — remove both halves, one drop
      if (hit.id === BlockId.DOOR) {
        this.world.breakDoor(hit.x, hit.y, hit.z);
      } else {
        this.world.setBlock(hit.x, hit.y, hit.z, BlockId.AIR);
      }
      if (drop) {
        const added = this.inventory.add(drop.item, drop.count);
        if (added < drop.count) {
          game.drops.spawn(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, drop.item, drop.count - added);
        }
      }
      game.particles.burst(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, def.color, 12, { mode: "dust" });
      game.audio.play("break");
      game.achievements.onBreak();
      game.heldItem?.punch?.();
      this.breakProgress = 0;
      this.breakTarget = null;
    }
  }

  giveChestLoot(game, x, y, z) {
    const sc = game.world?.starterChest;
    const isStarter = sc && sc.x === x && sc.y === y && sc.z === z;
    /** @type {[string, number][]} */
    let loot;
    if (isStarter) {
      loot = [
        ["copper_ore", 24],
        ["iron_ore", 18],
        ["coal", 12],
        ["copper_bar", 6],
        ["iron_bar", 5],
        ["torch", 20],
        ["healing_potion", 8],
        ["rope", 50],
        ["copper_coin", 100],
        ["wood", 40],
      ];
      game.world.starterChest = null;
    } else {
      const deep = y < 28;
      loot = [
        ["gold_coin", 2 + ((Math.random() * 6) | 0)],
        ["torch", 6 + ((Math.random() * 10) | 0)],
        [deep ? "gold_ore" : "iron_ore", 3 + ((Math.random() * 6) | 0)],
        ["silver_coin", 1 + ((Math.random() * 4) | 0)],
      ];
      if (Math.random() < 0.4) loot.push(["life_crystal", 1]);
      if (Math.random() < 0.25) loot.push(["mana_crystal", 1]);
      if (Math.random() < 0.2) loot.push([deep ? "gold_bar" : "iron_bar", 2 + ((Math.random() * 3) | 0)]);
      if (Math.random() < 0.12) loot.push(["hermes_boots", 1]);
      if (Math.random() < 0.1) loot.push(["cloud_bottle", 1]);
      if (Math.random() < 0.08) loot.push(["grappling_hook", 1]);
    }
    for (const [item, count] of loot) {
      const added = this.inventory.add(item, count);
      if (added < count) game.drops.spawn(x + 0.5, y + 1, z + 0.5, item, count - added);
    }
    game.ui.toast(isStarter ? "Starter chest looted — smelt ore at the Furnace!" : "Chest looted!");
  }

  placeBlock(game) {
    const hit = this.lookHit;
    if (!hit || !hit.face) return;
    const slot = this.inventory.selectedItem;
    if (!slot) return;
    const def = ITEMS[slot.id];
    if (!def?.place) return;

    const px = hit.x + hit.face[0];
    const py = hit.y + hit.face[1];
    const pz = hit.z + hit.face[2];

    const hw = PLAYER_WIDTH * 0.5;
    if (
      px + 1 > this.pos.x - hw &&
      px < this.pos.x + hw &&
      py + 1 > this.pos.y &&
      py < this.pos.y + PLAYER_HEIGHT &&
      pz + 1 > this.pos.z - hw &&
      pz < this.pos.z + hw
    ) {
      return;
    }

    const cur = this.world.getBlock(px, py, pz);
    if (cur !== BlockId.AIR && cur !== BlockId.WATER) return;

    // Doors: need 2 free vertical cells, place as stack with facing
    if (def.place === BlockId.DOOR || slot.id === "door") {
      // facing from player look (panel faces the player)
      const yaw = this.yaw;
      let facing = 0;
      const ax = Math.abs(Math.sin(yaw));
      const az = Math.abs(Math.cos(yaw));
      if (ax > az) facing = Math.sin(yaw) > 0 ? 3 : 1;
      else facing = Math.cos(yaw) > 0 ? 2 : 0;
      if (!this.world.placeDoor(px, py, pz, facing)) {
        game.ui?.toast?.("Need 2 blocks of vertical space for a door");
        return;
      }
      this.inventory.consumeSelected(1);
      game.audio.play("place");
      game.achievements.onPlace();
      return;
    }

    if (this.world.setBlock(px, py, pz, def.place)) {
      this.inventory.consumeSelected(1);
      game.audio.play("place");
      game.achievements.onPlace();
      // bed sets spawn point
      if (def.place === BlockId.BED || slot.id === "bed") {
        this.spawnPoint = { x: px + 0.5, y: py + 1.01, z: pz + 0.5 };
        game.ui.toast("Spawn point set!");
      }
    }
  }

  meleeAttack(enemy, game) {
    const weapon = this.inventory.getWeapon() || {
      damage: 3,
      knockback: 2,
      cooldown: 0.45,
      weapon: "melee",
    };
    this.attackCooldown = weapon.cooldown;
    this.combatTimer = 3;
    let dmg = weapon.damage;
    const acc = this.inventory.accMods;
    const bmods = this.buffs.mods();
    dmg = Math.floor(dmg * (acc.dmg || 1) * (bmods.dmg || 1));
    if (this.inventory.hasFullSet("shadow")) dmg = Math.floor(dmg * 1.1);
    if (Math.random() < (acc.crit || 0)) dmg = Math.floor(dmg * 2);
    const dir = this.lookDir();
    enemy.hurt(dmg, dir, weapon.knockback, game);
    game.audio.play("hit");
    if (game.settings.damageNumbers) {
      game.floating.spawn(enemy.pos.x, enemy.pos.y + enemy.height, enemy.pos.z, `${dmg}`, "#ffeaa7");
    }
    game.particles.burst(enemy.pos.x, enemy.pos.y + enemy.height * 0.5, enemy.pos.z, [255, 80, 80], 10, {
      mode: "blood",
    });
    game.heldItem?.punch?.();
  }

  rangedAttack(game, weapon) {
    if (weapon.mana && this.mana < weapon.mana) {
      game.ui.toast("Not enough mana!");
      return;
    }
    // bows need arrows; guns need bullets (if present in inv)
    const wdef = ITEMS[this.inventory.selectedItem?.id] || weapon;
    const name = (wdef.name || "").toLowerCase();
    const isBow = wdef.weapon === "ranged" && (name.includes("bow") || name.includes("phantasm"));
    const isGun =
      wdef.weapon === "ranged" && (name.includes("shark") || name.includes("gun") || name.includes("musket"));
    if (isBow) {
      if (this.inventory.count("flaming_arrow") > 0) this.inventory.remove("flaming_arrow", 1);
      else if (this.inventory.count("wooden_arrow") > 0) this.inventory.remove("wooden_arrow", 1);
      else {
        game.ui.toast("Need arrows! Craft Wooden Arrows at Work Bench.");
        return;
      }
    } else if (isGun) {
      if (this.inventory.count("musket_ball") > 0) this.inventory.remove("musket_ball", 1);
      else {
        game.ui.toast("Need Musket Balls!");
        return;
      }
    }
    if (weapon.mana) this.mana -= weapon.mana;
    this.attackCooldown = weapon.cooldown;
    this.combatTimer = 3;
    const origin = this.eyePosition();
    const dir = this.lookDir();
    const color =
      weapon.weapon === "magic"
        ? weapon.id === "starfury"
          ? 0x81ecec
          : 0x74b9ff
        : weapon.id?.includes("crystal")
          ? 0xc56cf0
          : 0xdfe6e9;
    game.entities.spawnProjectile({
      x: origin.x,
      y: origin.y,
      z: origin.z,
      vx: dir.x * 28,
      vy: dir.y * 28,
      vz: dir.z * 28,
      damage: weapon.damage,
      knockback: weapon.knockback,
      friendly: true,
      life: 2.5,
      color,
      radius: 0.18,
    });
    game.audio.play("shoot");
    game.particles.burst(origin.x + dir.x, origin.y + dir.y, origin.z + dir.z, [200, 220, 255], 4, {
      mode: "spark",
    });
    game.heldItem?.punch?.();
  }

  useSelected(game) {
    const slot = this.inventory.selectedItem;
    if (!slot) return;
    const def = ITEMS[slot.id];
    if (!def) return;

    // fishing reel / cast
    if (def.fishingPower) {
      if (game.fishing?.casting) {
        const r = game.fishing.reel(this, game.progression?.hardmode);
        if (r.ok) {
          game.ui.toast(`Caught ${ITEMS[r.item]?.name || r.item}!`);
          game.audio.play("pickup");
          game.achievements?.onFish?.();
        } else game.ui.toast(r.error || "Miss");
      } else {
        const r = game.fishing?.tryCast(this, this.world, this.lookHit);
        if (r?.ok) game.ui.toast("Cast line…");
        else game.ui.toast(r?.error || "Can't cast");
      }
      return;
    }

    if (def.bomb) {
      this.throwBomb(game, def);
      this.inventory.consumeSelected(1);
      return;
    }

    if (def.potion || def.heal) {
      if (def.heal && this.potionSick > 0 && def.potion) {
        game.ui.toast("Potion sickness!");
        return;
      }
      if (def.heal) {
        if (this.hp >= this.maxHp && !def.buff) {
          /* still allow buff potions */
          if (!def.buff) return;
        }
        if (def.heal) {
          this.hp = Math.min(this.maxHp, this.hp + def.heal);
          if (def.potion && def.heal >= 50) this.potionSick = 60;
          game.ui.toast(`+${def.heal} HP`);
          game.audio.play("heal");
        }
      }
      if (def.buff) this.buffs.apply(def.buff, def.duration || 180);
      if (slot.id === "mana_potion") {
        this.mana = Math.min(this.maxMana, this.mana + 80);
        game.ui.toast("+80 MP");
      }
      this.inventory.consumeSelected(1);
      if (def.buff) game.ui.toast(`${def.name}!`);
      game.audio.play("heal");
      return;
    }

    if (def.recall) {
      this.inventory.consumeSelected(1);
      const sp = this.spawnPoint || game.world.findSpawn();
      this.pos.set(sp.x, sp.y, sp.z);
      this.vel.set(0, 0, 0);
      this.syncCamera();
      game.ui.toast("Recalled!");
      game.audio.play("heal");
      return;
    }

    if (def.lifeCrystal) {
      if (this.maxHp >= MAX_HP_CAP) {
        game.ui.toast("Max life already reached!");
        return;
      }
      this.maxHp = Math.min(MAX_HP_CAP, this.maxHp + 20);
      this.hp = this.maxHp;
      this.inventory.consumeSelected(1);
      game.ui.toast(`Max HP → ${this.maxHp}`);
      game.audio.play("levelup");
      return;
    }

    if (def.manaCrystal) {
      if (this.maxMana >= MAX_MANA_CAP) {
        game.ui.toast("Max mana already reached!");
        return;
      }
      this.maxMana = Math.min(MAX_MANA_CAP, this.maxMana + 20);
      this.mana = this.maxMana;
      this.inventory.consumeSelected(1);
      game.ui.toast(`Max Mana → ${this.maxMana}`);
      game.audio.play("levelup");
      return;
    }

    if (def.mount) {
      const r = this.mounts.toggle(slot.id);
      if (r.ok) {
        game.ui.toast(r.active ? `Mounted: ${r.name}` : "Dismounted");
        if (r.active) game.achievements?.onMount?.();
      }
      return;
    }

    if (def.weapon === "summon" || def.minion) {
      if (def.mana && this.mana < def.mana) {
        game.ui.toast("Not enough mana!");
        return;
      }
      if (def.mana) this.mana -= def.mana;
      const slots = 1 + (this.inventory.count("bewitching_table") > 0 ? 1 : 0) + (this.inventory.hasFullSet("stardust") ? 2 : 0);
      game.minions?.setSlots(slots + Math.floor(this.maxMana / 40));
      game.minions?.spawn(def.minion || "slime", def.damage || 10);
      game.ui.toast(`Summoned ${def.name}`);
      game.audio.play("shoot");
      return;
    }

    if (def.boss) {
      if (game.entities.hasBoss()) {
        game.ui.toast("A boss is already active!");
        return;
      }
      if (game.progression) {
        const chain = game.progression.bossProgress().find((b) => b.id === def.boss);
        if (chain?.locked) {
          game.ui.toast("Requires Hardmode!");
          return;
        }
      }
      this.inventory.consumeSelected(1);
      game.spawnBoss(def.boss);
      this.combatTimer = 8;
      return;
    }

  }

  /** Drop coins on death (expert+ drops more) */
  dropCoinsOnDeath(game) {
    const mul = game.progression?.diff?.loot || 1;
    const total = Math.floor(countCoins(this.inventory) * 0.5 * mul);
    if (total <= 0) return;
    // remove half coins
    spendCoins(this.inventory, Math.min(total, countCoins(this.inventory)));
    // leave pile at feet as gold/silver
    if (game.drops) {
      const gold = Math.floor(total / 10000);
      const silver = Math.floor((total % 10000) / 100);
      const copper = total % 100;
      if (gold) game.drops.spawn(this.pos.x, this.pos.y + 0.5, this.pos.z, "gold_coin", gold);
      if (silver) game.drops.spawn(this.pos.x, this.pos.y + 0.5, this.pos.z, "silver_coin", silver);
      if (copper) game.drops.spawn(this.pos.x, this.pos.y + 0.5, this.pos.z, "copper_coin", copper);
    }
  }

  throwBomb(game, def) {
    const dir = this.lookDir();
    const o = this.eyePosition();
    game.entities.spawnProjectile({
      x: o.x,
      y: o.y,
      z: o.z,
      vx: dir.x * 14,
      vy: dir.y * 14 + 2,
      vz: dir.z * 14,
      damage: 40,
      knockback: 4,
      friendly: true,
      life: 2.2,
      color: 0x2d3436,
      radius: 0.25,
      gravity: 12,
      explode: def.radius || 3,
    });
    game.audio.play("shoot");
  }

  /**
   * Terraria-style mitigation: flat defense subtract, then difficulty scalar.
   * Classic is intentionally softer than raw enemy table numbers.
   */
  hurt(amount, source, game) {
    if (this.dead || this.invuln > 0) return;
    const diff = game?.progression?.diff;
    const diffMul = diff?.playerDmgTaken ?? 1;
    // half-defense flat reduce (Terraria-like), then % from remaining armor, then difficulty
    const flat = Math.floor(this.defense * 0.5);
    const afterFlat = Math.max(1, amount - flat);
    const pct = 1 - Math.min(0.45, this.defense * 0.025);
    const reduced = Math.max(1, Math.floor(afterFlat * pct * diffMul));
    this.hp -= reduced;
    this.invuln = diff?.invuln ?? 0.9;
    this.combatTimer = 4.5;
    this.hurtFlash = 1;
    game?.audio?.play("hurt");
    game?.ui?.flashDamage?.(reduced);
    if (game?.settings?.damageNumbers) {
      game.floating.spawn(this.pos.x, this.pos.y + 1.6, this.pos.z, `-${reduced}`, "#ff6b6b");
    }
    if (source) {
      const dx = this.pos.x - source.x;
      const dz = this.pos.z - source.z;
      const len = Math.hypot(dx, dz) || 1;
      // lighter knockback so you can escape instead of stunlock
      this.vel.x += (dx / len) * 5.5;
      this.vel.z += (dz / len) * 5.5;
      this.vel.y = Math.max(this.vel.y, 4);
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.mounts.dismount();
      this.grapple.release();
      if (game) this.dropCoinsOnDeath(game);
      game?.onPlayerDeath?.();
    }
  }

  healFull() {
    this.hp = this.maxHp;
    this.mana = this.maxMana;
    this.dead = false;
    this.invuln = 2;
  }
}
