import type { LayerDef } from '../types'

const cache = new Map<string, HTMLImageElement>()

/**
 * Draws a hand-made PNG (e.g. from Aseprite/Piskel, dropped into
 * frontend/public/scene/) at native scene-pixel size — for when a
 * procedural layer isn't the look you want. Set `src` on the layer entry.
 */
export const image: LayerDef = {
  params: {
    x: { min: 0, max: 1, step: 0.01, default: 0.5 },
    y: { min: 0, max: 1, step: 0.01, default: 1 },
    anchorToHorizon: { min: 0, max: 1, step: 1, default: 1 },
  },
  draw(ctx, scene, p, entry) {
    if (!entry.src) return
    let img = cache.get(entry.src)
    if (!img) {
      img = new Image()
      img.onload = () => scene.requestRedraw()
      img.src = entry.src
      cache.set(entry.src, img)
    }
    if (!img.complete || img.naturalWidth === 0) return
    // x/y place the image's bottom-center; with anchorToHorizon, y is measured within the sky only.
    const floorY = p.anchorToHorizon ? scene.horizon : scene.h
    const dx = Math.round(p.x * scene.w - img.naturalWidth / 2)
    const dy = Math.round(p.y * floorY - img.naturalHeight)
    ctx.drawImage(img, dx, dy)
  },
}
