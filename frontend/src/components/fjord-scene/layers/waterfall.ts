import { rng } from '../pixel'
import type { LayerDef } from '../types'

/** A thin fall down the near mountain wall, with a flickering splash where it meets the water. */
export const waterfall: LayerDef = {
  params: {
    x: { min: 0, max: 1, step: 0.01, default: 0.16 },
    width: { min: 1, max: 5, step: 1, default: 2 },
    speed: { min: 0, max: 40, step: 1, default: 7 },
    start: { min: 0, max: 1, step: 0.05, default: 0.15 },
  },
  draw(ctx, scene, p) {
    const { w, horizon, t, palette, seed } = scene
    const x0 = Math.round(p.x * (w - p.width))
    const tops = scene.shared.nearMountains as Int32Array | undefined
    const ridge = tops ? tops[x0] : Math.round(horizon * 0.5)
    const top = Math.round(ridge + (horizon - ridge) * p.start)
    if (top >= horizon - 1) return

    const step = Math.floor(t * p.speed)
    for (let y = top; y < horizon; y++) {
      for (let dx = 0; dx < p.width; dx++) {
        // Diagonal streaks sliding downward read as falling water at any width.
        const phase = (((y - step + dx * 2) % 6) + 6) % 6
        ctx.fillStyle = phase === 0 ? palette.water : phase === 1 ? palette.highlight : palette.foam
        ctx.fillRect(x0 + dx, y, 1, 1)
      }
    }

    const r = rng(seed + step, 'splash')
    ctx.fillStyle = palette.foam
    for (let i = 0; i < p.width * 3; i++) {
      const sx = x0 - 2 + Math.floor(r() * (p.width + 4))
      const sy = horizon - 1 + Math.floor(r() * 3) - (r() < 0.3 ? 1 : 0)
      ctx.fillRect(sx, sy, 1, 1)
    }
  },
}
