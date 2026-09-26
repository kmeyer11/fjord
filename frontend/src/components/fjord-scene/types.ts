export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night'

/** Every color a layer may ask for. Hand-tuned per time of day in timeOfDay.ts. */
export interface Palette {
  skyTop: string
  skyBottom: string
  sun: string
  far: string
  farShade: string
  mid: string
  midShade: string
  midLight: string
  near: string
  nearShade: string
  nearLight: string
  snow: string
  water: string
  waterDeep: string
  highlight: string
  foam: string
  cloud: string
  boat: string
  sail: string
  ground: string
  groundShade: string
  grassLight: string
  /** 0 hides the stars layer entirely; 1 is full brightness. */
  starAlpha: number
  /** How far sprites (animals) are pulled toward the shadow color — 0 by day, higher at night. */
  dim: number
}

/** The palette entries that are colors (not numbers). */
export type PaletteColorKey = { [K in keyof Palette]: Palette[K] extends string ? K : never }[keyof Palette]

/** Per-frame state handed to every layer. Coordinates are in scene pixels. */
export interface Scene {
  w: number
  h: number
  /** y of the waterline. */
  horizon: number
  /** Seconds since the scene mounted. */
  t: number
  time: TimeOfDay
  palette: Palette
  seed: number
  /** Cache a value for the lifetime of this canvas size/preset — for work that doesn't change per frame. */
  memo<T>(key: string, build: () => T): T
  /** Scratch space layers use to talk to later layers in the same frame (e.g. ridge heights for the waterfall). */
  shared: Record<string, unknown>
  /** Ask for another draw — for layers whose content arrives async (images) when animation is off. */
  requestRedraw(): void
  /**
   * Mark a clickable rectangle for this frame (scene pixels). Clicking it
   * fires `kind`; holding it ~1s fires `kind + ':hold'`. Later layers win
   * where regions overlap, since they're drawn on top.
   */
  hit(kind: string, x: number, y: number, w: number, h: number): void
  /** Seconds since `kind` was last fired, or undefined if it never was — layers animate reactions from this. */
  since(kind: string): number | undefined
}

export interface ParamSpec {
  min: number
  max: number
  step: number
  default: number
}

export interface LayerDef {
  /** Numeric knobs, set per preset in presets.ts (unset ones use `default`). */
  params: Record<string, ParamSpec>
  draw(ctx: CanvasRenderingContext2D, scene: Scene, params: Record<string, number>, entry: LayerEntry): void
}

export interface LayerEntry {
  /** Key into the LAYERS registry. */
  type: string
  enabled?: boolean
  params?: Record<string, number>
  /** Only used by the `image` layer: a path under /public, e.g. "/scene/mountains.png". */
  src?: string
}

export interface ScenePreset {
  /** Internal canvas height; width follows the container's aspect ratio. Lower = chunkier pixels. */
  pixelHeight: number
  fps: number
  /** Waterline as a fraction of the height. */
  horizon: number
  seed: number
  /** Overrides on top of the built-in palette, per time of day. */
  palette?: Partial<Record<TimeOfDay, Partial<Palette>>>
  layers: LayerEntry[]
}
