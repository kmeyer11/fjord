---
type: process
status: verified
consumes: ["[[task]]"]
produces: ["[[task]]"]
---

# task-auto-archive

A `done` task older than 14 days silently drops off the project board and becomes reachable only through the project's archive view. No row is ever deleted or flagged — "archived" is a derived, computed status.

## Input → Movement → Output

Input: none explicit — a filter applied at every read of a project's task list. Movement: `_is_archived` checks `status == done AND completed_at <= now - 14d`. Output: two disjoint views over the same table — the board's live list excludes archived tasks, the archive endpoint returns only them.

## Why this shape

Nothing is stored to mark a task archived — it's entirely computed from `status` + `completed_at` against the current time, so `ARCHIVE_AFTER` can be changed (or made per-project) without a migration or backfill. The tradeoff: listing "archived" tasks requires a full re-evaluation of the cutoff on every read, not an indexed flag — fine at this app's scale.

## Steps

1. `completed_at` gets stamped the moment a task's `status` transitions to `done` — in `create_project_task` (`routers/projects.py:127-128`) and in `update_task` (`routers/tasks.py:172`); cleared if it moves back out of `done`
2. `_archive_cutoff()` = `now - ARCHIVE_AFTER` (14 days) — `routers/projects.py:14-18`
3. `_is_archived(task)` — `routers/projects.py:21-26`
4. `list_project_tasks` excludes archived rows (`routers/projects.py:87-101`); `list_project_archive` returns only archived rows (`routers/projects.py:104-120`); `_with_counts` also skips archived tasks so board counts don't include them (`routers/projects.py:29-37`)

## If you change this

- **Hits:** `ProjectBoard.tsx` (board counts/list), `ProjectArchive.tsx` (archive view) — both assume this exact split
- **Does not hit:** `ics-export` (filters on `in_progress`, never sees `done` tasks at all, so archive age is irrelevant there); the cross-project `list_tasks` used by the calendar (`routers/tasks.py:115-123`) does **not** apply this filter, by design — confirmed 2026-09-14: the calendar is chronological (a past meeting belongs on its date regardless of status), while the board has no time axis and needs active pruning to stay usable. Don't "fix" this into uniform filtering.

## Surfaces

| Surface | Role |
|---|---|
| `frontend/src/pages/ProjectBoard.tsx`, `ProjectArchive.tsx` | reads |
| `backend/app/routers/projects.py` | executes |

## See

- Objects: `objects/core/task.md`, `objects/core/project.md`
- Source: `backend/app/routers/projects.py:11-120`
