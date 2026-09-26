import { bayer, fbm, hashString, mix } from '../pixel'
import type { LayerDef, PaletteColorKey } from '../types'

interface MountainColors {
  base: PaletteColorKey
  shade: PaletteColorKey
  light?: PaletteColorKey
}

/**
 * A ridge line of mountains sitting on the waterline. `valley` pulls the
 * middle down so the steep walls sit at the edges — the fjord shape. Writes
 * its ridge heights to `scene.shared[name]` for layers like the waterfall.
 */
function makeMountains(name: string, colors: MountainColors, defaults: Record<string, number> & { minFace?: number }): LayerDef {
  return {
    params: {
      height: { min: 0.05, max: 1, step: 0.01, default: defaults.height },
      roughness: { min: 0.005, max: 0.2, step: 0.005, default: defaults.roughness },
      jag: { min: 0, max: 0.9, step: 0.05, default: defaults.jag },
      valley: { min: 0, max: 1, step: 0.05, default: defaults.valley },
      snow: { min: 0, max: 1, step: 0.05, default: defaults.snow },
      offset: { min: 0, max: 100, step: 1, default: 0 },
      /** 1 = lit from the right (where the default sun sits), 0 = from the left. */
      lightFromRight: { min: 0, max: 1, step: 1, default: 1 },
      /** Lit/shaded faces narrower than this (px) merge into their neighbors. */
      minFace: { min: 1, max: 20, step: 1, default: defaults.minFace ?? 4 },
    },
    draw(ctx, scene, p) {
      const { w, horizon, palette, seed } = scene
      const tops = scene.memo(`${name}:${w}:${horizon}:${seed}:${Object.values(p).join(',')}`, () => {
        const out = new Int32Array(w)
        for (let x = 0; x < w; x++) {
          const n = fbm(seed ^ hashString(name), (x + p.offset * 10) * p.roughness, 4, p.jag)
          const edge = Math.abs(x / Math.max(1, w - 1) - 0.5) * 2 // 0 in the middle, 1 at the edges
          const shape = 1 - p.valley * (1 - Math.pow(edge, 1.5))
          out[x] = horizon - Math.round(p.height * horizon * (0.3 + 0.7 * n) * shape)
        }
        return out
      })
      scene.shared[name] = tops

      let highest = horizon
      for (let x = 0; x < w; x++) highest = Math.min(highest, tops[x])
      const snowLine = highest + (horizon - highest) * p.snow
      const shadedSnow = mix(palette.snow, palette[colors.shade], 0.45)

      // Faces turned toward the light are lit. Flat stretches keep the previous
      // column's state, and runs narrower than a few pixels are absorbed into
      // their neighbors — otherwise they show up as lone stripes.
      const litCols = new Uint8Array(w)
      let lit = -1
      for (let x = 0; x < w; x++) {
        const slope = x >= 3 && x + 3 < w ? tops[x + 3] - tops[x - 3] : 0
        if (slope !== 0) lit = (p.lightFromRight ? slope > 0 : slope < 0) ? 1 : 0
        litCols[x] = lit === -1 ? 255 : lit
      }
      const first = litCols.find((v) => v !== 255) ?? 0
      for (let x = 0; x < w && litCols[x] === 255; x++) litCols[x] = first
      for (let x = 0; x < w; ) {
        let end = x
        while (end < w && litCols[end] === litCols[x]) end++
        if (end - x < p.minFace && x > 0) litCols.fill(litCols[x - 1], x, end)
        x = end
      }

      for (let x = 0; x < w; x++) {
        const top = tops[x]
        const lit = litCols[x] === 1
        if (top >= horizon) continue
        ctx.fillStyle = palette[lit ? (colors.light ?? colors.base) : colors.shade]
        ctx.fillRect(x, top, 1, horizon - top)
        // A 1px base-colored rim along the ridge reads as a crisp silhouette.
        ctx.fillStyle = palette[colors.base]
        ctx.fillRect(x, top, 1, 1)
        // Let the snow line wander a few pixels per column so it doesn't cut straight across the range.
        const colSnow = snowLine + (fbm(seed ^ hashString(`${name}:snow`), x * 0.15, 2, 0.5) - 0.5) * (horizon - highest) * 0.25
        if (p.snow > 0 && top < colSnow) {
          ctx.fillStyle = lit ? palette.snow : shadedSnow
          for (let y = top; y < colSnow; y++) {
            // Dither the bottom of the cap so it frays instead of ending in a hard edge.
            const edge = (colSnow - y) / Math.max(1, colSnow - highest)
            if (edge < 0.25 && edge * 4 < bayer(x, y)) continue
            ctx.fillRect(x, y, 1, 1)
          }
        }
      }
    },
  }
}

export const farMountains = makeMountains(
  'farMountains',
  { base: 'far', shade: 'farShade' },
  { height: 0.55, roughness: 0.04, jag: 0.5, valley: 0.2, snow: 0.25 },
)

export const midMountains = makeMountains(
  'midMountains',
  { base: 'mid', shade: 'midShade', light: 'midLight' },
  { height: 0.6, roughness: 0.05, jag: 0.5, valley: 0.6, snow: 0.1 },
)

export const nearMountains = makeMountains(
  'nearMountains',
  { base: 'near', shade: 'nearShade', light: 'nearLight' },
  { height: 0.9, roughness: 0.03, jag: 0.55, valley: 0.85, snow: 0.2, minFace: 10 },
)
