import type { Palette, ScenePreset, TimeOfDay } from './types'

export const TIMES_OF_DAY: TimeOfDay[] = ['morning', 'day', 'evening', 'night']

export function timeOfDayFor(date: Date): TimeOfDay {
  const h = date.getHours()
  if (h >= 5 && h < 10) return 'morning'
  if (h >= 10 && h < 17) return 'day'
  if (h >= 17 && h < 22) return 'evening'
  return 'night'
}

/**
 * Hand-tuned palettes, built around the app's own tokens in index.css
 * (fjord #3c6e90, glacier #2f8f89, heather #75587f, clay #9c4a34, linen
 * #f2efe9) rather than read from CSS at runtime — pixel art wants a few
 * exact, deliberately chosen colors per mood, not a generic derivation.
 */
export const PALETTES: Record<TimeOfDay, Palette> = {
  morning: {
    skyTop: '#9fb6cc',
    skyBottom: '#f1d9b8',
    sun: '#ffe7b0',
    far: '#a7a8b8',
    farShade: '#9596a9',
    mid: '#848999',
    midShade: '#717687',
    midLight: '#9a9cab',
    near: '#5a6474',
    nearShade: '#454e5e',
    nearLight: '#7a7f8c',
    snow: '#f7e9dc',
    water: '#6d8ea6',
    waterDeep: '#3c6e90',
    highlight: '#ffeccc',
    foam: '#eef3f4',
    cloud: '#f6e3d3',
    boat: '#9c4a34',
    sail: '#f2efe9',
    ground: '#6f8a5a',
    groundShade: '#56704a',
    grassLight: '#9fb07a',
    starAlpha: 0,
    dim: 0.15,
  },
  day: {
    skyTop: '#86b3cb',
    skyBottom: '#e6ecea',
    sun: '#fff6dc',
    far: '#8ea6b6',
    farShade: '#7c94a6',
    mid: '#6f8797',
    midShade: '#5e7586',
    midLight: '#8098a8',
    near: '#4a6272',
    nearShade: '#3a4f5e',
    nearLight: '#5f7888',
    snow: '#f2efe9',
    water: '#3c7a98',
    waterDeep: '#2b5670',
    highlight: '#e8f4f5',
    foam: '#e4f0f2',
    cloud: '#f7f5f0',
    boat: '#9c4a34',
    sail: '#f2efe9',
    ground: '#6b8f4e',
    groundShade: '#57784a',
    grassLight: '#8fae68',
    starAlpha: 0,
    dim: 0,
  },
  evening: {
    skyTop: '#4b4468',
    skyBottom: '#d99a7a',
    sun: '#f6c28b',
    far: '#6d5a7a',
    farShade: '#5d4c6b',
    mid: '#564964',
    midShade: '#473c54',
    midLight: '#665575',
    near: '#3b3548',
    nearShade: '#2c2838',
    nearLight: '#55496a',
    snow: '#e8c9c0',
    water: '#5a4d6e',
    waterDeep: '#2f2a44',
    highlight: '#f3c39e',
    foam: '#e9cfc4',
    cloud: '#c98e8e',
    boat: '#2c2838',
    sail: '#e8c9c0',
    ground: '#5a5a4e',
    groundShade: '#443f45',
    grassLight: '#8a7a6a',
    starAlpha: 0.35,
    dim: 0.35,
  },
  night: {
    skyTop: '#0f1726',
    skyBottom: '#243650',
    sun: '#e8eef2',
    far: '#243449',
    farShade: '#1c2a3d',
    mid: '#1e2b3d',
    midShade: '#172232',
    midLight: '#233349',
    near: '#16202e',
    nearShade: '#101824',
    nearLight: '#22324a',
    snow: '#8fa3b8',
    water: '#1d2d42',
    waterDeep: '#111c2b',
    highlight: '#c9d8e6',
    foam: '#9fb3c6',
    cloud: '#2d3e55',
    boat: '#3a2a24',
    sail: '#8fa3b8',
    ground: '#1d2a26',
    groundShade: '#141e1c',
    grassLight: '#2c3d36',
    starAlpha: 1,
    dim: 0.65,
  },
}

export function paletteFor(preset: ScenePreset, time: TimeOfDay): Palette {
  return { ...PALETTES[time], ...preset.palette?.[time] }
}
