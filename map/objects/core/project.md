---
type: object
cluster: core
universe: live
status: verified
entity: backend/app/models.py
---

# Project

A board/category that tasks (and project-less meetings do not) belong to. Product name and code name match: `Project`.

## Why this shape

Deliberately minimal — a name, a color, and two booleans (`archived`, `favorite`). Task counts (`backlog`/`in_progress`/`done`) are computed per-request in `_with_counts` (`backend/app/routers/projects.py:29`), not stored, so they can never drift from the live task rows.

## Shape

- `id`, `name`, `color` (hex string, default `#3c6e90`), `archived`, `favorite`
- `tasks`: one-to-many to `Task`, `cascade="all, delete-orphan"` — deleting a project deletes its tasks, no orphan-task state possible.

Citations: `backend/app/models.py:46-57`

## Connected to

- **owns:** `Task` rows where `task.project_id` is set (see `objects/core/task.md`)
- **owned-by:** nothing — root of its own tree
- **joins:** none
- **looks-like-but-is-not:** a "board" in the UI sense — the board is one project's Kanban view, rendered client-side (`objects/frontend/board-ui.md`); there's no separate `Board` model

## If you change this

- **Hits:** `_with_counts` (`routers/projects.py:29`) if you add/remove a field the schema/response depends on; `schemas.ProjectWithCounts`; the frontend `Project`/`ProjectWithCounts` types (`frontend/src/api/types.ts`); an Alembic migration is required for any column change (`backend/alembic/versions/`)
- **Does not hit:** `Task`'s own fields (project-less tasks/meetings exist independently, `project_id` nullable) — a project-schema change does not ripple into meeting/recurrence logic

## Surfaces

| Surface | Role |
|---|---|
| `backend/app/routers/projects.py` | reads/writes |
| `frontend/src/pages/ProjectBoard.tsx`, `ProjectArchive.tsx` | reads/writes via `objects/frontend/api-client.md` |
| MCP server (`list_projects`, `create_project`) | reads/writes via HTTP, see `objects/mcp-surface/fjord-mcp-server.md` |

## See

- Source: `backend/app/models.py:46`
- Router: `backend/app/routers/projects.py`
