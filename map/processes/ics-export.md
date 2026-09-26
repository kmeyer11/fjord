---
type: process
status: verified
consumes: ["[[task]]", "[[app-secrets-store]]"]
produces: ["[[ics-feed]]"]
---

# ics-export

`Task` rows (`category=meeting`, `in_progress`, has `due_at`) → a token-checked `.ics` file, on every request — no caching, computed fresh each hit.

## Input → Movement → Output

Input: a `token` query param. Movement: check it against the stored `ics_token`; query qualifying tasks; build one `icalendar.Event` per task with a fixed 30-minute block. Output: `text/calendar` response, unauthenticated beyond the token.

## Why this shape

Computed on every request rather than cached, because subscribers (Apple Calendar) poll on their own schedule (`x-wr-calname`/`x-published-ttl: PT1H` hints an hourly refresh) and the dataset is small enough that a DB query per hit is cheap — no invalidation problem to solve.

## Steps

1. `GET /calendar/fjord.ics?token=...` — `routers/ics_feed.py:19`
2. Token check against `config_store.load().ics_token`, 403 on mismatch (`ics_feed.py:21`)
3. Query: `status=in_progress AND due_at IS NOT NULL AND category=meeting` (`ics_feed.py:30-38`) — note this silently excludes `backlog`/`done` meetings and any plain task, even one with a due date
4. Build `icalendar.Calendar`, one `Event` per row, fixed `_EVENT_DURATION` block

## If you change this

- **Hits:** any external subscriber (outside the tree, hardcodes this URL — see `objects/calendar-sync/ics-feed.md`)
- **Does not hit:** `caldav-sync` (opposite direction, separate code path entirely); the project board (this route doesn't touch `project_id`-scoped queries)

## Surfaces

| Surface | Role |
|---|---|
| External `.ics` subscribers | triggers (outside the tree) |
| `backend/app/routers/ics_feed.py` | executes |

## See

- Objects: `objects/calendar-sync/ics-feed.md`, `objects/core/task.md`
- Source: `backend/app/routers/ics_feed.py`
