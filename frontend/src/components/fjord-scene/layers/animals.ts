import { mix, rng } from '../pixel'
import { drawSprite } from '../sprite'
import type { LayerDef } from '../types'
import type { ValleyGeometry } from './valley'

// Sprites face right. '.' is transparent; letters map to colors below.
const BIRD = [
  ['b...b', '.b.b.', '..b..'],
  ['.....', 'bb.bb', '..b..'],
]

const FOX = [
  ['.......a.a.', '.......aaab', 'cca.aaaaaa.', '.aaaaaaaa..', '...a...a...'],
  ['.......a.a.', '.......aaab', 'cca.aaaaaa.', '.aaaaaaaa..', '....a.a....'],
]

const HORSE = [
  // head up
  ['.........bb.', '........aaa.', '........aaaa', '.aaaaaaaaa..', 'baaaaaaaaa..', 'b.aaaaaaa...', '..a.a..a.a..', '..a.a..a.a..'],
  // grazing
  ['............', '............', '........bb..', '.aaaaaaaaaa.', 'baaaaaaaa.aa', 'b.aaaaaaa..a', '..a.a..a.a..', '..a.a..a.a..'],
]

// Rearing, front legs up — shown for a moment when the horse is clicked.
const HORSE_REAR = ['..........bb', '.........aaa', '........aaa.', '.......aaaa.', '...aaaaaa.a.', 'baaaaaaa..a.', 'b.a..a......', '..a..a......']

const STAG = [
  // looking ahead
  ['.......c.c.', '......c.c.c', '.......ccc.', '........aa.', '........aab', '.aaaaaaaa..', 'aaaaaaaaa..', '.aaaaaaa...', '.a.a..a.a..', '.a.a..a.a..'],
  // looking back over its shoulder
  ['..c.c......', '.c.c.c.....', '..ccc......', '..aa.......', '.baa.......', '.aaaaaaaa..', 'aaaaaaaaa..', '.aaaaaaa...', '.a.a..a.a..', '.a.a..a.a..'],
]

// Mid-gallop, legs stretched — used while the stag bolts.
const STAG_RUN = ['.......c.c.', '......c.c.c', '.......ccc.', '........aa.', '........aab', '.aaaaaaaa..', 'aaaaaaaaa..', '.aaaaaaa...', 'a.a....a.a.', 'a.......a..']

const FOX_COLORS = { a: '#c8642a', b: '#2a1d18', c: '#f2efe9' }
const HORSE_COLORS = { a: '#7a4a2e', b: '#3a2418' }
const STAG_COLORS = { a: '#8a5a3a', b: '#2a1d18', c: '#d8c8a8' }

/**
 * Birds in the sky, and a fox, horse and stag on the meadow. The ground
 * animals need the `valley` layer (they stand on its meadow, clear of the river).
 *
 * Each is clickable: birds flush and fly off, the fox hops, the horse rears,
 * and the stag bolts for the valley wall and only wanders back a while later.
 */
