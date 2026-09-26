import { band, bayer, fbm, hash2, hashString, hexToRgb, mixRgb, type RGB } from '../pixel'
import type { LayerDef } from '../types'

/**
 * Where things are in the valley, per screen row below the horizon.
 * Published on `scene.shared.valley` for layers drawn on top (tributaries, animals).
 */
export interface ValleyGeometry {
  /** 0 at the horizon (far) → 1 at the bottom edge (near). */
  depth(y: number): number
  riverCenter(y: number): number
  riverHalf(y: number): number
  wallLeft(y: number): number
  wallRight(y: number): number
}

/**
 * A river running away from the viewer toward a vanishing point, through a
 * meadow, between two valley walls that close in with distance. Replaces
 * the `water` layer in scenes that use it. The flow stripes move toward the
 * viewer and are spaced by depth, so they speed up and spread as they near.
 */
export const valley: LayerDef = {
  params: {
    vanishX: { min: 0.1, max: 0.9, step: 0.01, default: 0.5 },
    riverNear: { min: 0.05, max: 1, step: 0.01, default: 0.4 },
    riverFar: { min: 0, max: 0.1, step: 0.005, default: 0.01 },
    meander: { min: 0, max: 0.4, step: 0.01, default: 0.12 },
    meanderFreq: { min: 0, max: 4, step: 0.05, default: 1.1 },
    floorNear: { min: 0.3, max: 3, step: 0.05, default: 1.5 },
    /** Only used without a nearMountains layer; otherwise the walls start where the mountains meet the horizon. */
    floorFar: { min: 0, max: 0.6, step: 0.01, default: 0.14 },
    wallJag: { min: 0, max: 0.2, step: 0.005, default: 0.04 },
    walls: { min: 0, max: 1, step: 1, default: 1 },
    trees: { min: 0, max: 0.6, step: 0.01, default: 0 },
    /** How much of the mountain faces is cut by dark gullies running down toward the valley. */
    crevices: { min: 0, max: 1, step: 0.05, default: 0.2 },
    creviceScale: { min: 0.5, max: 20, step: 0.1, default: 5 },
    /** Rock ledges receding along the walls — how many per unit of depth. */
    ledges: { min: 0, max: 6, step: 0.1, default: 1.2 },
    /** Width of the forest band along the foot of the walls, as a fraction of the width at the bottom. */
    forest: { min: 0, max: 0.4, step: 0.01, default: 0.12 },
    /** Shade the walls cast onto the meadow (the right wall more, since the light comes from the right). */
    shadow: { min: 0, max: 0.4, step: 0.01, default: 0.14 },
    tufts: { min: 0, max: 0.3, step: 0.01, default: 0.08 },
    haze: { min: 0, max: 1, step: 0.05, default: 0.5 },
    flowSpeed: { min: 0, max: 6, step: 0.05, default: 0.45 },
    flowDensity: { min: 1, max: 40, step: 0.5, default: 14 },
    bands: { min: 2, max: 8, step: 1, default: 4 },
  },
  draw(ctx, scene, p) {
    const { w, h, horizon, t, seed, palette } = scene
    const rows = h - horizon
    if (rows <= 0) return

    const depth = (y: number) => Math.min(1, Math.max(0.001, (y - horizon + 1) / rows))
    const vx = p.vanishX * w
    const riverCenter = (y: number) => {
      const d = depth(y)
      return vx + p.meander * w * d * Math.sin(p.meanderFreq / d + seed)
    }
    const riverHalf = (y: number) => (w * (p.riverFar + (p.riverNear - p.riverFar) * depth(y))) / 2

    // The walls are the near mountains carried on down to the valley floor. Start
    // them exactly where the mountains' inner slopes meet the horizon, so the
    // slope just continues; fall back to `floorFar` without a nearMountains layer.
    const ridge = scene.shared.nearMountains as Int32Array | undefined
    let farLeft = vx - (w * p.floorFar) / 2
    let farRight = vx + (w * p.floorFar) / 2
    const vxi = Math.round(vx)
    if (ridge && ridge[vxi] >= horizon) {
      let l = vxi
      while (l > 0 && ridge[l - 1] >= horizon) l--
      let r = vxi
      while (r < w - 1 && ridge[r + 1] >= horizon) r++
      farLeft = l
      farRight = r + 1
    }
    const nearHalf = (w * p.floorNear) / 2
    const jag = (y: number, side: number) => (fbm(seed + side * 977, y * 0.35, 3, 0.5) - 0.5) * p.wallJag * w * 2 * depth(y)
    const wallLeft = (y: number) =>
      p.walls ? farLeft + (vx - nearHalf - farLeft) * depth(y) + jag(y, 1) : -Infinity
    const wallRight = (y: number) =>
      p.walls ? farRight + (vx + nearHalf - farRight) * depth(y) + jag(y, 2) : Infinity
    scene.shared.valley = { depth, riverCenter, riverHalf, wallLeft, wallRight } satisfies ValleyGeometry

    const c = (hex: string) => hexToRgb(hex)
    const water = c(palette.water)
    const deep = c(palette.waterDeep)
    const sky = c(palette.skyBottom)
    const highlight = c(palette.highlight)
    const ground = c(palette.ground)
    const groundShade = c(palette.groundShade)
    const grass = c(palette.grassLight)
    const far = c(palette.far)
    const wallLit = c(palette.nearLight)
    const wallDark = c(palette.nearShade)
    const tree = mixRgb(groundShade, wallDark, 0.6)
    const treeDark = mixRgb(tree, wallDark, 0.6)
    const gully = mixRgb(wallDark, [0, 0, 0], 0.35)
    const castShadow = mixRgb(groundShade, wallDark, 0.45)
    // The mountains' bottom row, which each wall column continues downward.
    const base = ctx.getImageData(0, horizon - 1, w, 1).data
    const creviceSeed = seed ^ hashString('crevices')
    const ledgeSeed = seed ^ hashString('ledges')

    /**
     * Rock texture for the near mountain faces, in perspective: gullies are
     * lines through the vanishing point, ledges are rows of constant depth.
     * Uses the distance from the horizon both above and below it, so the
     * pattern runs straight on across the horizon without a seam.
     */
    function rock(col: RGB, x: number, y: number): RGB {
      const ad = Math.max(0.03, Math.abs(y + 0.5 - horizon) / rows)
      // Screen-width units at unit depth: constant along any line through the vanishing point.
      const lateral = (x + 0.5 - vx) / (ad * w)
      // Ridged noise: peaks where the noise crosses its midpoint, giving thin branching lines, not blobs.
      // A little depth in the input makes the gullies wander instead of running dead straight.
      const g = 1 - Math.abs(fbm(creviceSeed, lateral * p.creviceScale + Math.log(1 / ad) * 0.6, 3, 0.5) * 2 - 1)
      const threshold = 1 - p.crevices * 0.2
      // Fade out toward the horizon, where the perspective coordinate races and the pattern turns to mush.
      const strength = Math.min(1, Math.max(0, (ad - 0.08) / 0.15))
      if (g > threshold && ((g - threshold) / (1 - threshold)) * 2 * strength > bayer(x, y)) return mixRgb(col, gully, 0.35)
      if (p.ledges > 0 && ad > 0.1) {
        // Spaced evenly in log-depth, so they don't bunch up into solid bands near the horizon.
        const at = (a: number) => Math.log(1 / a) * p.ledges
        const next = Math.max(0.03, Math.abs(y + 1.5 - horizon) / rows)
        const edge = Math.floor(at(ad)) !== Math.floor(at(next))
        // Dark on the sunlit left wall, light on the shaded right one, so they read on both.
        if (edge && fbm(ledgeSeed, lateral * 2 + Math.floor(at(ad)) * 7, 2, 0.5) > 0.55) {
          return x + 0.5 < vx ? mixRgb(col, gully, 0.18) : mixRgb(col, wallLit, 0.18)
        }
      }
      return col
    }

    // Texture the part of the near mountains above the horizon first, in place.
    if (ridge && p.walls) {
      const top = Math.min(...ridge)
      if (top < horizon) {
        const above = ctx.getImageData(0, top, w, horizon - top)
        for (let y = top; y < horizon; y++) {
          for (let x = 0; x < w; x++) {
            if (ridge[x] >= y || (x + 0.5 >= farLeft && x + 0.5 <= farRight)) continue
            const o = ((y - top) * w + x) * 4
            const col = rock([above.data[o], above.data[o + 1], above.data[o + 2]], x, y)
            above.data[o] = col[0]
            above.data[o + 1] = col[1]
            above.data[o + 2] = col[2]
          }
        }
        ctx.putImageData(above, 0, top)
      }
    }

    const out = ctx.createImageData(w, rows)
    for (let i = 0; i < rows; i++) {
      const y = horizon + i
      const d = depth(y)
      const z = 1 / d
      // Aerial perspective: far things fade toward the sky/far-mountain colors.
      const fade = Math.pow(1 - d, 2.5) * p.haze
      const rc = riverCenter(y)
      const rh = riverHalf(y)
      const wl = wallLeft(y)
      const wr = wallRight(y)
      const flowPhase = z * p.flowDensity * 0.1 + t * p.flowSpeed
      // Crests are drawn only on the row where one passes, so they stay 1px lines at any depth.
      const nextPhase = (1 / depth(y + 1)) * p.flowDensity * 0.1 + t * p.flowSpeed
      const crestRow = Math.floor(flowPhase) !== Math.floor(nextPhase)

      for (let x = 0; x < w; x++) {
        let col: RGB
        const cx = x + 0.5
        if (cx < wl || cx > wr) {
          // Left wall faces right, toward the (default, right-hand) sun; the right wall is in shade.
          // Carry the mountain column above straight down, so there's no seam at the horizon.
          col = ridge && ridge[x] < horizon ? [base[x * 4], base[x * 4 + 1], base[x * 4 + 2]] : cx < wl ? wallLit : wallDark
          col = rock(col, x, y)
          if (hash2(seed, x, y) < p.trees * d) col = tree
          // A forest band along the wall's foot, ragged at its upper edge.
          const intoWall = cx < wl ? wl - cx : cx - wr
          const band = p.forest * w * d * (0.6 + 0.8 * fbm(seed ^ 4099, y * 0.25 + (cx < wl ? 0 : 50), 2, 0.5))
          if (intoWall < band && (intoWall < band * 0.6 || (1 - intoWall / band) * 2.5 > bayer(x, y))) {
            col = hash2(seed + 7, x, y) < 0.35 ? treeDark : tree
          }
        } else if (Math.abs(cx - rc) < rh) {
          col = mixRgb(water, deep, band(d, p.bands, x, i))
          // Break each crest into dashes, so it reads as ripples rather than a solid band.
          const segment = Math.floor((cx - rc) / Math.max(1, rh * 0.3))
          // Crests fade out toward the far end, where they'd crowd into a flickering cascade.
          const crestFade = Math.min(1, Math.max(0, (d - 0.12) / 0.2))
          if (crestRow && crestFade > bayer(x, y) && hash2(seed + Math.floor(flowPhase), segment, 0) < 0.55) col = mixRgb(col, highlight, 0.6)
          col = mixRgb(col, sky, Math.min(0.7, fade * 1.2))
        } else if (Math.abs(cx - rc) < rh + 1 && rh > 1) {
          col = groundShade
        } else {
          col = mixRgb(ground, groundShade, band(1 - d, p.bands, x, i) * 0.6)
          const r = hash2(seed + 1, x, y)
          if (r < p.tufts) col = grass
          else if (r < p.tufts * 1.6) col = groundShade
          // Shade at the foot of the nearer wall, dithered off into the meadow.
          const rightSide = cx > rc
          const fromWall = rightSide ? wr - cx : cx - wl
          const reach = p.shadow * w * d * (rightSide ? 1 : 0.35)
          if (Number.isFinite(fromWall) && fromWall < reach && (1 - fromWall / reach) * 1.6 > bayer(x, y)) {
            col = mixRgb(col, castShadow, 0.7)
          }
          col = mixRgb(col, far, fade)
        }
        const o = (i * w + x) * 4
        out.data[o] = col[0]
        out.data[o + 1] = col[1]
        out.data[o + 2] = col[2]
        out.data[o + 3] = 255
      }
    }
    ctx.putImageData(out, 0, horizon)
  },
}
