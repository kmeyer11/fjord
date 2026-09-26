import { useEffect, useRef } from 'react'
import { LAYERS } from './layers'
import { paletteFor } from './timeOfDay'
import type { Scene, ScenePreset, TimeOfDay } from './types'

const HOLD_MS = 1000

interface HitRegion {
  kind: string
  x: number
  y: number
  w: number
  h: number
}

/**
 * The engine: sizes a low-res canvas to its container, then draws the
 * preset's layers in order at a capped frame rate. Knows nothing about
 * mountains or boats — that all lives in layers/ and presets.ts.
 *
 * Layers can mark clickable regions (`scene.hit`); clicks and long-presses
 * on them are recorded for the layers to react to (`scene.since`) and
 * passed up through `onEgg` for anything outside the canvas to handle.
 */
export default function FjordScene({
  preset,
  time,
  onEgg,
  className,
}: {
  preset: ScenePreset
  time: TimeOfDay
  onEgg?: (kind: string) => void
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Both survive preset/time changes, so switching scene doesn't snap the boat
  // back to the start or forget an easter egg that's already been found.
  const startRef = useRef<number | null>(null)
  const eventsRef = useRef(new Map<string, number>())
  const onEggRef = useRef(onEgg)
  useEffect(() => {
    onEggRef.current = onEgg
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    const ctx = canvas?.getContext('2d', { willReadFrequently: true })
    if (!canvas || !container || !ctx) return

    startRef.current ??= performance.now()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const palette = paletteFor(preset, time)
    let memo = new Map<string, unknown>()
    let frame = 0
    let last = 0
    let needsRedraw = true
    let regions: HitRegion[] = []
    let drawnRegions: HitRegion[] = []
    const events = eventsRef.current
    const now = () => (reducedMotion ? 0 : Math.max(0, (performance.now() - startRef.current!) / 1000))

    const scene: Scene = {
      w: 1,
      h: preset.pixelHeight,
      horizon: 1,
      t: 0,
      time,
      palette,
      seed: preset.seed,
      memo<T>(key: string, build: () => T): T {
        if (!memo.has(key)) memo.set(key, build())
        return memo.get(key) as T
      },
      shared: {},
      requestRedraw: () => {
        needsRedraw = true
        if (reducedMotion) draw(0)
      },
      hit(kind, x, y, w, h) {
        regions.push({ kind, x, y, w, h })
      },
      since(kind) {
        const at = events.get(kind)
        if (at === undefined) return undefined
        // Time doesn't advance with reduced motion, so treat every reaction as
        // already played out: animals stay put, the aurora is simply there.
        return reducedMotion ? Infinity : Math.max(0, scene.t - at)
      },
    }

    function resize() {
      const { clientWidth, clientHeight } = container!
      if (clientWidth === 0 || clientHeight === 0) return
      const h = preset.pixelHeight
      const w = Math.max(1, Math.round((h * clientWidth) / clientHeight))
      // Always sync the scene: on a preset change the canvas may already be this size.
      if (scene.w === w && scene.h === h && canvas!.width === w && canvas!.height === h) return
      canvas!.width = w
      canvas!.height = h
      scene.w = w
      scene.h = h
      scene.horizon = Math.round(h * preset.horizon)
      memo = new Map()
      needsRedraw = true
      if (reducedMotion) draw(0)
    }

    function draw(t: number) {
      scene.t = t
      scene.shared = {}
      regions = []
      ctx!.clearRect(0, 0, scene.w, scene.h)
      for (const entry of preset.layers) {
        if (entry.enabled === false) continue
        const layer = LAYERS[entry.type]
        if (!layer) continue
        const params: Record<string, number> = {}
        for (const [k, spec] of Object.entries(layer.params)) params[k] = entry.params?.[k] ?? spec.default
        layer.draw(ctx!, scene, params, entry)
      }
      drawnRegions = regions
      needsRedraw = false
    }

    function regionAt(e: PointerEvent): HitRegion | undefined {
      const rect = canvas!.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * scene.w
      const y = ((e.clientY - rect.top) / rect.height) * scene.h
      for (let i = drawnRegions.length - 1; i >= 0; i--) {
        const r = drawnRegions[i]
        if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return r
      }
    }

    function fire(kind: string) {
      events.set(kind, now())
      onEggRef.current?.(kind)
      scene.requestRedraw()
    }

    // A click fires on release; holding past HOLD_MS fires `:hold` instead, so
    // the two never both happen (the moon rotates time on click, but not on hold).
    let pressed: { kind: string; timer: number; held: boolean } | null = null
    function onDown(e: PointerEvent) {
      const r = regionAt(e)
      if (!r) return
      const press = {
        kind: r.kind,
        held: false,
        timer: window.setTimeout(() => {
          press.held = true
          fire(`${r.kind}:hold`)
        }, HOLD_MS),
      }
      pressed = press
    }
    function onUp() {
      if (!pressed) return
      clearTimeout(pressed.timer)
      if (!pressed.held) fire(pressed.kind)
      pressed = null
    }
    function onCancel() {
      if (pressed) clearTimeout(pressed.timer)
      pressed = null
    }
    function onMove(e: PointerEvent) {
      canvas!.style.cursor = regionAt(e) ? 'pointer' : ''
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onCancel)
    canvas.addEventListener('pointerleave', onCancel)
    canvas.addEventListener('pointermove', onMove)

    function loop(stamp: number) {
      frame = requestAnimationFrame(loop)
      // requestAnimationFrame already stops in background tabs; the cap just keeps it chunky and cheap.
      if (!needsRedraw && stamp - last < 1000 / preset.fps) return
      last = stamp
      draw(now())
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()
    if (reducedMotion) draw(0)
    else frame = requestAnimationFrame(loop)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      onCancel()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onCancel)
      canvas.removeEventListener('pointerleave', onCancel)
      canvas.removeEventListener('pointermove', onMove)
    }
  }, [preset, time])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      // Long-presses are an interaction here, not a request for the text/image callout menu.
      onContextMenu={(e) => e.preventDefault()}
      className={[
        'block size-full touch-manipulation select-none [image-rendering:pixelated] [-webkit-touch-callout:none]',
        className ?? '',
      ].join(' ')}
    />
  )
}
