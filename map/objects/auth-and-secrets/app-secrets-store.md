---
type: object
cluster: auth-and-secrets
universe: live
status: verified
entity: backend/app/config_store.py
---

# AppSecrets store

The single JSON file holding every security-sensitive value: session-signing secret, PIN hash, `.ics` feed token, iCloud credentials (app password encrypted), API bearer token. Deliberately not a `fjord.db` table.

## Why this shape

Kept out of `fjord.db` on purpose: if the database is ever backed up, exported, or copied elsewhere, it doesn't carry the session secret (which alone would let someone forge a login) or iCloud credentials (`config_store.py:1-9`). Writes are atomic (`tmp.replace(path)`, `config_store.py:48`) so a crash mid-write can't leave a corrupt half-written secrets file. iCloud app password is Fernet-encrypted at rest by `secrets_store.py`, whose key lives in its own file (`credentials_key_path`) — separate from both `fjord.db` and the secrets JSON, so neither alone can decrypt it.

## Shape

- `AppSecrets` dataclass: `session_secret`, `ics_token`, `pin_hash`, `icloud_username`, `icloud_app_password_enc`, `api_token`
- `load()`/`save()` — file at `settings.secrets_path`, `chmod 0o600`
- `secrets_store.encrypt`/`decrypt` — Fernet, key at `settings.credentials_key_path`, generated on first use

Citations: `backend/app/config_store.py:1-48`, `backend/app/secrets_store.py:1-35`

## Connected to

- **owns:** every secret value used by `objects/auth-and-secrets/session-auth.md`, `objects/auth-and-secrets/api-token.md`, `objects/calendar-sync/caldav-client.md`
- **owned-by:** nothing
- **joins:** none
- **looks-like-but-is-not:** `backend/app/config.py` (`settings`) — that's env-var *configuration* (paths, timezone, fallback iCloud creds for headless deploy), read-only at runtime; this is *mutable secret state* written by the running app

## If you change this

- **Hits:** every consumer listed above — adding/removing a field means touching `load()`'s default-construction path too, since existing on-disk JSON won't have a new field until first `save()`
- **Does not hit:** `fjord.db` / Alembic — this file has no schema migrations, it's hand-rolled JSON

## Surfaces

| Surface | Role |
|---|---|
| `backend/app/auth.py`, `routers/auth.py`, `routers/calendar.py`, `routers/ics_feed.py` | reads/writes |
| `backend/app/caldav_client.py` | reads (credentials) |
| `backend/app/generate_api_token.py` | writes (`api_token` only) |

## See

- Source: `backend/app/config_store.py`, `backend/app/secrets_store.py`
