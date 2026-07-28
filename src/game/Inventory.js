import { ITEMS, calcDefense, isFullSet, accessoryMods } from "./items.js";
import { applyPrefixToWeapon } from "./Prefixes.js";

const HOTBAR = 9;
const SIZE = 50;

export class Inventory {
  constructor() {
    this.slots = Array.from({ length: SIZE }, () => null);
    this.selected = 0;
    /** @type {Record<string, string|null>} */
    this.equipment = {
      head: null,
      chest: null,
      legs: null,
      acc1: null,
      acc2: null,
      acc3: null,
      acc4: null,
      acc5: null,
    };
    /** piggy bank separate storage */
    this.piggy = Array.from({ length: 20 }, () => null);
  }

  get hotbar() {
    return this.slots.slice(0, HOTBAR);
  }

  get selectedItem() {
    return this.slots[this.selected];
  }

  get defense() {
    return calcDefense(this.equipment);
  }

  get accMods() {
    return accessoryMods(this.equipment);
  }

  select(index) {
    if (index >= 0 && index < HOTBAR) this.selected = index;
  }

  count(itemId) {
    let n = 0;
    for (const s of this.slots) {
      if (s && s.id === itemId) n += s.count;
    }
    return n;
  }

  add(itemId, count = 1, prefix = null) {
    const def = ITEMS[itemId];
    if (!def) return 0;
    const maxStack = def.stack ?? 99;
    let left = count;
    // uniques with prefixes never stack
    const canStack = maxStack > 1 && !prefix;

    if (canStack) {
      for (const s of this.slots) {
        if (!s || s.id !== itemId || s.prefix) continue;
        const space = maxStack - s.count;
        if (space <= 0) continue;
        const take = Math.min(space, left);
        s.count += take;
        left -= take;
        if (left <= 0) return count;
      }
    }

    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i]) continue;
      const take = canStack ? Math.min(maxStack, left) : 1;
      this.slots[i] = { id: itemId, count: take, prefix: prefix || null };
      left -= take;
      if (left <= 0) return count;
    }
    return count - left;
  }

  /** Deposit selected into piggy if space */
  depositToPiggy(slotIndex) {
    const s = this.slots[slotIndex];
    if (!s) return false;
    for (let i = 0; i < this.piggy.length; i++) {
      if (!this.piggy[i]) {
        this.piggy[i] = { ...s };
        this.slots[slotIndex] = null;
        return true;
      }
      if (this.piggy[i].id === s.id && !s.prefix && !this.piggy[i].prefix) {
        const max = ITEMS[s.id]?.stack ?? 99;
        const space = max - this.piggy[i].count;
        if (space > 0) {
          const take = Math.min(space, s.count);
          this.piggy[i].count += take;
          s.count -= take;
          if (s.count <= 0) this.slots[slotIndex] = null;
          return true;
        }
      }
    }
    return false;
  }

  withdrawPiggy(pigIndex) {
    const s = this.piggy[pigIndex];
    if (!s) return false;
    const added = this.add(s.id, s.count, s.prefix);
    if (added <= 0) return false;
    if (added >= s.count) this.piggy[pigIndex] = null;
    else s.count -= added;
    return true;
  }

  remove(itemId, count = 1) {
    if (count <= 0) return true;
    if (this.count(itemId) < count) return false;
    let left = count;
    for (let i = 0; i < this.slots.length && left > 0; i++) {
      const s = this.slots[i];
      if (!s || s.id !== itemId) continue;
      const take = Math.min(s.count, left);
      s.count -= take;
      left -= take;
      if (s.count <= 0) this.slots[i] = null;
    }
    return left === 0;
  }

  consumeSelected(n = 1) {
    const s = this.slots[this.selected];
    if (!s || s.count < n) return false;
    s.count -= n;
    if (s.count <= 0) this.slots[this.selected] = null;
    return true;
  }

  /**
   * Swap two inventory slots (including empty).
   * @param {number} a
   * @param {number} b
   */
  swapSlots(a, b) {
    if (a === b) return false;
    if (a < 0 || b < 0 || a >= this.slots.length || b >= this.slots.length) return false;
    const t = this.slots[a];
    this.slots[a] = this.slots[b];
    this.slots[b] = t;
    return true;
  }

  /**
   * Place cursor stack onto slot: merge if same item, else swap.
   * @param {number} slotIndex
   * @param {{ id: string, count: number, prefix?: string|null }|null} cursor
   * @returns {{ cursor: object|null, changed: boolean }}
   */
  placeCursor(slotIndex, cursor) {
    if (slotIndex < 0 || slotIndex >= this.slots.length) return { cursor, changed: false };
    if (!cursor) return { cursor: null, changed: false };

    const target = this.slots[slotIndex];
    const maxStack = ITEMS[cursor.id]?.stack ?? 99;
    const canStack = maxStack > 1 && !cursor.prefix;

    // empty target → drop whole cursor
    if (!target) {
      this.slots[slotIndex] = { id: cursor.id, count: cursor.count, prefix: cursor.prefix || null };
      return { cursor: null, changed: true };
    }

    // merge into same stack
    if (canStack && target.id === cursor.id && !target.prefix) {
      const space = maxStack - target.count;
      if (space <= 0) {
        // full — swap
        this.slots[slotIndex] = cursor;
        return { cursor: target, changed: true };
      }
      const take = Math.min(space, cursor.count);
      target.count += take;
      cursor.count -= take;
      if (cursor.count <= 0) return { cursor: null, changed: true };
      return { cursor, changed: true };
    }

    // different items → swap
    this.slots[slotIndex] = cursor;
    return { cursor: target, changed: true };
  }

  /**
   * Pick up from slot into cursor (full or half).
   * @param {number} slotIndex
   * @param {boolean} half
   * @param {{ id: string, count: number, prefix?: string|null }|null} cursor existing
   * @returns {{ cursor: object|null, changed: boolean }}
   */
  pickCursor(slotIndex, half = false, cursor = null) {
    if (slotIndex < 0 || slotIndex >= this.slots.length) return { cursor, changed: false };
    const s = this.slots[slotIndex];
    if (!s) {
      // click empty with cursor → place
      if (cursor) return this.placeCursor(slotIndex, cursor);
      return { cursor, changed: false };
    }

    // already holding something → try place/swap/merge on this slot
    if (cursor) return this.placeCursor(slotIndex, cursor);

    if (half && s.count > 1) {
      const halfN = Math.ceil(s.count / 2);
      s.count -= halfN;
      return {
        cursor: { id: s.id, count: halfN, prefix: s.prefix || null },
        changed: true,
      };
    }

    this.slots[slotIndex] = null;
    return {
      cursor: { id: s.id, count: s.count, prefix: s.prefix || null },
      changed: true,
    };
  }

  /** Drop one item from cursor onto slot (right-click place). */
  placeOne(slotIndex, cursor) {
    if (!cursor || cursor.count <= 0) return { cursor, changed: false };
    if (slotIndex < 0 || slotIndex >= this.slots.length) return { cursor, changed: false };
    const target = this.slots[slotIndex];
    const maxStack = ITEMS[cursor.id]?.stack ?? 99;
    if (!target) {
      this.slots[slotIndex] = { id: cursor.id, count: 1, prefix: cursor.prefix || null };
      cursor.count -= 1;
      return { cursor: cursor.count > 0 ? cursor : null, changed: true };
    }
    if (target.id === cursor.id && !target.prefix && !cursor.prefix && target.count < maxStack) {
      target.count += 1;
      cursor.count -= 1;
      return { cursor: cursor.count > 0 ? cursor : null, changed: true };
    }
    return { cursor, changed: false };
  }

  getWeapon() {
    const s = this.selectedItem;
    if (!s) return null;
    const def = ITEMS[s.id];
    if (!def?.weapon) return null;
    return applyPrefixToWeapon({ ...def, id: s.id }, s.prefix);
  }

  getToolPower() {
    const s = this.selectedItem;
    if (!s) return 0.5;
    const def = ITEMS[s.id];
    if (def?.tool !== "pick") return 0.5;
    const mod = applyPrefixToWeapon({ ...def }, s.prefix);
    return mod.power || def.power || 0.5;
  }

  /**
   * Mining power for a block — axes for wood/leaves, picks for ore/stone.
   * @param {number} blockId
   * @param {object} blockDef
   */
  getMiningPowerFor(blockId, blockDef) {
    const s = this.selectedItem;
    const def = s ? ITEMS[s.id] : null;
    const woodish =
      blockId === 5 ||
      blockId === 6 ||
      blockId === 49 ||
      (blockDef?.name || "").toLowerCase().includes("wood") ||
      (blockDef?.name || "").toLowerCase().includes("leaf");
    if (blockDef?.requiresPick) {
      if (def?.tool !== "pick") return 0.12;
      return applyPrefixToWeapon({ ...def }, s?.prefix).power || def.power || 1;
    }
    if (woodish) {
      if (def?.tool === "axe") return def.power || 2;
      if (def?.tool === "pick") return (def.power || 1) * 0.45;
      if (def?.tool === "hammer") return 0.8;
      return 0.4;
    }
    if (def?.tool === "pick") {
      return applyPrefixToWeapon({ ...def }, s?.prefix).power || def.power || 1;
    }
    if (def?.tool === "hammer") return def.power || 1;
    return 0.45;
  }

  equipFromSlot(slotIndex) {
    const s = this.slots[slotIndex];
    if (!s) return false;
    const def = ITEMS[s.id];
    if (!def) return false;

    if (def.armor) {
      const slot = def.armor;
      const prev = this.equipment[slot];
      this.equipment[slot] = s.id;
      this.slots[slotIndex] = null;
      if (prev) this.add(prev, 1);
      return true;
    }

    if (def.accessory) {
      for (let i = 1; i <= 5; i++) {
        const key = `acc${i}`;
        if (!this.equipment[key]) {
          this.equipment[key] = s.id;
          this.slots[slotIndex] = null;
          return true;
        }
      }
      // replace acc1
      const prev = this.equipment.acc1;
      this.equipment.acc1 = s.id;
      this.slots[slotIndex] = null;
      if (prev) this.add(prev, 1);
      return true;
    }
    return false;
  }

  unequip(slot) {
    const id = this.equipment[slot];
    if (!id) return false;
    if (this.add(id, 1) < 1) return false;
    this.equipment[slot] = null;
    return true;
  }

  hasFullSet(prefix) {
    return isFullSet(this.equipment, prefix);
  }

  giveStarter() {
    this.add("wood_pick", 1);
    this.add("wood_sword", 1);
    this.add("wood_axe", 1);
    this.add("torch", 50);
    this.add("wood", 60);
    this.add("dirt", 40);
    this.add("stone", 30);
    this.add("mushroom", 12);
    this.add("gel", 15);
    this.add("wood_pole", 1);
    this.add("copper_coin", 150);
    this.add("healing_potion", 5);
    this.add("recall_potion", 3);
    this.add("wooden_arrow", 80);
    this.add("bow", 1);
  }

  serialize() {
    return this.slots.map((s) => (s ? { id: s.id, count: s.count, prefix: s.prefix || null } : null));
  }

  serializeEquipment() {
    return { ...this.equipment };
  }

  serializePiggy() {
    return this.piggy.map((s) => (s ? { id: s.id, count: s.count } : null));
  }

  deserialize(data) {
    this.slots = Array.from({ length: SIZE }, () => null);
    if (!Array.isArray(data)) return;
    for (let i = 0; i < Math.min(SIZE, data.length); i++) {
      const s = data[i];
      if (s && ITEMS[s.id] && s.count > 0) {
        this.slots[i] = { id: s.id, count: s.count | 0, prefix: s.prefix || null };
      }
    }
  }

  deserializeEquipment(data) {
    this.equipment = {
      head: null,
      chest: null,
      legs: null,
      acc1: null,
      acc2: null,
      acc3: null,
      acc4: null,
      acc5: null,
    };
    if (!data) return;
    for (const slot of Object.keys(this.equipment)) {
      const id = data[slot];
      if (!id || !ITEMS[id]) continue;
      if (slot.startsWith("acc") && ITEMS[id].accessory) this.equipment[slot] = id;
      else if (ITEMS[id].armor === slot) this.equipment[slot] = id;
    }
  }

  deserializePiggy(data) {
    this.piggy = Array.from({ length: 20 }, () => null);
    if (!Array.isArray(data)) return;
    for (let i = 0; i < Math.min(20, data.length); i++) {
      const s = data[i];
      if (s && ITEMS[s.id]) this.piggy[i] = { id: s.id, count: s.count | 0 };
    }
  }
}