export const animals: LayerDef = {
  params: {
    birds: { min: 0, max: 12, step: 1, default: 3 },
    birdSpeed: { min: 0, max: 20, step: 0.5, default: 6 },
    fox: { min: 0, max: 1, step: 1, default: 1 },
    foxSpeed: { min: 0, max: 10, step: 0.25, default: 3 },
    horse: { min: 0, max: 1, step: 1, default: 1 },
    stag: { min: 0, max: 1, step: 1, default: 1 },
    size: { min: 1, max: 6, step: 0.5, default: 2 },
  },
  draw(ctx, scene, p) {
    const { w, horizon, t, seed, palette } = scene
    const dim = (colors: Record<string, string>) =>
      Object.fromEntries(Object.entries(colors).map(([k, c]) => [k, mix(c, palette.nearShade, palette.dim)]))

    const r = rng(seed, 'birds')
    const birdColor = { b: palette.nearShade }
    for (let i = 0; i < p.birds; i++) {
      const phase = r() * 10
      const speed = p.birdSpeed * (0.7 + r() * 0.6)
      const span = w + 10
      let x = ((r() * span + t * speed) % span) - 5
      let y = horizon * (0.15 + r() * 0.4) + Math.sin(t * 0.8 + phase) * 3
      let flap = 4
      const flushed = scene.since(`bird:${i}`)
      if (flushed !== undefined && flushed < 8) {
        // Two seconds of frantic climbing, then gone for a while before it drifts back in.
        if (flushed >= 2) continue
        x += flushed * flushed * speed * 4
        y -= flushed * flushed * 15
        flap = 12
      }
      drawSprite(ctx, BIRD[Math.floor(t * flap + phase) % 2], birdColor, x, y)
      scene.hit(`bird:${i}`, x - 2, y - 2, 9, 7)
    }

    const v = scene.shared.valley as ValleyGeometry | undefined
    if (!v) return
    const rowAt = (depth: number) => horizon + Math.round(depth * (scene.h - horizon))
    const scaleAt = (depth: number) => Math.max(1, Math.round(depth * p.size))
    // Meadow between a wall and the river bank on one side, at row y.
    const meadow = (y: number, side: -1 | 1) => {
      const bank = v.riverCenter(y) + side * (v.riverHalf(y) + 2)
      const wall = side < 0 ? v.wallLeft(y) : v.wallRight(y)
      const outer = Number.isFinite(wall) ? wall - side * 2 : side < 0 ? 0 : w
      return side < 0 ? [Math.max(2, outer), bank] : [bank, Math.min(w - 2, outer)]
    }

    if (p.stag) {
      const d = 0.22
      const y = rowAt(d)
      const s = scaleAt(d)
      const [lo, hi] = meadow(y, -1)
      let x = lo + (hi - lo) * 0.35
      const startled = scene.since('stag')
      const stagH = STAG[0].length * s
      if (startled !== undefined && startled < 10) {
        // Bolts for the wall for 1.5s, then stays out of sight until it wanders back.
        if (startled < 1.5) {
          x -= startled * startled * 25
          drawSprite(ctx, Math.floor(t * 10) % 2 ? STAG_RUN : STAG[0], dim(STAG_COLORS), x, y - stagH, s, true)
        }
      } else {
        const look = Math.floor((t + 2) / 4) % 3 === 2 ? 1 : 0
        drawSprite(ctx, STAG[look], dim(STAG_COLORS), x, y - stagH, s)
        scene.hit('stag', x - 1, y - stagH - 1, STAG[0][0].length * s + 2, stagH + 2)
      }
    }

    if (p.horse) {
      const d = 0.45
      const y = rowAt(d)
      const s = scaleAt(d)
      const [lo, hi] = meadow(y, 1)
      const x = lo + (hi - lo) * 0.4
      const grazing = Math.floor((t + 1.3) / 2.7) % 2
      const reared = scene.since('horse')
      const sprite = reared !== undefined && reared < 1.2 ? HORSE_REAR : HORSE[grazing]
      const horseH = HORSE[0].length * s
      drawSprite(ctx, sprite, dim(HORSE_COLORS), x, y - horseH, s, true)
      scene.hit('horse', x - 1, y - horseH - 1, HORSE[0][0].length * s + 2, horseH + 2)
    }

    if (p.fox) {
      const d = 0.68
      const y = rowAt(d)
      const s = scaleAt(d)
      const spriteW = FOX[0][0].length * s
      const [lo, hi] = meadow(y, -1)
      const range = hi - lo - spriteW
      if (range > 4) {
        // Trots back and forth along the bank, turning at each end.
        const u = ((t * p.foxSpeed) / range) % 2
        const x = lo + (u < 1 ? u : 2 - u) * range
        const hopped = scene.since('fox')
        const hop = hopped !== undefined && hopped < 0.5 ? Math.round(Math.sin((Math.PI * hopped) / 0.5) * 4 * s) : 0
        const foxH = FOX[0].length * s
        drawSprite(ctx, FOX[Math.floor(t * 6) % 2], dim(FOX_COLORS), x, y - foxH - hop, s, u >= 1)
        // Hit box covers the hop too, so a second click mid-air still lands.
        scene.hit('fox', x - 1, y - foxH - 5 * s, spriteW + 2, foxH + 5 * s + 1)
      }
    }
  },
}
