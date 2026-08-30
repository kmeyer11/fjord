# Fjord

A single-user web app for tracking projects, task backlogs, and a calendar —
personal projects like a homelab build and scrapers, plus work backlog, all in
one place. Built for Kristian, mobile-first, dark mode only.

See the full project spec in this repo's history / project notes for the
complete feature list and build order. Short version:

- **Projects dashboard** — cards with a color tag and backlog/scheduled/done counts.
- **Backlog board** — kanban-lite (Backlog / Scheduled / Done) with drag-and-drop.
- **Calendar view** — week view (single-day on mobile) mixing scheduled tasks with
  read-only Apple Calendar events, plus a subscribable `.ics` feed for scheduled tasks.
- **PIN login** — single 4–6 digit PIN gate, no multi-user support.

## Stack

- **Backend:** Python, FastAPI, SQLAlchemy + SQLite (single file, no external DB server)
- **Frontend:** React + Vite, Tailwind CSS, mobile-responsive
- **Serving:** FastAPI serves the built frontend — one process, one port

## Getting started

### Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

`alembic upgrade head` creates/updates `fjord.db` to match the current schema
(see `backend/alembic/`) — run it again after pulling changes that touch
`backend/app/models.py`. The Docker image runs this automatically on
startup.

Binds to `0.0.0.0` by default so it's reachable from other devices on your
local network at `http://<your-ip>:8000`, per the project's phone-access goal.

#### Changing the database schema

Edit `backend/app/models.py`, then generate a migration instead of hand-writing
SQL:

```bash
cd backend
.venv/bin/alembic revision --autogenerate -m "add whatever"
```

