export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 96;
export const WORLD_SEA_LEVEL = 42;
/** Default view distance in chunks — higher = fuller horizons / forests */
export const RENDER_DISTANCE_DEFAULT = 6;
export const BLOCK_SIZE = 1;

export const GRAVITY = 28;
export const PLAYER_SPEED = 7.5;
export const PLAYER_SPRINT = 11.5;
export const PLAYER_JUMP = 9.2;
export const PLAYER_HEIGHT = 1.7;
export const PLAYER_WIDTH = 0.55;
export const PLAYER_EYE = 1.52;

export const REACH = 6.5;
export const DAY_LENGTH = 480; // seconds for full day cycle
export const BLOOD_MOON_CHANCE = 0.12; // per night start

/** Starter life — Classic is forgiving; crystals still raise the cap */
export const MAX_HP = 120;
export const MAX_MANA = 40;
export const MAX_HP_CAP = 400;
export const MAX_MANA_CAP = 200;

export const AUTO_SAVE_INTERVAL = 60;

export const DIRS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

export const FACE_VERTS = [
  [
    [1, 0, 0],
    [1, 1, 0],
    [1, 1, 1],
    [1, 0, 1],
  ],
  [
    [0, 0, 1],
    [0, 1, 1],
    [0, 1, 0],
    [0, 0, 0],
  ],
  [
    [0, 1, 1],
    [1, 1, 1],
    [1, 1, 0],
    [0, 1, 0],
  ],
  [
    [0, 0, 0],
    [1, 0, 0],
    [1, 0, 1],
    [0, 0, 1],
  ],
  [
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1],
  ],
  [
    [1, 0, 0],
    [0, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
  ],
];

export const FACE_SHADE = [0.8, 0.75, 1.0, 0.55, 0.9, 0.7];

/** @deprecated use settings.renderDistance — kept for tests */
export const RENDER_DISTANCE = RENDER_DISTANCE_DEFAULT;
