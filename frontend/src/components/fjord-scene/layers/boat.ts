import { drawSprite } from '../sprite'
import type { LayerDef } from '../types'

// s = sail, m = mast, h = hull. Edit the art right here — any size works.
const SPRITE = [
  '   m    ',
  '   ms   ',
  '   mss  ',
  '   msss ',
  '   mssss',
  '   m    ',
  'hhhhhhhh',
  ' hhhhhh ',
]

/** A small sailboat drifting across and bobbing on the swell. */
export const boat: LayerDef = {
  params: {
    speed: { min: 0, max: 10, step: 0.1, default: 1.2 },
    depth: { min: 0, max: 1, step: 0.05, default: 0.3 },
    scale: { min: 1, max: 4, step: 1, default: 1 },
    bob: { min: 0, max: 3, step: 1, default: 1 },
    start: { min: 0, max: 1, step: 0.01, default: 0.35 },
  },
  draw(ctx, scene, p) {
    const { w, h, horizon, t, palette } = scene
    const s = p.scale
    const bw = SPRITE[0].length * s
    const bh = SPRITE.length * s
    const span = w + bw
    const x = Math.round(((p.start * span + t * p.speed) % span) - bw)
    const waterline = horizon + Math.round(p.depth * (h - horizon))
    const y = waterline - bh + s + Math.round(Math.sin(t * 1.8) * p.bob)
    drawSprite(ctx, SPRITE, { s: palette.sail, m: palette.boat, h: palette.boat }, x, y, s)
  },
}
