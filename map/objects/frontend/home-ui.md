---
type: object
cluster: frontend
universe: live
status: verified
entity: frontend/src/pages/Home.tsx
---

# Home UI

The front page at `/`: a full-screen animated pixel-art scene (`FjordScene`) with one small glass card on top — a time-of-day greeting, the date, and up to four of today's items. The scene has no settings UI; everything a user can change is an easter egg in the scene itself.

## Why this shape

The drawing engine is kept apart from everything visual: `FjordScene.tsx` only sizes a low-res canvas, draws a list of layers, and routes clicks; each layer (sky, mountains, valley, animals …) is one file with numeric params; `presets.ts` combines them as plain data. A new look means editing data or adding a layer file, never touching the engine. Layers mark clickable regions each frame (`scene.hit`) and animate reactions from `scene.since(kind)`, so they hold no state of their own.

## Shape

- `pages/Home.tsx` — the card, plus scene state. Merges today's not-done `Task`s with a `due_at` today (`api.listTasks`) and external events overlapping today (`api.listExternalEvents`, failure → none). Meetings/events link to `/calendar`; tasks link to their project board, because the calendar only shows `category=meeting`.
- Scene choice is a server-side preference (`api.getPreferences`/`updatePreferences` → `objects/core/app-setting.md`); unknown names fall back to `DEFAULT_PRESET` (`valley`). The canvas waits for it to load.
- Time of day follows the clock (`timeOfDayFor`); clicking the sun overrides it in React state only, so a reload returns to the clock. The greeting always follows the real clock.
- `components/fjord-scene/FjordScene.tsx` — engine: ResizeObserver sizing, fps cap, pointer hit-testing (click fires on release; holding ≥1s fires `<kind>:hold` instead), `onEgg` callback. `prefers-reduced-motion` → one static frame, and `since()` reports every reaction as finished.
- `components/fjord-scene/layers/` — one `LayerDef` per file, registered in `layers/index.ts`. `water` reflects whatever earlier layers drew; `valley` continues the `nearMountains` columns below the horizon and publishes its geometry on `scene.shared.valley` for `tributaries` and `animals`.
- `components/fjord-scene/presets.ts` — named scenes, cycled in key order by the cloud egg. Every preset needs a `clouds` layer (or the scene can't be left) and an `aurora` layer after `stars`.

### Easter eggs

| Click | Kind | Effect |
|---|---|---|
| sun / moon | `sun` | cycles morning → day → evening → night (not saved) |
| hold the moon | `sun:hold` | aurora for the rest of the visit, drawn only at night |
| a cloud | `cloud:<i>` | cloud blows away, then Home moves to the next preset and saves it |
| fox / horse / stag / bird | `fox`, `horse`, `stag`, `bird:<i>` | hop / rear / bolt and return ~10s later / flush and return |

## Connected to

- **owns:** nothing — reads tasks/events, reads and writes the `scene` preference
- **owned-by:** nothing
- **joins:** `objects/frontend/api-client.md`; `objects/core/app-setting.md`; `lib/colors.ts` `taskColor` for dot colors
- **looks-like-but-is-not:** the Calendar UI — it shows due-today *tasks* too, which the calendar never does

## If you change this

- **Hits:** a `Task` or `ExternalEvent` schema change hits the merge in `Home.tsx`; renaming a preset orphans users who saved it (they silently get the default); renaming a hit `kind` breaks the matching check in `Home.tsx`'s `onEgg`
- **Does not hit:** anything server-side beyond `/api/preferences`

## Surfaces

| Surface | Role |
|---|---|
| `objects/frontend/api-client.md` | reads; writes `/api/preferences` |

## See

- Source: `frontend/src/pages/Home.tsx`, `frontend/src/components/fjord-scene/`
