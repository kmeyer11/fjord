---
type: object
cluster: frontend
universe: live
status: verified
entity: frontend/src/pages/ProjectBoard.tsx
---

# Board UI

The per-project Kanban board: `backlog` / `in_progress` / `done` columns of `Task` cards. Product name "board" has no backend counterpart — it's this page's client-side arrangement of one project's tasks.

## Shape

- `pages/ProjectBoard.tsx` — the page, fetches via `api.listProjectTasks`/`api.getProject`
- `components/BoardColumn.tsx` — one status column
- `components/TaskCard.tsx` — one task's card
- Modals: `NewTaskModal.tsx`, `TaskDetailModal.tsx`, `EditProjectModal.tsx`, `NewProjectModal.tsx`, `CriticalityPicker.tsx`
- `pages/ProjectArchive.tsx` — the aged-out `done` tasks view, reads `api.listProjectArchive` (see `processes/task-auto-archive.md`)

## Connected to

- **owns:** nothing — pure view over `objects/core/task.md` / `objects/core/project.md` via `objects/frontend/api-client.md`
- **owned-by:** nothing
- **joins:** `objects/frontend/api-client.md` for all data
- **looks-like-but-is-not:** the calendar's task rendering — a `Task` with `category=meeting` never appears here; the board only shows `category=task` rows scoped to one project

## If you change this

- **Hits:** nothing server-side — this is a pure consumer; a `Task`/`Project` schema change upstream hits this cluster (see those cards' "If you change this")
- **Does not hit:** `objects/frontend/calendar-ui.md` — separate component tree, only shares `api-client.md` and the `Task` type

## Surfaces

| Surface | Role |
|---|---|
| `objects/frontend/api-client.md` | reads/writes |

## See

- Source: `frontend/src/pages/ProjectBoard.tsx`, `frontend/src/components/BoardColumn.tsx`, `TaskCard.tsx`
