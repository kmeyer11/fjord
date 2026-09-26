import { band, bayer, hexToRgb, mixRgb } from '../pixel'
import type { LayerDef } from '../types'

/** Banded, dithered gradient down to the waterline, plus a sun (or moon, at night). */
export const sky: LayerDef = {
  params: {
    bands: { min: 2, max: 12, step: 1, default: 6 },
    sunX: { min: 0, max: 1, step: 0.01, default: 0.72 },
    sunY: { min: 0, max: 1, step: 0.01, default: 0.35 },
    sunSize: { min: 0, max: 12, step: 1, default: 5 },
  },
  draw(ctx, scene, p) {
    const { w, horizon, palette } = scene
    const key = `sky:${w}:${horizon}:${palette.skyTop}:${palette.skyBottom}:${palette.sun}:${Object.values(p).join(',')}`
    const img = scene.memo(key, () => {
      const data = ctx.createImageData(w, horizon)
      const top = hexToRgb(palette.skyTop)
      const bottom = hexToRgb(palette.skyBottom)
      const sun = hexToRgb(palette.sun)
      const cx = p.sunX * w
      const cy = p.sunY * horizon
      const r = p.sunSize
      for (let y = 0; y < horizon; y++) {
        for (let x = 0; x < w; x++) {
          let c = mixRgb(top, bottom, band(y / Math.max(1, horizon - 1), p.bands, x, y))
          if (r > 0) {
            const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
            if (d <= r) c = sun
            // A dithered halo one radius wide, so the disc glows without a smooth gradient.
            else if (d <= r * 2 && 1 - (d - r) / r > bayer(x, y)) c = mixRgb(c, sun, 0.35)
          }
          const i = (y * w + x) * 4
          data.data[i] = c[0]
          data.data[i + 1] = c[1]
          data.data[i + 2] = c[2]
          data.data[i + 3] = 255
        }
      }
      return data
    })
    ctx.putImageData(img, 0, 0)
    if (p.sunSize > 0) {
      // A little padding around the disc, so it's tappable on a phone.
      const r = p.sunSize + 2
      scene.hit('sun', p.sunX * w - r, p.sunY * horizon - r, r * 2, r * 2)
    }
  },
}