Review the generated file in `backend/alembic/versions/` before running it
(autogenerate is good but not infallible — it won't notice a plain column
rename, for example, and will generate a drop+add instead) — then apply it
with `alembic upgrade head`. Commit the migration file alongside the model
change so `docker compose up --build` picks it up automatically on deploy
(the image's `CMD` runs `alembic upgrade head` before starting the server).

### Frontend (development)

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api` requests to the backend on
port 8000 by default (see `frontend/vite.config.ts`). Override the target with
`VITE_DEV_API_TARGET` in `frontend/.env.local` (gitignored) — used below to
point at a second, locally run backend without touching the tracked config.

### Testing locally against real data

When Fjord is already running as the Docker container on the homelab server
(or any machine reachable via `docker`), test changes on your Mac against a
safe copy of that real data instead of an empty database:

```bash
./scripts/dev-snapshot-db.sh          # defaults to container "fjord-fjord-1"
cd backend && uvicorn app.main:app --reload --port 8001
```

```bash
echo "VITE_DEV_API_TARGET=http://127.0.0.1:8001" > frontend/.env.local
npm --prefix frontend run dev
```

The script pulls a point-in-time copy of the live container's `fjord.db`
using SQLite's Online Backup API (the same mechanism behind `sqlite3
.backup`) rather than a raw file copy — safe to run while the container is
serving traffic, since it only ever opens the live file read-only and never
blocks it for more than a moment. It then runs this checkout's migrations on
the copy (so schema changes you're testing locally are applied) and writes
`backend/.env` to point the backend at it. Credentials (PIN hash, iCloud
password) are deliberately *not* copied, so the local backend starts with no
PIN set — pick any throwaway PIN when it asks.

Everything the script writes (`backend/.env`, `backend/.dev-data/`,
`frontend/.env.local`) is gitignored. Re-run the script anytime you want a
fresher copy of the live data.

### Production (single process)

```bash
cd frontend && npm run build
cd ../backend && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

FastAPI serves the built frontend from `frontend/dist` alongside the API, so
only one process and one port are needed.

### Docker

```bash
docker compose up --build
```

Builds the frontend and backend into one image (see `Dockerfile`) and serves
on port 8000, with the SQLite database on a named volume (`fjord-data`) so it
survives rebuilds. Set `FJORD_ICLOUD_USERNAME`/`FJORD_ICLOUD_APP_PASSWORD` in
a `.env` file next to `docker-compose.yml` to enable Apple Calendar sync (see
below) — Compose picks those up automatically. This is the intended path for
running Fjord on the homelab server: point a reverse proxy (Caddy, Traefik,
etc.) at this container rather than exposing port 8000 directly.

### Apple Calendar sync (optional)

Inbound sync (reading your existing calendars) needs an iCloud app-specific
password — generate one at [appleid.apple.com](https://appleid.apple.com),
never your main Apple ID password.

**Settings page** (recommended — no server access needed, good for anyone
running their own copy of Fjord): log in, go to Settings → Apple Calendar →
Connect, enter the iCloud email and app-specific password. Fjord tests the
connection before saving anything, so a typo fails immediately with a clear
error instead of silently not syncing. The app password is encrypted before
it's stored — see "How credentials are stored" below.

**Environment variables** (alternative, for headless/automated deployment —
takes lower priority than the Settings page if both are set):

```bash
export FJORD_ICLOUD_USERNAME="you@icloud.com"
export FJORD_ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"
```

Leave everything unset to run with Apple Calendar sync disabled — everything
else works fine without it. Outbound publishing (the `.ics` feed) needs no
config; its subscribe URL is on the Settings page once you're logged in.

#### How credentials are stored

`fjord.db` holds only your projects and tasks — nothing security-sensitive
lives there. The PIN hash, session-signing secret, `.ics` feed token, and
iCloud credentials all live in a separate local file instead
(`backend/.fjord_secrets.json`, `chmod 600`, gitignored — `/data/secrets.json`
in Docker). That way a copy of your database (a backup, an accidental
`git add`, exporting your data to move it) never carries what's needed to
forge a login session or read your calendar credentials — see
`app/config_store.py`.

The iCloud app password gets an extra step on top: it's encrypted
(`cryptography`'s Fernet) before it's written even to that secrets file, with
the encryption key in a *third*, separate local file
(`backend/.fjord_credentials.key`, `/data/credentials.key` in Docker) — see
`app/secrets_store.py`. So the secrets file and the key file would both need
to leak together to recover the password.

None of this is a claim of perfect security — anyone with full access to the
running machine still gets everything, same as any locally-stored secret on
any software. What it does buy is real protection against the realistic
failure mode: a copy of one file (a DB backup, a data export) ending up
somewhere it shouldn't, without also leaking what's needed to impersonate you
or read your calendar. Consistent with this app's PIN gate itself being
"keep out casual snoopers," not bank-grade.

If you ever move to a new machine, take `.fjord_secrets.json` and
`.fjord_credentials.key` with the database (or the Docker volume holding all
three) — otherwise you'll just need to set a new PIN and reconnect iCloud
from Settings, which is harmless, just an inconvenience.

### First run / PIN

The app is open (no login) until you set a PIN — the login screen doubles as
the PIN-setup screen the first time. Change it later from Settings.

## Project layout

```
backend/
  app/
    main.py           FastAPI app, static frontend serving, router wiring
    config.py          Settings (DB path, host/port, iCloud CalDAV creds)
    database.py         SQLAlchemy engine/session (projects/tasks only)
    models.py           Project, Task ORM models
    schemas.py           Pydantic request/response schemas
    auth.py              PIN hashing + signed session cookies
    config_store.py      Local file store for PIN hash, session secret, iCloud creds, feed token
    secrets_store.py      Fernet encryption for the iCloud app password
    caldav_client.py     Read-only iCloud CalDAV polling (with cache)
    routers/             API route handlers (projects, tasks, calendar, auth, ics feed)
  alembic/              Schema migrations (see "Changing the database schema" above)
  requirements.txt
frontend/
  src/
    api/                Typed fetch client for the backend API
    components/          Shared UI (layout, nav, cards, modals, board)
    components/calendar/  Week grid, day columns, backlog drag panel
    lib/                 Date helpers, responsive breakpoint hook
    pages/               Dashboard, Backlog board, Calendar, Login, Settings
scripts/
  dev-snapshot-db.sh    Pull a safe local copy of the live container's DB (see "Testing locally against real data")
```

## Build order

1. ✅ Scaffold backend (FastAPI + SQLite schema) and frontend shell (React + Vite + Tailwind)
2. ✅ Projects + backlog CRUD, no calendar yet
3. ✅ Calendar view UI with local (in-app only) scheduling — no Apple sync yet
4. ✅ CalDAV read integration — show existing Apple Calendar events in the calendar view
5. ✅ `.ics` feed endpoint — publish scheduled tasks (subscribe flow needs confirming on real Mac/iPhone hardware)
6. ✅ PIN auth
7. Confirm phone access over local Wi-Fi; wire up Tailscale for away-from-home access
8. Polish pass, test on phone, iterate
