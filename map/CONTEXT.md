# How to walk this map

Fjord is a small self-hosted project/task board with a calendar, backed by one FastAPI app, one React frontend, and one MCP server that exposes the backend to a Claude session. Repeating unit of work here isn't a "run" — it's a change to the code. This map exists to answer, in one or two card reads: *what is this thing* and *what else moves if I touch it*.

## Universes in play

Everything currently catalogued is **live** — no leftover or ghost code found during the audit (2026-09-14, branch `mcp-api-token`). If you find dead code later, mark its card `leftover` or `ghost` rather than deleting the card.

## Naming collisions — read before you "fix" one

- **"Meeting" is not a type.** The DB model is `Task` (`backend/app/models.py:60`) with `category: task | meeting`. A meeting is a project-less `Task` row (`project_id=None`) with `category=meeting`. Don't add a separate `Meeting` table — see `objects/core/task.md`.
- **Two auth mechanisms, one dependency.** Browser sessions (PIN → cookie) and the MCP server's bearer token both satisfy `require_session_or_api_token` (`backend/app/auth.py:124`). They are not interchangeable elsewhere — `require_session` alone (cookie only) still gates a few routes like `/auth/feed-token`. See `objects/auth-and-secrets/`.
- **Two calendars, one word.** "Calendar" in the UI blends two different data sources: Fjord's own tasks/meetings, and read-only external events pulled from iCloud via CalDAV (`objects/calendar-sync/`). They're merged client-side, not in one backend model.
- **Secrets live outside `fjord.db` on purpose.** `AppSecrets` (session secret, PIN hash, iCloud creds, API token, ICS token) is a separate JSON file (`backend/app/config_store.py`), not a DB table — so a database backup/export never carries login-forging material. Don't "simplify" this into a table without re-reading the comment at `config_store.py:1`.

## Reading order

1. `objects/_index.md` — find the cluster your noun lives in.
2. The object card itself — cites source, states "why this shape," lists Hits/Does not hit.
3. Only if you're about to make the change: `effects/CONTEXT.md` for the full blast radius, and any process card the object `consumes`/`produces`.

Token budget: this file + one object card + its cited source should land well under 8k tokens. If you're pulling in more than that, you've gone past what the task needs.
