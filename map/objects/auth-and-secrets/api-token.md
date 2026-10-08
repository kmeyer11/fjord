---
type: object
cluster: auth-and-secrets
universe: live
status: verified
entity: backend/app/generate_api_token.py
---

# API bearer token

A long-lived token for programmatic clients (the MCP server, today the only one) that can't do a browser-style PIN login. Deliberately separate from the session-cookie flow.

## Why this shape

Generated offline via `python -m app.generate_api_token` (`generate_api_token.py`), printed once, stored in `AppSecrets.api_token`. Checked with `hmac.compare_digest` (`auth.py:134`) to avoid timing-attack leakage. Rotating it (rerunning the script) invalidates the old one immediately — any client still holding it breaks until updated.

## Shape

- 32-byte URL-safe random token (`secrets.token_urlsafe(32)`)
- Read via `Authorization: Bearer <token>` header, checked only inside `require_session_or_api_token` (`auth.py:124`) — routes gated by plain `require_session` (change-pin) don't accept it

Citations: `backend/app/generate_api_token.py:1-26`, `backend/app/auth.py:124-138`

## Connected to

- **owns:** nothing
- **owned-by:** stored as a field on `objects/auth-and-secrets/app-secrets-store.md`
- **joins:** `objects/mcp-surface/fjord-mcp-server.md` — the only current consumer
- **looks-like-but-is-not:** the iCloud app password — that authenticates Fjord *to* iCloud; this authenticates clients *to* Fjord

## If you change this

- **Hits:** the MCP server's `FJORD_API_TOKEN` env var must be updated in lockstep on rotation, or every MCP tool call starts 401ing
- **Does not hit:** session/cookie auth, PIN flow — fully independent code paths

## Surfaces

| Surface | Role |
|---|---|
| `backend/app/generate_api_token.py` | writes (CLI, run manually) |
| `backend/app/auth.py` (`require_session_or_api_token`) | reads |
| `mcp-server/server.py` | reads (`FJORD_API_TOKEN` env var, sent as bearer header) |

## See

- Source: `backend/app/generate_api_token.py`
- Check: `backend/app/auth.py:124`
