---
type: object
cluster: auth-and-secrets
universe: live
status: verified
entity: backend/app/auth.py
---

# Session auth (PIN/cookie)

Single-user, PIN-gated session auth. No usernames — one 4-digit PIN protects the whole app; first PIN entered becomes the PIN (`routers/auth.py:42`).

## Why this shape

A 4-digit PIN is only 10,000 combinations, so the defense is throttling, not entropy: 2 free wrong guesses, then exponential-backoff lockout per IP, capped at 15 minutes (`LOGIN_FAIL_THRESHOLD`/`LOGIN_LOCKOUT_*`, `auth.py:18-26`). Lockout state is in-memory by design — resets on restart, trades persistence for not growing an ever-larger file of IPs on a single-process personal app.

## Shape

- `SESSION_COOKIE` = `fjord_session`, HMAC-signed `issued_at` timestamp (not a JWT, no library) — `make_session_token`/`decode_session_token` (`auth.py:81-98`)
- 2-hour inactivity expiry (`SESSION_MAX_AGE`); cookie reissued if older than 30 min instead of on every request (`SESSION_REFRESH_AFTER`)
- PIN hashed with PBKDF2-HMAC-SHA256, 200k iterations, random salt (`hash_pin`, `auth.py:69`)

Citations: `backend/app/auth.py:13-138`

## Connected to

- **owns:** nothing persisted itself — reads/writes `pin_hash`, `session_secret` on `objects/auth-and-secrets/app-secrets-store.md`
- **owned-by:** nothing
- **joins:** `objects/auth-and-secrets/api-token.md` via `require_session_or_api_token`, the shared FastAPI dependency both paths satisfy
- **looks-like-but-is-not:** the API bearer token — same dependency gates both, but they're not interchangeable everywhere: `/auth/change-pin` requires `require_session` specifically, cookie-only, no bearer fallback

## If you change this

- **Hits:** every data router (`projects`, `tasks`, `calendar` all depend on `require_session_or_api_token`, wired in `main.py:34-36`); frontend's 401 handling (`UNAUTHORIZED_EVENT`, `frontend/src/api/client.ts:22`)
- **Does not hit:** the MCP server's own auth (separate bearer-token path, doesn't touch cookies at all) — see `objects/mcp-surface/fjord-mcp-server.md`

## Surfaces

| Surface | Role |
|---|---|
| `backend/app/routers/auth.py` | reads/writes |
| every session-gated router | reads (dependency) |
| `frontend/src/pages/Login.tsx` | writes (submits PIN) |

## See

- Source: `backend/app/auth.py`
- Router: `backend/app/routers/auth.py`
