import { bayer } from '../pixel'
import type { LayerDef } from '../types'

/**
 * Easter egg: hold the moon (`sun:hold`) and green curtains of northern
 * lights ripple across the night sky for the rest of the visit. Draws
 * nothing until then, or outside the night palette. Sits right after
 * `stars` in each preset.
 */
export const aurora: LayerDef = {
  params: {
    height: { min: 0.1, max: 0.8, step: 0.05, default: 0.35 },
    speed: { min: 0, max: 3, step: 0.05, default: 0.5 },
    intensity: { min: 0.1, max: 1, step: 0.05, default: 0.7 },
  },
  draw(ctx, scene, p) {
    const found = scene.since('sun:hold')
    if (found === undefined || scene.time !== 'night') return
    const { w, horizon, t } = scene
    // Fade in over a couple of seconds rather than switching on.
    const fade = Math.min(1, found / 2) * p.intensity
    const glow = ['#7df0b4', '#4fd6a0', '#3aa9a8', '#6c7fd1']
    for (let x = 0; x < w; x++) {
      const top = Math.round(horizon * 0.12 + Math.sin(x * 0.045 + t * p.speed) * 5 + Math.sin(x * 0.13 - t * p.speed * 1.6) * 2)
      const len = horizon * p.height * (0.55 + 0.45 * Math.sin(x * 0.07 + t * p.speed * 0.8))
      for (let dy = 0; dy < len; dy++) {
        const k = dy / len
        // Brightest at the curtain's top edge, dithering away toward its hem.
        if ((1 - k) * fade < bayer(x, top + dy)) continue
        ctx.fillStyle = glow[Math.min(glow.length - 1, Math.floor(k * glow.length))]
        ctx.fillRect(x, top + dy, 1, 1)
      }
    }
  },
}
