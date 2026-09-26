/** Small helpers every layer leans on: seeded randomness, 1D noise, color math, dithering. */

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Deterministic PRNG (mulberry32) — same seed + salt gives the same scene every visit. */
export function rng(seed: number, salt: string): () => number {
  let a = (seed ^ hashString(salt)) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function lattice(seed: number, i: number): number {
  let h = Math.imul(i ^ seed, 0x27d4eb2d)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296
}

/** Smooth 1D value noise in [0, 1]. */
export function noise1(seed: number, x: number): number {
  const i = Math.floor(x)
  const f = x - i
  const s = f * f * (3 - 2 * f)
  return lattice(seed, i) * (1 - s) + lattice(seed, i + 1) * s
}

/** Fractal noise in [0, 1] — `gain` controls how jagged the higher octaves make it. */
export function fbm(seed: number, x: number, octaves: number, gain: number): number {
  let sum = 0
  let amp = 1
  let norm = 0
  let freq = 1
  for (let o = 0; o < octaves; o++) {
    sum += noise1(seed + o * 101, x * freq) * amp
    norm += amp
    amp *= gain
    freq *= 2
  }
  return sum / norm
}

export type RGB = [number, number, number]

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex([r, g, b]: RGB): string {
  return `#${((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1)}`
}

export function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

export function mix(a: string, b: string, t: number): string {
  return rgbToHex(mixRgb(hexToRgb(a), hexToRgb(b), t))
}

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

/** Ordered-dither threshold in (0, 1) for pixel (x, y) — compare a blend factor against it to pick one of two colors. */
export function bayer(x: number, y: number): number {
  return (BAYER4[y & 3][x & 3] + 0.5) / 16
}

/**
 * Quantize a 0–1 value to `steps` hard bands. Only a strip of width `soft`
 * (as a fraction of a band) at each seam is dithered; the rest stays flat.
 */
export function band(value: number, steps: number, x: number, y: number, soft = 0.35): number {
  const scaled = value * (steps - 1)
  const lo = Math.floor(scaled)
  const frac = Math.min(1, Math.max(0, (scaled - lo - 0.5) / soft + 0.5))
  return Math.min(steps - 1, lo + (frac > bayer(x, y) ? 1 : 0)) / (steps - 1)
}

/** Stable per-pixel random in [0, 1) — for static texture like grass tufts and trees. */
export function hash2(seed: number, x: number, y: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
