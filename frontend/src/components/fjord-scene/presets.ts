import type { ScenePreset } from './types'

/**
 * Scenes as plain data. Params left out fall back to each layer's default
 * (see the layer files). Users cycle through these in order by clicking a
 * cloud (see Home.tsx), so every preset needs a `clouds` layer.
 */
export const PRESETS: Record<string, ScenePreset> = {
  calm: {
    pixelHeight: 120,
    fps: 12,
    horizon: 0.62,
    seed: 7,
    layers: [
      { type: 'sky' },
      { type: 'stars' },
      { type: 'aurora' },
      { type: 'clouds' },
      { type: 'farMountains' },
      { type: 'nearMountains' },
      { type: 'waterfall' },
      { type: 'water' },
      { type: 'sparkles' },
      { type: 'boat' },
    ],
  },

  dramatic: {
    pixelHeight: 140,
    fps: 12,
    horizon: 0.7,
    seed: 23,
    layers: [
      { type: 'sky', params: { bands: 8, sunY: 0.2, sunSize: 4 } },
      { type: 'stars', params: { count: 120 } },
      { type: 'aurora' },
      { type: 'clouds', params: { count: 6, speed: 2, maxY: 0.4 } },
      { type: 'farMountains', params: { height: 0.8, roughness: 0.06, jag: 0.65, snow: 0.45 } },
      { type: 'nearMountains', params: { height: 1, roughness: 0.045, jag: 0.7, valley: 0.95, snow: 0.3 } },
      { type: 'waterfall', params: { x: 0.12, width: 3, speed: 10, start: 0.05 } },
      { type: 'water', params: { reflect: 0.6, waveAmp: 2 } },
      { type: 'sparkles', params: { count: 40, speed: 3 } },
      { type: 'boat', params: { depth: 0.45, scale: 2, speed: 2 } },
    ],
  },

  minimal: {
    pixelHeight: 90,
    fps: 8,
    horizon: 0.58,
    seed: 3,
    layers: [
      { type: 'sky', params: { bands: 4, sunSize: 0 } },
      { type: 'stars', params: { count: 30 } },
      { type: 'aurora' },
      { type: 'clouds', params: { count: 2, speed: 0.6 } },
      { type: 'farMountains', params: { height: 0.4, jag: 0.35, valley: 0, snow: 0 } },
      { type: 'nearMountains', enabled: false },
      { type: 'water', params: { bands: 2, reflect: 0.3, waveAmp: 1 } },
      { type: 'sparkles', params: { count: 14, speed: 1, length: 2 } },
      { type: 'boat', params: { depth: 0.2, speed: 0.6 } },
    ],
  },

  valley: {
    pixelHeight: 140,
    fps: 12,
    horizon: 0.48,
    seed: 11,
    layers: [
      { type: 'sky', params: { sunX: 0.62, sunY: 0.45 } },
      { type: 'stars' },
      { type: 'aurora' },
      { type: 'clouds', params: { maxY: 0.5 } },
      { type: 'farMountains', params: { height: 0.5, roughness: 0.07, jag: 0.6, valley: 0, snow: 0.35 } },
      { type: 'midMountains', params: { height: 0.55, roughness: 0.045, valley: 0.35, snow: 0.08, offset: 30 } },
      { type: 'nearMountains', params: { height: 1, valley: 1, snow: 0.2 } },
      { type: 'valley', params: { floorNear: 0.75, floorFar: 0.06, riverNear: 0.35 } },
      { type: 'tributaries' },
      { type: 'forest' },
      { type: 'animals' },
    ],
  },
}

export const DEFAULT_PRESET = 'valley'
