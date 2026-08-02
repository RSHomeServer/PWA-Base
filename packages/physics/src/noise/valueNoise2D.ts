/**
 * Deterministic 32-bit integer hash of a lattice point + seed, mapped to `[0, 1)`.
 * Uses `Math.imul` throughout so results are bit-exact regardless of platform
 * (unlike naive `*`, which loses precision once products exceed 2^53).
 */
function hashToUnitFloat(ix: number, iy: number, seed: number): number {
  let h = Math.imul(ix, 374761393);
  h = Math.imul(h ^ Math.imul(iy, 668265263), 2246822519);
  h = Math.imul(h ^ Math.imul(seed, 3266489917 | 0), 3266489917 | 0);
  h ^= h >>> 15;
  h = Math.imul(h, 2654435761);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967295;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Bilinearly-interpolated value noise (Perlin's predecessor): deterministic for a
 * given `(x, y, seed)`, continuous, range approximately `[0, 1)`.
 */
export function valueNoise2D(x: number, y: number, seed = 0): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothstep(x - x0);
  const ty = smoothstep(y - y0);

  const v00 = hashToUnitFloat(x0, y0, seed);
  const v10 = hashToUnitFloat(x0 + 1, y0, seed);
  const v01 = hashToUnitFloat(x0, y0 + 1, seed);
  const v11 = hashToUnitFloat(x0 + 1, y0 + 1, seed);

  const top = v00 + (v10 - v00) * tx;
  const bottom = v01 + (v11 - v01) * tx;
  return top + (bottom - top) * ty;
}

export interface FbmOptions {
  /** Number of noise layers summed. Defaults to 4. */
  octaves?: number;
  /** Frequency multiplier applied per octave. Defaults to 2. */
  lacunarity?: number;
  /** Amplitude multiplier applied per octave. Defaults to 0.5. */
  gain?: number;
  seed?: number;
}

/** Fractal Brownian motion: a normalized sum of `valueNoise2D` octaves, giving more
 * natural, detailed variation than a single noise layer. Deterministic per seed. */
export function fbm(x: number, y: number, options: FbmOptions = {}): number {
  const octaves = options.octaves ?? 4;
  const lacunarity = options.lacunarity ?? 2;
  const gain = options.gain ?? 0.5;
  const seed = options.seed ?? 0;

  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  let maxAmplitude = 0;

  for (let i = 0; i < octaves; i++) {
    total += valueNoise2D(x * frequency, y * frequency, seed + i * 1013) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return maxAmplitude > 0 ? total / maxAmplitude : 0;
}
