---
type: object
cluster: core
universe: live
status: verified
entity: backend/app/models.py
---

# Task

The one row type for both a project task and a calendar meeting. Product language says "Meeting"; the code name is always `Task` with `category=meeting`. There is no separate `Meeting` table — do not add one.

## Why this shape

A meeting is just a project-less (`project_id=None`), `category=meeting` task with a `due_at`. Sharing one table means the calendar's cross-project list (`list_tasks`, `backend/app/routers/tasks.py:115`) and the project board's per-project list (`routers/projects.py:87`) are the same underlying rows, filtered differently — no sync between two tables to keep correct.

## Shape

- `id`, `project_id` (nullable — null means meeting or unassigned task), `title`, `description`
- `status`: `backlog | in_progress | done`
- `criticality`: 1–5, `CheckConstraint` enforced (`models.py:89`)
- `category`: `task | meeting`
- `due_at`, `all_day`, `completed_at` (drives auto-archive, see `processes/task-auto-archive.md`)
- `recurrence_id`: shared UUID across every occurrence of a weekly-recurring meeting; `null` for one-offs — see `processes/recurrence-expand.md`
- `created_at`, `updated_at`

Citations: `backend/app/models.py:60-89`

## Connected to

- **owns:** nothing
- **owned-by:** `Project` (when `project_id` is set) — cascade-deletes with it
- **joins:** other `Task` rows sharing the same `recurrence_id` (a series, not a foreign key — see `processes/recurrence-expand.md`)
- **looks-like-but-is-not:** an "external calendar event" — those are a different object entirely, never written to this table; see `objects/calendar-sync/caldav-client.md`

## If you change this

- **Hits:** every router that touches tasks (`routers/tasks.py`, `routers/projects.py` task endpoints, `calendar_push.published_meetings`, shared by the Apple Calendar push and the `.ics` feed), `schemas.Task`/`TaskCreate`/`TaskUpdate`, frontend `Task` type (`frontend/src/api/types.ts`), the recurrence generator (`_generate_following_occurrences`, `routers/tasks.py:53`) which clones a template task's fields, MCP tools that create/list tasks
- **Does not hit:** `Project`'s own counts logic beyond re-summing (`_with_counts` just reads `status`/`completed_at`, doesn't need to change for most `Task` field additions); CalDAV sync (reads a completely separate source)

## Surfaces

| Surface | Role |
|---|---|
| `backend/app/routers/tasks.py`, `routers/projects.py` | reads/writes |
| `backend/app/calendar_push.py` (+ `routers/ics_feed.py`) | reads only (`category=meeting`, `status=in_progress`, `due_at` not null) |
| `frontend/src/pages/ProjectBoard.tsx`, `Calendar.tsx`, `Dashboard.tsx` | reads/writes |
| MCP server (`create_task`, `list_tasks`, `update_task`, `delete_task`) | reads/writes |

## See

- Source: `backend/app/models.py:60`
- Routers: `backend/app/routers/tasks.py`, `backend/app/routers/projects.py`
