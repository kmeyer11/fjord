---
type: process
status: verified
consumes: ["[[caldav-client]]", "[[app-secrets-store]]"]
produces: ["[[caldav-client]]"]
---

# caldav-sync

Poll iCloud for a date range → cache 120s → serve to the calendar view. No push/webhook exists in CalDAV, so freshness is bounded by the cache TTL, not by an event.

## Input → Movement → Output

Input: a `(start, end)` date range from the frontend calendar view, plus stored/env iCloud credentials. Movement: check the in-memory cache for that (username, range) key; if stale or `force=true`, open a CalDAV connection and re-fetch. Output: a list of `ExternalEvent` dicts, never persisted to `fjord.db`.

## Why this shape

Polling on-read (not on a timer) means no background scheduler process to run/monitor for a single-user app; the 120s TTL bounds both staleness and how often iCloud gets hit. `force=true` exists so the Settings page's "test connection" / manual refresh can bypass the cache on demand.

## Steps

1. `routers/calendar.py:12` — `GET /api/calendar/external-events?start&end&force`
2. `caldav_client.get_credentials()` — secrets store first, env vars fallback (`caldav_client.py:31`)
3. Cache check keyed on `(username, date-range)`; skip fetch if within `_CACHE_TTL_SECONDS` and not forced
4. On fetch: open `caldav` connection, pull events, update `_cache`, `_last_synced_at`, `_last_error`

## If you change this

- **Hits:** `routers/calendar.py`'s three endpoints (`external-events`, `status`, `icloud-credentials`); frontend `Calendar.tsx` / external-event components
- **Does not hit:** `objects/core/task.md` — this never writes to the `tasks` table, purely a read-through cache

## Surfaces

| Surface | Role |
|---|---|
| `frontend/src/pages/Calendar.tsx`, `components/calendar/*` | triggers |
| `backend/app/routers/calendar.py`, `caldav_client.py` | executes |

## See

- Objects: `objects/calendar-sync/caldav-client.md`, `objects/auth-and-secrets/app-secrets-store.md`
- Source: `backend/app/caldav_client.py:25-40`, `backend/app/routers/calendar.py`
