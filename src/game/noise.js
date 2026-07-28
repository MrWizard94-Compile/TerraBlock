/** Lightweight seeded noise for terrain */

export function hash2(x, z, seed = 0) {
  let n = x * 374761393 + z * 668265263 + seed * 1274126177;
  n = (n ^ (n >> 13)) * 1274126177;
  n = n ^ (n >> 16);
  return (n >>> 0) / 4294967296;
}

export function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function valueNoise2D(x, z, seed = 0) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = fade(x - x0);
  const fz = fade(z - z0);
  const v00 = hash2(x0, z0, seed);
  const v10 = hash2(x0 + 1, z0, seed);
  const v01 = hash2(x0, z0 + 1, seed);
  const v11 = hash2(x0 + 1, z0 + 1, seed);
  return lerp(lerp(v00, v10, fx), lerp(v01, v11, fx), fz);
}

export function fbm2D(x, z, seed = 0, octaves = 4) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2D(x * freq, z * freq, seed + i * 101) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

export function valueNoise3D(x, y, z, seed = 0) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const fx = fade(x - x0);
  const fy = fade(y - y0);
  const fz = fade(z - z0);

  const n = (ix, iy, iz) => {
    let h = ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed * 1274126177;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967296;
  };

  const y0z0 = lerp(n(x0, y0, z0), n(x0 + 1, y0, z0), fx);
  const y0z1 = lerp(n(x0, y0, z0 + 1), n(x0 + 1, y0, z0 + 1), fx);
  const y1z0 = lerp(n(x0, y0 + 1, z0), n(x0 + 1, y0 + 1, z0), fx);
  const y1z1 = lerp(n(x0, y0 + 1, z0 + 1), n(x0 + 1, y0 + 1, z0 + 1), fx);
  return lerp(lerp(y0z0, y1z0, fy), lerp(y0z1, y1z1, fy), fz);
}
