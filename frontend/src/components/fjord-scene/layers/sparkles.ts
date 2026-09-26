import { rng } from '../pixel'
import type { LayerDef } from '../types'

/** Short light dashes gliding across the water — the "running water" shimmer. */
export const sparkles: LayerDef = {
  params: {
    count: { min: 0, max: 120, step: 1, default: 28 },
    speed: { min: 0, max: 20, step: 0.5, default: 2 },
    length: { min: 1, max: 8, step: 1, default: 3 },
    twinkle: { min: 0, max: 1, step: 0.05, default: 0.5 },
    alpha: { min: 0, max: 1, step: 0.05, default: 0.8 },
  },
  draw(ctx, scene, p) {
    const { w, h, horizon, t, seed, palette } = scene
    const depthPx = h - horizon
    const r = rng(seed, 'sparkles')
    ctx.fillStyle = palette.highlight
    for (let i = 0; i < p.count; i++) {
      // Squared random clusters sparkles near the horizon, where they'd be foreshortened.
      const depth = r() * r()
      const y = horizon + 1 + Math.floor(depth * (depthPx - 2))
      const len = Math.max(1, Math.round(p.length * (0.4 + depth * 1.2)))
      const speed = p.speed * (0.4 + depth * 1.2) * (r() < 0.5 ? 1 : 0.7)
      const x = Math.round(((r() * (w + len) + t * speed) % (w + len)) - len)
      const phase = r() * Math.PI * 2
      const on = Math.sin(t * 1.25 + phase)
      if (on < p.twinkle * 2 - 1) continue
      ctx.globalAlpha = p.alpha
      ctx.fillRect(x, y, len, 1)
    }
    ctx.globalAlpha = 1
  },
}
