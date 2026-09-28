---
type: object
cluster: calendar-sync
universe: live
status: verified
entity: backend/app/routers/ics_feed.py
---

# ICS feed (outbound export)

A public, token-gated `.ics` endpoint so Apple Calendar (or anything else) can subscribe to Fjord's meetings. The mirror image of `caldav-client.md` — that pulls external events in, this pushes Fjord's own events out.

## Why this shape

Apple's calendar client can't do a cookie login, so this route is checked by its own long-lived token (`ics_token` in `AppSecrets`) instead of session auth — it's registered in `main.py` without the `require_session_or_api_token` dependency the other data routers get (`backend/app/main.py:37`).

## Shape

- One route: `GET /calendar/fjord.ics?token=...`
- Queries `Task` where `status=in_progress`, `due_at` not null, `category=meeting` — i.e. only upcoming meetings, never plain tasks or done/backlog items
- Each timed task gets a fixed 30-minute block (`_EVENT_DURATION`) since tasks don't carry a duration; `all_day` tasks are published as `VALUE=DATE` events (local date, one day long)
- Deleted meetings are republished as `STATUS:CANCELLED` from `TaskTombstone` for `_TOMBSTONE_RETENTION`

Citations: `backend/app/routers/ics_feed.py` (updated 2026-09-28)

## Connected to

- **owns:** nothing
- **owned-by:** nothing
- **joins:** `Task` (read-only query, `objects/core/task.md`); `ics_token` in `objects/auth-and-secrets/app-secrets-store.md`
- **looks-like-but-is-not:** CalDAV sync — this is one-way, Fjord → subscriber, and uses the plain `icalendar` library, not the `caldav` client

## If you change this

- **Hits:** nothing else reads this route's output inside the tree; changing the query filter changes what an external subscriber's calendar shows
- **Does not hit:** `Task` writes, project board (read-only consumer)

## Surfaces

| Surface | Role |
|---|---|
| Apple Calendar / any `.ics` subscriber (outside the tree) | reads — hardcodes this URL with the feed token; ask the owner before changing the route path or token param name |
| `frontend/src/pages/Settings.tsx` (feed-token display, via `getFeedToken`) | reads the token to build the subscribe URL |

## See

- Source: `backend/app/routers/ics_feed.py`
