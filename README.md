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
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Binds to `0.0.0.0` by default so it's reachable from other devices on your
local network at `http://<your-ip>:8000`, per the project's phone-access goal.

### Frontend (development)

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api` requests to the backend on
port 8000 (see `frontend/vite.config.ts`).

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

The app password is encrypted (`cryptography`'s Fernet) before it's written
to the database. The encryption key lives in its own file —
`backend/.fjord_credentials.key` locally, `/data/credentials.key` in Docker —
separate from the database file and never committed to git. This means a
copy of the database alone (a backup, an accidental `git add`) doesn't carry
what's needed to decrypt the password; both files are needed together. It's
not a claim of perfect security — anyone with full access to the running
machine can still get it, same as any locally-stored secret — but it's real
protection against casual exposure, consistent with this app's PIN gate
being "keep out casual snoopers," not bank-grade.

If you ever need to move the database to a new machine, take the key file
with it (`backend/.fjord_credentials.key` or the Docker volume it lives on)
or the stored iCloud credentials won't decrypt — you'd just reconnect from
Settings.

### First run / PIN

The app is open (no login) until you set a PIN — the login screen doubles as
the PIN-setup screen the first time. Change it later from Settings.

## Project layout

```
backend/
  app/
    main.py           FastAPI app, static frontend serving, router wiring
    config.py          Settings (DB path, host/port, iCloud CalDAV creds)
    database.py         SQLAlchemy engine/session
    models.py           Project, Task, AppConfig ORM models
    schemas.py           Pydantic request/response schemas
    auth.py              PIN hashing + signed session cookies
    caldav_client.py     Read-only iCloud CalDAV polling (with cache)
    routers/             API route handlers (projects, tasks, calendar, auth, ics feed)
  requirements.txt
frontend/
  src/
    api/                Typed fetch client for the backend API
    components/          Shared UI (layout, nav, cards, modals, board)
    components/calendar/  Week grid, day columns, backlog drag panel
    lib/                 Date helpers, responsive breakpoint hook
    pages/               Dashboard, Backlog board, Calendar, Login, Settings
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
