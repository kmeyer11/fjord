---
type: object
cluster: calendar-sync
universe: live
status: verified
entity: backend/app/caldav_client.py
---

# CaldavClient (inbound sync)

Read-only polling of iCloud Calendar over CalDAV. Not a model/table — a stateful module with an in-process cache.

## Why this shape

CalDAV has no push/webhook, so there's no way to be notified of upstream changes. Rather than run a background scheduler, results are cached for 120s (`_CACHE_TTL_SECONDS`, `caldav_client.py:25`) and re-fetched lazily on the next request past the TTL — same "extend lazily on read" trick as `processes/recurrence-expand.md` uses for a different reason.

## Shape

- Module-level cache: `_cache: dict[(username, date-range) -> (fetched_at, events)]`, `_last_error`, `_last_synced_at`
- Credentials resolved in priority order: local encrypted secrets store (set via Settings page) → environment variables (`app.config`, for headless deploys) — `get_credentials()`, `caldav_client.py:31`

Citations: `backend/app/caldav_client.py:1-40`

## Connected to

- **owns:** nothing persisted — output is ephemeral `ExternalEvent` dicts, never written to `fjord.db`
- **owned-by:** nothing
- **joins:** `objects/auth-and-secrets/app-secrets-store.md` for credentials
- **looks-like-but-is-not:** `Task` with `category=meeting` — external events are a separate source, merged only in the frontend's calendar view, never written into the `tasks` table

## If you change this

- **Hits:** `routers/calendar.py` (all three endpoints call into this module), `schemas.ExternalEvent`, frontend calendar UI's external-event rendering
- **Does not hit:** `Task`/`Project` tables, recurrence expansion, ICS export (that reads `Task` rows, not this cache)

## Surfaces

| Surface | Role |
|---|---|
| `backend/app/routers/calendar.py` | reads (`fetch_events`, `sync_status`, `test_connection`) |
| `frontend/src/components/calendar/*` | reads via `objects/frontend/api-client.md` |

## See

- Source: `backend/app/caldav_client.py`
- Router: `backend/app/routers/calendar.py`
