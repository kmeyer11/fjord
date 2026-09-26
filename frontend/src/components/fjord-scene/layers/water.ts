import { band, hexToRgb, mixRgb } from '../pixel'
import type { LayerDef } from '../types'

/**
 * Everything below the waterline: banded water color with a wobbling mirror
 * image of whatever the earlier layers drew above it. Has to come after the
 * sky/mountain/waterfall layers — it reflects the canvas as it stands.
 */
export const water: LayerDef = {
  params: {
    bands: { min: 2, max: 8, step: 1, default: 4 },
    reflect: { min: 0, max: 1, step: 0.05, default: 0.45 },
    waveAmp: { min: 0, max: 4, step: 0.25, default: 1.5 },
    waveSpeed: { min: 0, max: 6, step: 0.1, default: 0.8 },
    waveLength: { min: 0.1, max: 2, step: 0.05, default: 0.7 },
  },
  draw(ctx, scene, p) {
    const { w, h, horizon, t, palette } = scene
    const depthPx = h - horizon
    if (depthPx <= 0) return
    const above = ctx.getImageData(0, 0, w, horizon).data
    const out = ctx.createImageData(w, depthPx)
    const shallow = hexToRgb(palette.water)
    const deep = hexToRgb(palette.waterDeep)

    for (let i = 0; i < depthPx; i++) {
      const depth = i / Math.max(1, depthPx - 1)
      const sy = Math.max(0, horizon - 1 - i)
      // Wobble grows toward the viewer, and whole rows shift together — the classic pixel-art water look.
      const offset = Math.round(Math.sin(t * p.waveSpeed + i * p.waveLength) * p.waveAmp * (0.3 + depth))
      const reflect = p.reflect * (1 - depth * 0.7)
      for (let x = 0; x < w; x++) {
        const base = mixRgb(shallow, deep, band(depth, p.bands, x, i))
        const sx = Math.min(w - 1, Math.max(0, x + offset))
        const si = (sy * w + sx) * 4
        const c = mixRgb(base, [above[si], above[si + 1], above[si + 2]], reflect)
        const o = (i * w + x) * 4
        out.data[o] = c[0]
        out.data[o + 1] = c[1]
        out.data[o + 2] = c[2]
        out.data[o + 3] = 255
      }
    }
    ctx.putImageData(out, 0, horizon)
  },
}
