---
type: object
cluster: mcp-surface
universe: live
status: verified
entity: mcp-server/server.py
---

# Fjord MCP server

Standalone process exposing Fjord's projects/tasks/meetings API as MCP tools, so a Claude session can create and manage them directly — this is the `mcp__fjord__*` tool family.

## Why this shape

A thin HTTP-calling wrapper, not a reimplementation: every tool function is a direct `httpx` call to the running Fjord backend (`_request`, `server.py:39`), authenticated with the long-lived bearer token, never touching `fjord.db` or `models.py` directly. Keeping it thin means the backend's validation/business logic (recurrence, auto-archive, criticality range) is never duplicated here.

## Shape

- `FJORD_API_URL`, `FJORD_API_TOKEN` env vars (`server.py:25-26`) — the token comes from `objects/auth-and-secrets/api-token.md`
- One `@mcp.tool()` function per backend endpoint: `list_projects`, `create_project`, `list_tasks`, `list_project_tasks`, `create_task`, `create_meeting`, `update_task`, `delete_task`
- stdio transport for local/direct runs

Citations: `mcp-server/server.py:1-60`

## Connected to

- **owns:** nothing — stateless pass-through
- **owned-by:** nothing
- **joins:** `objects/auth-and-secrets/api-token.md` (auth), `objects/core/project.md` and `objects/core/task.md` (the data it exposes) via HTTP, not imports
- **looks-like-but-is-not:** a second backend — it has no database, no models, no business logic; every tool call is one HTTP round trip to the real backend

## If you change this

- **Hits:** nothing inside the backend tree — this is a client, changes here can't break the backend
- **Does not hit:** the reverse is not true — a backend route rename/shape change breaks this file's `_request` calls silently until someone re-checks it (no shared types between the two, only an implicit HTTP contract)

## Surfaces

| Surface | Role |
|---|---|
| Fjord backend (`backend/app/main.py` routes) | reads/writes over HTTP |
| A Claude Code session with the `fjord` MCP server configured (outside this repo tree — the connecting config lives in the consumer's `~/.claude` or project MCP settings) | calls these tools |

## See

- Source: `mcp-server/server.py`
- Setup: `README.md` § "MCP integration (Claude)" (added 2026-09-14 — the docstrings in `server.py:1-3` and `generate_api_token.py:1-3` previously pointed at doc sections that didn't exist; both now cite this one)
