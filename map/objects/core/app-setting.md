---
type: object
cluster: core
universe: live
status: verified
entity: backend/app/models.py
---

# AppSetting (user preferences)

A key/value table (`app_settings`) of JSON-encoded user preferences, exposed as `GET`/`PUT /api/preferences`. Today it holds one key, `scene` — the front page's pixel-scene preset.

## Why this shape

One generic table so a new preference needs no migration, only a field on `schemas.Preferences` and a line in the router. Lives in `fjord.db`, not the AppSecrets JSON — preferences aren't secrets, and that file is deliberately kept for values that must not travel with a database copy.

## Shape

- `models.AppSetting`: `key` String(50) PK, `value` Text (JSON)
- `schemas.Preferences`: `scene: str | None`, `^[a-z0-9-]+$`, max 40 — shape only; the frontend owns which names are valid and falls back to its default
- `routers/preferences.py`: `GET` returns every known key; `PUT` sets them, `null` deletes the row
- Migration `backend/alembic/versions/61e286f9d953_app_settings.py`

## Connected to

- **owns:** the `scene` preference
- **owned-by:** nothing (single-user app — "the user" is the only user)
- **joins:** nothing
- **looks-like-but-is-not:** `objects/auth-and-secrets/app-secrets-store.md` — mutable state too, but secret, and a JSON file outside the DB

## If you change this

- **Hits:** `objects/frontend/home-ui.md` (reads/writes `scene`); `frontend/src/api/types.ts` `Preferences`
- **Does not hit:** tasks, projects, the .ics feed, the MCP server

## Surfaces

| Surface | Role |
|---|---|
| `objects/frontend/home-ui.md` | reads / writes |

## See

- Source: `backend/app/routers/preferences.py`, `backend/app/models.py`
