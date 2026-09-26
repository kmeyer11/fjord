import { rng } from '../pixel'
import type { LayerDef } from '../types'

/** Only shows when the palette's starAlpha is above 0 (evening/night). */
export const stars: LayerDef = {
  params: {
    count: { min: 0, max: 200, step: 1, default: 60 },
    twinkle: { min: 0, max: 1, step: 0.05, default: 0.4 },
  },
  draw(ctx, scene, p) {
    const { w, horizon, palette, t, seed } = scene
    if (palette.starAlpha <= 0) return
    const r = rng(seed, 'stars')
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < p.count; i++) {
      const x = Math.floor(r() * w)
      // Bias toward the top of the sky, where it's darkest.
      const y = Math.floor(r() * r() * horizon * 0.8)
      const phase = r() * Math.PI * 2
      const flicker = 1 - p.twinkle * (0.5 + 0.5 * Math.sin(t * (1 + r() * 2) + phase))
      ctx.globalAlpha = palette.starAlpha * flicker * (0.4 + r() * 0.6)
      ctx.fillRect(x, y, 1, 1)
    }
    ctx.globalAlpha = 1
  },
}
