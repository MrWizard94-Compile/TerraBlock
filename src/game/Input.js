/**
 * Input with optional virtual overlay for autonomous playtest (hands).
 * Pointer lock is ONLY requested from the game canvas while menus are closed —
 * never on document clicks (that stole the cursor from inventory UI).
 */

export class VirtualInput {
  constructor() {
    this.keys = new Set();
    this.consumeQueue = new Set();
    this.mouse = {
      dx: 0,
      dy: 0,
      left: false,
      right: false,
      leftDown: false,
      rightDown: false,
    };
    this.scroll = 0;
    this.locked = true;
  }

  apply(controls = {}) {
    if (controls.keys) {
      this.keys = new Set(controls.keys);
    }
    if (controls.holdKeys) {
      for (const k of controls.holdKeys) this.keys.add(k);
    }
    if (controls.releaseKeys) {
      for (const k of controls.releaseKeys) this.keys.delete(k);
    }
    if (controls.left !== undefined && controls.left !== null) this.mouse.left = !!controls.left;
    if (controls.right !== undefined && controls.right !== null) this.mouse.right = !!controls.right;
    if (controls.leftDown) this.mouse.leftDown = true;
    if (controls.rightDown) this.mouse.rightDown = true;
    if (controls.lookDx) this.mouse.dx += Number(controls.lookDx) || 0;
    if (controls.lookDy) this.mouse.dy += Number(controls.lookDy) || 0;
    if (controls.scroll) this.scroll += Number(controls.scroll) || 0;
    if (controls.locked !== undefined && controls.locked !== null) this.locked = !!controls.locked;
  }

  holdKeys(keys) {
    this.keys = new Set(keys || []);
  }

  clearKeys() {
    this.keys.clear();
  }

  tapKey(code) {
    this.consumeQueue.add(code);
  }

  setLocked(v) {
    this.locked = !!v;
  }

  clear() {
    this.keys.clear();
    this.consumeQueue.clear();
    this.mouse.left = false;
    this.mouse.right = false;
    this.mouse.leftDown = false;
    this.mouse.rightDown = false;
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    this.scroll = 0;
  }

  endFrame() {
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    this.mouse.leftDown = false;
    this.mouse.rightDown = false;
    this.scroll = 0;
    this.consumeQueue.clear();
  }
}

export class Input {
  constructor(dom) {
    this.dom = dom;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, dx: 0, dy: 0, left: false, right: false, leftDown: false, rightDown: false };
    this.locked = false;
    this.scroll = 0;
    /** @type {VirtualInput | null} */
    this.virtual = null;
    this.playtestMode = false;
    /** After inventory/Escape, browser often blocks re-lock until a canvas click */
    this.pendingRelock = false;
    /**
     * When true, pointer lock must not be requested and game mouse buttons are ignored.
     * Set by Game while any menu/overlay is open.
     */
    this.uiBlocking = false;

    this._onKeyDown = (e) => {
      if (this.playtestMode) return;
      this.keys.add(e.code);
      if (["Space", "Tab"].includes(e.code)) e.preventDefault();
    };
    this._onKeyUp = (e) => {
      if (this.playtestMode) return;
      this.keys.delete(e.code);
    };
    this._onMouseMove = (e) => {
      if (this.playtestMode) return;
      if (!this.locked || this.uiBlocking) return;
      this.mouse.dx += e.movementX;
      this.mouse.dy += e.movementY;
    };
    this._onMouseDown = (e) => {
      if (this.playtestMode) return;
      // UI has the cursor — never steal pointer lock or inject game clicks
      if (this.uiBlocking) return;
      if (e.button === 0) {
        this.mouse.left = true;
        this.mouse.leftDown = true;
      }
      if (e.button === 2) {
        this.mouse.right = true;
        this.mouse.rightDown = true;
      }
    };
    this._onMouseUp = (e) => {
      if (this.playtestMode) return;
      if (e.button === 0) this.mouse.left = false;
      if (e.button === 2) this.mouse.right = false;
    };
    this._onWheel = (e) => {
      if (this.playtestMode) return;
      if (this.uiBlocking) return;
      this.scroll += Math.sign(e.deltaY);
    };
    this._onLockChange = () => {
      if (this.playtestMode) return;
      this.locked = document.pointerLockElement === this.dom;
      if (this.locked) this.pendingRelock = false;
    };
    this._onContext = (e) => e.preventDefault();

