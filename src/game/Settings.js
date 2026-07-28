/**
 * Persistent user settings (localStorage).
 */

const KEY = "terrablock_settings_v3";

/** @typedef {object} GameSettings
 * @property {number} mouseSensitivity
 * @property {boolean} invertY
 * @property {number} masterVolume
 * @property {number} sfxVolume
 * @property {number} musicVolume
 * @property {number} fov
 * @property {number} renderDistance
 * @property {number} pixelRatio
 * @property {boolean} showFps
 * @property {boolean} autoSave
 * @property {boolean} damageNumbers
 */

/** @returns {GameSettings} */
export function defaultSettings() {
  return {
    mouseSensitivity: 1,
    invertY: false,
    masterVolume: 0.8,
    sfxVolume: 0.7,
    /** Low default — procedural pads get fatiguing as a constant drone */
    musicVolume: 0.15,
    fov: 72,
    renderDistance: 6,
    pixelRatio: 1.5,
    showFps: true,
    autoSave: true,
    damageNumbers: true,
  };
}

/**
 * @param {Partial<GameSettings>} [partial]
 * @returns {GameSettings}
 */
export function clampSettings(partial = {}) {
  const d = defaultSettings();
  const s = { ...d, ...partial };
  s.mouseSensitivity = clamp(s.mouseSensitivity, 0.2, 3);
  s.masterVolume = clamp(s.masterVolume, 0, 1);
  s.sfxVolume = clamp(s.sfxVolume, 0, 1);
  s.musicVolume = clamp(s.musicVolume, 0, 1);
  s.fov = clamp(s.fov, 50, 100);
  s.renderDistance = Math.round(clamp(s.renderDistance, 2, 8));
  s.pixelRatio = clamp(s.pixelRatio, 0.75, 2);
  s.invertY = !!s.invertY;
  s.showFps = !!s.showFps;
  s.autoSave = !!s.autoSave;
  s.damageNumbers = !!s.damageNumbers;
  return s;
}

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, Number(v) || 0));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSettings();
    return clampSettings(JSON.parse(raw));
  } catch {
    return defaultSettings();
  }
}

/** @param {GameSettings} settings */
export function saveSettings(settings) {
  const s = clampSettings(settings);
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* quota / private mode */
  }
  return s;
}
