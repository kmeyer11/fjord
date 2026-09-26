import type { LayerDef } from '../types'
import { animals } from './animals'
import { aurora } from './aurora'
import { boat } from './boat'
import { clouds } from './clouds'
import { forest } from './forest'
import { image } from './image'
import { farMountains, midMountains, nearMountains } from './mountains'
import { sky } from './sky'
import { sparkles } from './sparkles'
import { stars } from './stars'
import { tributaries } from './tributaries'
import { valley } from './valley'
import { water } from './water'
import { waterfall } from './waterfall'

/** Every layer a preset can reference by `type`. Adding a layer = one file + one line here. */
export const LAYERS: Record<string, LayerDef> = {
  sky,
  stars,
  aurora,
  clouds,
  farMountains,
  midMountains,
  nearMountains,
  waterfall,
  water,
  sparkles,
  boat,
  valley,
  tributaries,
  forest,
  animals,
  image,
}
