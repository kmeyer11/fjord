---
type: process
status: verified
consumes: ["[[task]]"]
produces: ["[[task]]"]
---

# recurrence-expand

Lazily materializes weekly-recurring meetings as real `Task` rows, out to a 12-week horizon, on every read of the task list — same "extend on read, no scheduler" trick as `caldav-sync`, for a different reason (SQLite has no CalDAV-style push problem; this is about not wanting a cron job for a single-process app).

## Input → Movement → Output

Input: none explicit — runs as a side effect of `GET /api/tasks`. Movement: for every distinct `recurrence_id`, find its latest occurrence; if that's short of the horizon, clone it forward weekly until the horizon is covered. Output: new `Task` rows sharing the same `recurrence_id`, committed before the read query runs.

## Why this shape

`_next_week`/`_next_occurrence` step in **local wall-clock time**, not fixed 7×24h — so "every Tuesday at 10" stays at 10 local across a DST change instead of drifting an hour (`tasks.py:24-30`). Materializing real rows (rather than computing occurrences on the fly at render time) means every occurrence is independently editable/deletable, which a pure computed-recurrence model wouldn't support cleanly given `SeriesEditModal`'s per-occurrence edits.

## Steps

1. `list_tasks` (`GET /api/tasks`) calls `_extend_recurring_series(db)` before querying — `routers/tasks.py:119`
2. Group existing rows by `recurrence_id`, find each series' max `due_at` — `routers/tasks.py:92-97`
3. Skip series already past the horizon; else find the template row at that max `due_at` — `routers/tasks.py:99-106`
4. `_generate_following_occurrences` clones title/description/criticality/all_day forward weekly until `horizon` — `routers/tasks.py:53-73`
5. Creating a *new* recurring meeting (`create_meeting`, `routers/tasks.py:126`) also runs this generation immediately, not waiting for the next `list_tasks` call

## If you change this

- **Hits:** `create_meeting`, `update_task` (must call `_stop_series` when shortening a series — `tasks.py:76-83`/`190` — otherwise the next `list_tasks` regenerates the dropped occurrences right back), `update_meeting_series` (`tasks.py:198`, reschedules a whole series by deleting future rows and regenerating from a new anchor), `delete_task` with `scope=future` (`tasks.py:239-247`, same stop-series pattern), `SeriesEditModal.tsx`
- **Does not hit:** one-off (non-recurring) tasks/meetings — `recurrence_id` stays null, none of this runs; `objects/core/project.md` / board UI (project-scoped task lists don't call `_extend_recurring_series`)

## Surfaces

| Surface | Role |
|---|---|
| `frontend/src/pages/Calendar.tsx` (via `api.listTasks`) | triggers |
| `backend/app/routers/tasks.py` | executes |

## See

- Objects: `objects/core/task.md`
- Source: `backend/app/routers/tasks.py:24-150`
