import { rng } from '../pixel'
import type { LayerDef } from '../types'

/**
 * Flat, stepped pixel clouds drifting right. Drawn before the mountains so
 * peaks cover them. Clicking one (`cloud:<i>`) blows it off-screen — Home
 * uses the same click to move on to the next scene.
 */
export const clouds: LayerDef = {
  params: {
    count: { min: 0, max: 12, step: 1, default: 4 },
    speed: { min: 0, max: 6, step: 0.1, default: 1 },
    size: { min: 4, max: 40, step: 1, default: 16 },
    maxY: { min: 0.1, max: 1, step: 0.05, default: 0.55 },
    alpha: { min: 0, max: 1, step: 0.05, default: 0.85 },
  },
  draw(ctx, scene, p) {
    const { w, horizon, t, seed, palette } = scene
    const r = rng(seed, 'clouds')
    ctx.fillStyle = palette.cloud
    ctx.globalAlpha = p.alpha
    for (let i = 0; i < p.count; i++) {
      const cw = Math.round(p.size * (0.6 + r() * 0.8))
      const y = Math.round(2 + r() * (horizon * p.maxY - 6))
      const x0 = r() * (w + cw)
      // Nearer (lower) clouds drift faster — a cheap bit of parallax.
      const speed = p.speed * (0.5 + y / horizon)
      let x = Math.round(((x0 + t * speed) % (w + cw)) - cw)
      const blown = scene.since(`cloud:${i}`)
      if (blown !== undefined && blown < 0.8) {
        if (blown >= 0.5) continue
        x += Math.round(Math.pow(blown / 0.5, 2) * (w + cw))
      }
      const bump = Math.round(cw * (0.2 + r() * 0.3))
      ctx.fillRect(x, y + 2, cw, 2)
      ctx.fillRect(x + Math.round(cw * 0.15), y + 1, Math.round(cw * 0.7), 1)
      ctx.fillRect(x + bump, y, Math.round(cw * 0.35), 1)
      scene.hit(`cloud:${i}`, x - 1, y - 1, cw + 2, 6)
    }
    ctx.globalAlpha = 1
  },
}
