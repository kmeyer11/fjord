---
type: process
status: verified
consumes: ["[[task]]", "[[app-secrets-store]]"]
produces: ["[[calendar-push]]"]
---

# calendar-push

A meeting changes in Fjord → a background sync makes the user's chosen iCloud calendar match the `tasks` table.

## Input → Movement → Output

Input: the set of published meetings (`category=meeting`, `in_progress`, has `due_at`), plus ids whose content just changed. Movement: list the target calendar's `fjord-task-*.ics` resources, then DELETE the ones with no meeting behind them, PUT the missing ones, PUT the changed ones. Output: the target calendar mirrors Fjord's meetings; the user's own events are untouched.

## Why this shape

New ids (create, recurrence extension, series reschedule) and removed ids (delete, stop-repeating) fall out of the set-diff, so only in-place edits need to name their id. That keeps the hooks in `routers/tasks.py` to "schedule a sync" without tracking which rows a bulk operation touched.

## Steps

1. A meeting write in `routers/tasks.py` adds `calendar_push.sync` as a background task (`update_task` passes `changed_ids=[task.id]`)
2. `sync()` takes `_lock`, reads the target from `AppSecrets`; no target → no-op
3. `_fjord_resources()` — one PROPFIND (Depth 1) on the calendar, filtered by resource name
4. DELETE orphans, PUT missing/changed/pending (or everything when `push_all`)
5. On failure: error kept for `/api/calendar/status`, failed ids stay in `_pending_ids`; the next `list_tasks` call retries

Switching the target (`PUT /api/calendar/target`) runs `change_target`: remove all Fjord events from the old calendar, then a full push into the new one.

## If you change this

- **Hits:** see `objects/calendar-sync/calendar-push.md`
- **Does not hit:** `caldav-sync` (inbound read path), except that it skips Fjord's own events by UID

## Surfaces

| Surface | Role |
|---|---|
| `backend/app/routers/tasks.py`, `routers/calendar.py` | triggers |
| `backend/app/calendar_push.py` | executes |

## See

- Objects: `objects/calendar-sync/calendar-push.md`, `objects/core/task.md`
- Source: `backend/app/calendar_push.py`
