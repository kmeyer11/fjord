import { mix, rng } from '../pixel'
import { drawSprite } from '../sprite'
import type { LayerDef } from '../types'
import type { ValleyGeometry } from './valley'

// Pines by size; 'a' dark needles, 'c' the sunlit (right) side, 'b' trunk.
const PINES = [
  ['.c.', 'acc', '.b.'],
  ['..c..', '.acc.', '..c..', '.accc', 'aaccc', '..b..'],
  ['...c...', '..acc..', '.aaccc.', '...c...', '..accc.', '.aacccc', 'aaacccc', '...b...'],
]

/**
 * Pine trees scattered along the foot of the valley walls and out across
 * the meadow, bigger the nearer they stand, drawn far-to-near so closer
 * trees overlap farther ones. Needs the `valley` layer.
 */
export const forest: LayerDef = {
  params: {
    count: { min: 0, max: 200, step: 1, default: 70 },
    /** How far out from the walls onto the meadow the trees spread (fraction of width at the bottom). */
    spread: { min: 0, max: 0.5, step: 0.01, default: 0.12 },
    /** Share of trees that stray out into the open meadow instead of hugging the walls. */
    scatter: { min: 0, max: 1, step: 0.05, default: 0.2 },
    size: { min: 0.5, max: 4, step: 0.25, default: 2 },
  },
  draw(ctx, scene, p) {
    const v = scene.shared.valley as ValleyGeometry | undefined
    if (!v) return
    const { w, h, horizon, seed, palette } = scene
    const rows = h - horizon
    const r = rng(seed, 'forest')
    const colors = {
      a: mix(palette.groundShade, palette.nearShade, 0.55),
      c: mix(palette.groundShade, palette.ground, 0.3),
      b: mix('#4a3426', palette.nearShade, palette.dim),
    }

    const trees: { x: number; y: number; d: number }[] = []
    for (let i = 0; i < p.count; i++) {
      const d = 0.06 + Math.pow(r(), 0.8) * 0.94
      const y = horizon + Math.round(d * rows)
      const side = r() < 0.5 ? -1 : 1
      const wall = side < 0 ? v.wallLeft(y) : v.wallRight(y)
      const bank = v.riverCenter(y) + side * (v.riverHalf(y) + 1)
      let x: number
      if (r() < p.scatter) x = bank + (wall - bank) * r()
      else x = wall - side * r() * p.spread * w * d
      if (!Number.isFinite(x) || Math.abs(x - v.riverCenter(y)) < v.riverHalf(y) + 2) continue
      trees.push({ x, y, d })
    }
    trees.sort((a, b) => a.y - b.y)

    for (const t of trees) {
      const px = t.d * p.size
      const sprite = PINES[px < 0.6 ? 0 : px < 1.3 ? 1 : 2]
      const scale = Math.max(1, Math.round(px / 1.3))
      const sw = sprite[0].length * scale
      const sh = sprite.length * scale
      drawSprite(ctx, sprite, colors, t.x - sw / 2, t.y - sh + 1, scale)
    }
  },
}
