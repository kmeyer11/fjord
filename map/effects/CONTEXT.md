# Change-impact index

"I'm changing X, what inside the tree moves." Catalog only — the real waterfall lives on each card's "If you change this." If this index and a card disagree, trust the card and fix this file.

## Backend

| Changing | Open these cards |
|---|---|
| `Task` fields/schema | `objects/core/task.md`, `processes/recurrence-expand.md`, `processes/calendar-push.md`, `processes/ics-export.md`, `processes/task-auto-archive.md`, `objects/frontend/api-client.md` |
| `Project` fields/schema | `objects/core/project.md`, `processes/task-auto-archive.md` |
| `ARCHIVE_AFTER` / archive logic | `processes/task-auto-archive.md` — `list_tasks` (cross-project, calendar) deliberately does not apply this filter; only per-project reads (board) do. Confirmed intentional 2026-09-14, don't unify them. |
| Recurrence horizon / weekly-step logic | `processes/recurrence-expand.md`, `objects/core/task.md` |
| Session auth / cookie behavior | `objects/auth-and-secrets/session-auth.md`, `processes/auth-login.md` |
| API bearer token | `objects/auth-and-secrets/api-token.md` — rotating it breaks the MCP server until `FJORD_API_TOKEN` is updated to match |
| `AppSecrets` shape | `objects/auth-and-secrets/app-secrets-store.md` — every field's consumer is listed there |
| CalDAV sync / iCloud creds | `objects/calendar-sync/caldav-client.md`, `processes/caldav-sync.md`, `objects/calendar-sync/calendar-push.md` (same credentials) |
| Writing meetings to Apple Calendar / which meetings are published | `objects/calendar-sync/calendar-push.md`, `processes/calendar-push.md` — the filter and event builder are shared with the `.ics` feed |
| `.ics` feed route or query filter | `objects/calendar-sync/ics-feed.md`, `processes/ics-export.md` — external subscribers hardcode this URL, ask before changing the path or token param name |
| Any backend route path/shape | `objects/frontend/api-client.md` (hand-maintained types, no build-time check) and `objects/mcp-surface/fjord-mcp-server.md` (HTTP contract, no shared types either) |

## Frontend

| Changing | Open these cards |
|---|---|
| `api` client methods in `client.ts` | `objects/frontend/api-client.md` — every page/component that calls it |
| Board components | `objects/frontend/board-ui.md` |
| Calendar components | `objects/frontend/calendar-ui.md` |

## MCP server

| Changing | Open these cards |
|---|---|
| `mcp-server/server.py` tool functions | `objects/mcp-surface/fjord-mcp-server.md` — the reverse is more dangerous: a backend route change silently breaks this file, nothing here catches it automatically |

## What points INTO this tree from outside

- The user's chosen iCloud calendar holds `fjord-task-<id>.ics` events Fjord wrote — see `objects/calendar-sync/calendar-push.md`.
- External `.ics` subscribers (Apple Calendar) may still hold a hardcoded URL with the feed token — see `objects/calendar-sync/ics-feed.md`.
- Any Claude Code session with the `fjord` MCP server configured calls into `mcp-server/server.py` by name — its tool names/signatures are a public contract even though nothing in this repo enforces that.
- Ask the owner before assuming this list is complete — external consumers don't show up in a grep of this tree by definition.