    // Canvas-only re-lock (user gesture + menus closed)
    this._onCanvasPointer = (e) => {
      if (this.playtestMode) return;
      if (this.uiBlocking) return;
      if (e.button !== undefined && e.button !== 0 && e.type === "mousedown") return;
      if (this.pendingRelock || document.pointerLockElement !== this.dom) {
        this.requestLock(true);
      }
    };

    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    document.addEventListener("mousemove", this._onMouseMove);
    document.addEventListener("mousedown", this._onMouseDown);
    document.addEventListener("mouseup", this._onMouseUp);
    document.addEventListener("wheel", this._onWheel, { passive: true });
    document.addEventListener("pointerlockchange", this._onLockChange);
    this.dom.addEventListener("contextmenu", this._onContext);
    this.dom.addEventListener("mousedown", this._onCanvasPointer);
    this.dom.addEventListener("click", this._onCanvasPointer);
    // focusable for keyboard after menus
    if (this.dom.tabIndex < 0) this.dom.tabIndex = 0;
  }

  enablePlaytest() {
    this.playtestMode = true;
    this.virtual = new VirtualInput();
    this.locked = true;
    this.uiBlocking = false;
  }

  /**
   * @param {boolean} blocking menus / inventory / pause / death screens
   */
  setUiBlocking(blocking) {
    this.uiBlocking = !!blocking;
    if (this.uiBlocking) {
      // release lock so the cursor can use DOM UI
      if (!this.playtestMode && document.pointerLockElement === this.dom) {
        document.exitPointerLock?.();
      }
      this.locked = false;
      this.clearKeys();
    }
  }

  /**
   * @param {boolean} [fromUserGesture] true when called from canvas click/mousedown
   */
  requestLock(fromUserGesture = false) {
    if (this.playtestMode) {
      this.locked = true;
      this.pendingRelock = false;
      this.virtual?.setLocked(true);
      return;
    }
    if (this.uiBlocking) {
      this.pendingRelock = true;
      return;
    }
    if (document.pointerLockElement === this.dom) {
      this.locked = true;
      this.pendingRelock = false;
      return;
    }
    this.pendingRelock = true;
    if (!fromUserGesture) {
      // Non-gesture re-lock after Escape almost always fails in Chromium.
      // Wait for canvas click; show "click to resume" via pendingRelock.
      return;
    }
    try {
      const ret = this.dom.requestPointerLock?.();
      if (ret && typeof ret.then === "function") {
        ret
          .then(() => {
            this.locked = document.pointerLockElement === this.dom;
            if (this.locked) this.pendingRelock = false;
          })
          .catch(() => {
            this.pendingRelock = true;
            this.locked = false;
          });
      }
    } catch {
      this.pendingRelock = true;
      this.locked = false;
    }
  }

  exitLock() {
    if (this.playtestMode) {
      return;
    }
    if (document.pointerLockElement === this.dom) {
      document.exitPointerLock?.();
    }
    this.locked = false;
    this.pendingRelock = true;
  }

  /**
   * Drop all held keys / mouse buttons so menus don't "stick" movement on close.
   */
  clearKeys() {
    this.keys.clear();
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    this.mouse.left = false;
    this.mouse.right = false;
    this.mouse.leftDown = false;
    this.mouse.rightDown = false;
    this.scroll = 0;
    this.virtual?.clear?.();
  }

  /** Clear only movement keys (WASD/Space) — keeps UI usable if needed */
  clearMovementKeys() {
    for (const code of ["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ShiftLeft", "ShiftRight"]) {
      this.keys.delete(code);
    }
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    this.mouse.left = false;
    this.mouse.right = false;
    this.mouse.leftDown = false;
    this.mouse.rightDown = false;
  }

  pressed(code) {
    if (this.virtual?.keys.has(code)) return true;
    return this.keys.has(code);
  }

  consumeKey(code) {
    if (this.virtual?.consumeQueue.has(code)) {
      this.virtual.consumeQueue.delete(code);
      return true;
    }
    if (this.keys.has(code)) {
      this.keys.delete(code);
      return true;
    }
    return false;
  }

  /** Effective mouse state (real + virtual) */
  getMouse() {
    if (!this.virtual) return this.mouse;
    return {
      x: this.mouse.x,
      y: this.mouse.y,
      dx: this.mouse.dx + this.virtual.mouse.dx,
      dy: this.mouse.dy + this.virtual.mouse.dy,
      left: this.mouse.left || this.virtual.mouse.left,
      right: this.mouse.right || this.virtual.mouse.right,
      leftDown: this.mouse.leftDown || this.virtual.mouse.leftDown,
      rightDown: this.mouse.rightDown || this.virtual.mouse.rightDown,
    };
  }

  getScroll() {
    return this.scroll + (this.virtual?.scroll || 0);
  }

  get lockedEffective() {
    if (this.playtestMode) return this.virtual?.locked !== false;
    return this.locked && !this.uiBlocking;
  }

  endFrame() {
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    this.mouse.leftDown = false;
    this.mouse.rightDown = false;
    this.scroll = 0;
    this.virtual?.endFrame();
  }
}
