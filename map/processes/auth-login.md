---
type: process
status: verified
consumes: ["[[app-secrets-store]]"]
produces: ["[[session-auth]]"]
---

# auth-login

PIN submission → verified/throttled → signed session cookie.

## Input → Movement → Output

Input: a 4-digit PIN from `POST /api/auth/login`, plus the requester's IP. Movement: check IP lockout, verify (or, on first use, set) the PIN against the stored PBKDF2 hash, record success/failure. Output: an HMAC-signed session cookie on success, or a 429 with `Retry-After` on lockout.

## Why this shape

The lockout is per-IP and exponential, not a fixed delay, so a script hammering the endpoint hits a wall that grows (`LOGIN_LOCKOUT_BASE * 2 ** (fail_count - threshold)`, capped at 15 min) instead of a linear one it can just wait out at a known rate.

## Steps

1. `POST /api/auth/login` receives `{pin}` — `backend/app/routers/auth.py:29`
2. `auth.login_retry_after(client_ip)` — if locked, raise 429 before touching the PIN at all (`routers/auth.py:32`)
3. `config_store.load()` — if no `pin_hash` yet, this login sets it (first-run); else `auth.verify_pin` (`routers/auth.py:42-47`)
4. On failure: `record_failed_login` bumps the IP's counter/lockout (`auth.py:47`). On success: `reset_login_attempts`, then `set_session_cookie` (`routers/auth.py:49-50`)

## If you change this

- **Hits:** every session-gated route (depends on the cookie this produces); `frontend/src/pages/Login.tsx`
- **Does not hit:** the API-token path (`objects/auth-and-secrets/api-token.md`) — entirely separate check, no lockout logic applies to it

## Surfaces

| Surface | Role |
|---|---|
| `frontend/src/pages/Login.tsx` | triggers |
| `backend/app/routers/auth.py`, `auth.py` | executes |

## See

- Objects: `objects/auth-and-secrets/session-auth.md`, `objects/auth-and-secrets/app-secrets-store.md`
- Source: `backend/app/routers/auth.py:29`, `backend/app/auth.py:38-57`
