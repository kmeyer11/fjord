---
type: object
cluster: calendar-sync
universe: live
status: verified
entity: backend/app/calendar_push.py
---

# Calendar push (outbound write-through)

Writes Fjord's meetings into one iCloud calendar the user picks on the Settings page (e.g. their existing "Arbejde"), over CalDAV. Replaces the subscribe-to-a-feed model of `ics-feed.md` — Fjord now lives inside a calendar the user already has instead of publishing its own.

## Why this shape

Fjord's `tasks` table stays the source of truth; the calendar is a mirror. Each meeting is written to a predictable resource name, `fjord-task-<id>.ics`, so one PROPFIND listing of the calendar (no event bodies) tells Fjord's events apart from the user's own — those are never touched. That makes a sync a cheap set-diff: create missing, delete orphaned, rewrite ones flagged as changed. This only stays correct because task ids are never reused (`sqlite_autoincrement`, `models.py`).

Writes run as FastAPI background tasks after each meeting mutation, so the UI never waits on iCloud. A module-level lock serializes them; each re-reads the DB once it holds the lock, so the last one to run leaves the calendar matching the latest state.

## Shape

- Target calendar: `icloud_calendar_url` / `icloud_calendar_name` in `AppSecrets` (cleared on disconnect)
- In-memory state: `_pending_ids` (meetings whose write failed, retried next sync), `_full_push_pending`, `_last_error`, `_last_synced_at` — lost on restart; "Refresh now" does a full push to catch up
- Shared with the `.ics` feed: `published_meetings()` (the which-meetings filter) and `task_event()` (one task → one VEVENT, fixed 30-min block, all-day as `VALUE=DATE`)

Citations: `backend/app/calendar_push.py` (added 2026-10-08)

## Connected to

- **owns:** the `fjord-task-*.ics` resources in the target calendar
- **owned-by:** nothing
- **joins:** `Task` (read-only query), `objects/auth-and-secrets/app-secrets-store.md` (target + credentials via `caldav_client.get_credentials`)
- **looks-like-but-is-not:** two-way sync — edits made to Fjord's events directly in Apple Calendar are not read back, and get overwritten on the next write of that meeting

## If you change this

- **Hits:** `routers/tasks.py` (every meeting write schedules `calendar_push.sync`), `routers/calendar.py` (`/calendars`, `/target`, `/push`, `/status`), `routers/ics_feed.py` (shared builder), `caldav_client.is_fjord_event` (the inbound view hides these events by UID prefix so meetings don't show twice), Settings page
- **Changing the resource name or UID prefix:** existing events in the user's calendar become invisible to the sync — they'd be orphaned (not deleted) and duplicated
- **Does not hit:** `fjord.db` schema — nothing about sync state is persisted there

## Surfaces

| Surface | Role |
|---|---|
| `backend/app/routers/tasks.py` | triggers (background task after meeting writes; `list_tasks` when series were extended or a retry is pending) |
| `backend/app/routers/calendar.py` | configures / triggers manually |
| `frontend/src/pages/Settings.tsx` | picks the target, shows `last_push_error` |
| The user's iCloud calendar (outside the tree) | written to |

## See

- Process: `processes/calendar-push.md`
- Source: `backend/app/calendar_push.py`
