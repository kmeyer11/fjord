---
type: object
cluster: frontend
universe: live
status: verified
entity: frontend/src/api/client.ts
---

# API client

The frontend's single point of contact with the backend — every page/component calls through the `api` object here, never `fetch` directly.

## Why this shape

One `request<T>` wrapper (`client.ts:16`) centralizes credentials (`credentials: 'include'` for the session cookie), error unwrapping (`ApiError` with `status`/`retryAfter`), and the global 401 handling: any non-`/auth/*` 401 dispatches a `fjord:unauthorized` window event rather than throwing straight into the caller, so one listener can redirect to login regardless of which call failed.

## Shape

- `api.*` methods, one per backend endpoint, typed against `./types.ts` (which mirrors `backend/app/schemas.py` by hand — not generated)
- `ApiError` — `status`, `message`, optional `retryAfter` (used for the login-lockout 429)
- `UNAUTHORIZED_EVENT` — the string `'fjord:unauthorized'`, dispatched on `window`

Citations: `frontend/src/api/client.ts:1-111`

## Connected to

- **owns:** nothing
- **owned-by:** nothing
- **joins:** every backend router by URL path convention (`/api/<router-prefix>/...`, prefix stripped/added implicitly — `request()` prepends `/api`)
- **looks-like-but-is-not:** a generated client — `types.ts` is hand-maintained and can drift from `backend/app/schemas.py`; there is no schema-sync step

## If you change this

- **Hits:** every page and component that imports `api` (all of `frontend/src/pages/*`, several `components/*`) — a method signature change is a find-all-usages change, not a local one
- **Does not hit:** the backend itself (this is a one-way consumer); adding a method here with no matching route just 404s at runtime, nothing catches it at build time

## Surfaces

| Surface | Role |
|---|---|
| `frontend/src/pages/*.tsx`, `components/calendar/*`, board components | reads/writes (calls `api.*`) |
| `frontend/src/App.tsx:30` (listens for `UNAUTHORIZED_EVENT`, redirects to login) | reads |

## See

- Source: `frontend/src/api/client.ts`
- Types: `frontend/src/api/types.ts`
