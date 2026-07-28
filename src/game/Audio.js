/**
 * WebAudio SFX + light ambient music (no continuous harsh drone).
 */

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.master = 0.8;
    this.sfx = 0.7;
    /** Default low — continuous pads get fatiguing fast */
    this.music = 0.18;
    this._musicNodes = null;
    this._musicOn = false;
    this._musicMode = "day"; // day | night | boss | blood
    this._noteTimer = null;
    this._seqStep = 0;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx?.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  /**
   * @param {{ masterVolume?: number, sfxVolume?: number, musicVolume?: number }} s
   */
  applySettings(s) {
    if (!s) return;
    this.master = s.masterVolume ?? this.master;
    this.sfx = s.sfxVolume ?? this.sfx;
    this.music = s.musicVolume ?? this.music;
    if (this._musicNodes?.master) {
      this._musicNodes.master.gain.value = this._musicLevel();
    }
  }

  _musicLevel() {
    // Soft ceiling so "100% music" never becomes a face-melting drone
    return this.master * this.music * 0.045;
  }

  play(type) {
    if (!this.enabled) return;
    try {
      const ctx = this.ensure();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 4000;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      const tones = {
        break: { f: 180, f2: 90, d: 0.08, type: "square", v: 0.05 },
        place: { f: 320, f2: 240, d: 0.06, type: "triangle", v: 0.045 },
        hit: { f: 220, f2: 110, d: 0.07, type: "sawtooth", v: 0.055 },
        hurt: { f: 140, f2: 60, d: 0.15, type: "sawtooth", v: 0.07 },
        kill: { f: 400, f2: 600, d: 0.12, type: "square", v: 0.05 },
        shoot: { f: 500, f2: 200, d: 0.08, type: "triangle", v: 0.045 },
        heal: { f: 440, f2: 880, d: 0.18, type: "sine", v: 0.055 },
        boss: { f: 70, f2: 140, d: 0.45, type: "sawtooth", v: 0.08 },
        craft: { f: 360, f2: 520, d: 0.1, type: "sine", v: 0.05 },
        click: { f: 600, f2: 600, d: 0.03, type: "square", v: 0.03 },
        pickup: { f: 520, f2: 780, d: 0.08, type: "sine", v: 0.04 },
        equip: { f: 280, f2: 420, d: 0.1, type: "triangle", v: 0.045 },
        save: { f: 300, f2: 500, d: 0.15, type: "sine", v: 0.04 },
        levelup: { f: 400, f2: 900, d: 0.25, type: "triangle", v: 0.06 },
        blood: { f: 55, f2: 40, d: 0.5, type: "sawtooth", v: 0.07 },
        achievement: { f: 523, f2: 784, d: 0.35, type: "sine", v: 0.06 },
      };
      const s = tones[type] || tones.click;
      const vol = s.v * this.master * this.sfx;
      osc.type = s.type;
      osc.frequency.setValueAtTime(s.f, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, s.f2), t + s.d);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + s.d);
      osc.start(t);
      osc.stop(t + s.d + 0.02);
    } catch {
      /* ignore */
    }
  }

  /** Start or switch ambient pad */
  setMusicMode(mode) {
    if (this._musicMode === mode && this._musicOn) return;
    this._musicMode = mode;
    if (this._musicOn) this._restartMusic();
  }

  startMusic() {
    if (this._musicOn) return;
    this._musicOn = true;
    this._restartMusic();
  }

  stopMusic() {
    this._musicOn = false;
    this._killMusic();
  }

  _killMusic() {
    if (this._noteTimer !== null) {
      clearInterval(this._noteTimer);
      this._noteTimer = null;
    }
    if (!this._musicNodes) return;
    try {
      this._musicNodes.osc1?.stop();
      this._musicNodes.osc2?.stop();
    } catch {
      /* already stopped */
    }
    try {
      this._musicNodes.master?.disconnect();
    } catch {
      /* ignore */
    }
    this._musicNodes = null;
  }

  /**
   * Soft filtered sine bed + sparse quiet notes — not a continuous sawtooth drone.
   */
  _restartMusic() {
    this._killMusic();
    if (!this._musicOn || this.music <= 0.001) return;
    try {
      const ctx = this.ensure();
      if (!ctx) return;

      const profiles = {
        day: { base: 130.81, fifth: 196.0, filter: 420, pulseMs: 2200 },
        night: { base: 98.0, fifth: 146.83, filter: 320, pulseMs: 2800 },
        blood: { base: 73.42, fifth: 110.0, filter: 280, pulseMs: 1600 },
        boss: { base: 82.41, fifth: 123.47, filter: 360, pulseMs: 900 },
      };
      const p = profiles[this._musicMode] || profiles.day;

      const master = ctx.createGain();
      master.gain.value = this._musicLevel();
      master.connect(ctx.destination);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = p.filter;
      filter.Q.value = 0.5;
      filter.connect(master);

      // Very quiet sustained root (sine only — no saw/square)
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.value = p.base;
      const g1 = ctx.createGain();
      g1.gain.value = 0.22;
      osc1.connect(g1);
      g1.connect(filter);

      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = p.fifth;
      const g2 = ctx.createGain();
      g2.gain.value = 0.12;
      osc2.connect(g2);
      g2.connect(filter);

      const t0 = ctx.currentTime;
      // fade in so start isn't a click
      master.gain.setValueAtTime(0.0001, t0);
      master.gain.exponentialRampToValueAtTime(Math.max(0.0002, this._musicLevel()), t0 + 1.2);

      osc1.start(t0);
      osc2.start(t0);

      this._musicNodes = { osc1, osc2, master, filter };
      this._seqStep = 0;

      // Sparse soft plinks (not a continuous second layer)
      const scale =
        this._musicMode === "boss"
          ? [0, 3, 5, 7, 10]
          : this._musicMode === "blood"
            ? [0, 1, 3, 6, 8]
            : [0, 2, 4, 5, 7, 9];
      this._noteTimer = setInterval(() => {
        if (!this._musicOn || !this._musicNodes || this.music <= 0.001) return;
        try {
          const c = this.ensure();
          if (!c) return;
          const step = this._seqStep++ % scale.length;
          // skip some steps for air
          if ((this._seqStep + (this._musicMode === "day" ? 1 : 0)) % 3 === 0) return;
          const n = c.createOscillator();
          const ng = c.createGain();
          n.type = "sine";
          const f = p.base * Math.pow(2, scale[step] / 12);
          n.frequency.value = f * (this._musicMode === "night" ? 2 : 1);
          const now = c.currentTime;
          const peak = this._musicLevel() * 0.55;
          ng.gain.setValueAtTime(0.0001, now);
          ng.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + 0.04);
          ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
          n.connect(ng);
          ng.connect(this._musicNodes.filter);
          n.start(now);
          n.stop(now + 0.6);
        } catch {
          /* ignore */
        }
      }, p.pulseMs);
    } catch {
      this._musicNodes = null;
    }
  }
}
