import { mix, rng } from '../pixel'
import type { LayerDef } from '../types'
import type { ValleyGeometry } from './valley'

/** Small streams running from the valley walls down into the main river. Needs the `valley` layer. */
export const tributaries: LayerDef = {
  params: {
    count: { min: 0, max: 8, step: 1, default: 3 },
    width: { min: 0.5, max: 4, step: 0.25, default: 1.5 },
    bend: { min: -1, max: 1, step: 0.05, default: 0.35 },
    speed: { min: 0, max: 10, step: 0.05, default: 0.4 },
  },
  draw(ctx, scene, p) {
    const v = scene.shared.valley as ValleyGeometry | undefined
    if (!v) return
    const { h, horizon, t, seed, palette } = scene
    const rows = h - horizon
    const r = rng(seed, 'tributaries')
    let side = r() < 0.5 ? -1 : 1

    for (let i = 0; i < p.count; i++) {
      side = -side
      const joinDepth = 0.18 + r() * 0.6
      const ym = horizon + Math.round(joinDepth * rows)
      const xm = v.riverCenter(ym) + side * (v.riverHalf(ym) - 0.5)
      const ys = horizon + Math.round(joinDepth * (0.3 + r() * 0.3) * rows)
      const wall = side < 0 ? v.wallLeft(ys) : v.wallRight(ys)
      // No walls → run in from a point partway across the meadow instead.
      const xs = Number.isFinite(wall) ? wall - side : xm + side * scene.w * 0.4
      // Bow the stream sideways so it curves instead of running dead straight.
      const cx = (xm + xs) / 2 + side * p.bend * Math.abs(ym - ys)
      const cy = (ym + ys) / 2 + p.bend * Math.abs(xm - xs) * 0.3
      const len = Math.hypot(xm - xs, ym - ys) + Math.abs(p.bend) * 20
      const steps = Math.ceil(len * 2)

      for (let s = 0; s <= steps; s++) {
        const u = s / steps
        const a = (1 - u) * (1 - u)
        const b = 2 * (1 - u) * u
        const cc = u * u
        const x = a * xs + b * cx + cc * xm
        const y = a * ys + b * cy + cc * ym
        const d = v.depth(y)
        const width = Math.max(1, Math.round(p.width * d * 1.6))
        // Pulses travel from source (u=0) to the mouth (u=1).
        const phase = u * len * 0.25 - t * p.speed
        const lit = phase - Math.floor(phase) < 0.15
        const fade = Math.pow(1 - d, 2.5) * 0.5
        ctx.fillStyle = mix(lit ? palette.highlight : palette.water, palette.skyBottom, fade)
        ctx.fillRect(Math.round(x - width / 2), Math.round(y), width, 1)
      }

      // A flicker of foam where it spills off the wall.
      if (Math.floor(t * 0.8 + i * 0.5) % 2 === 0) {
        ctx.fillStyle = palette.foam
        ctx.fillRect(Math.round(xs), ys, 1, 1)
      }
    }
  },
}
