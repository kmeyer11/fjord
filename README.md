# Fjord

A single-user web app for tracking projects, task backlogs, and a calendar —
personal projects like a homelab build and scrapers, plus work backlog, all in
one place. Built for Kristian, mobile-first, dark mode only.

See the full project spec in this repo's history / project notes for the
complete feature list and build order. Short version:

- **Projects dashboard** — cards with a color tag and backlog/scheduled/done counts.
- **Backlog board** — kanban-lite (Backlog / Scheduled / Done) with drag-and-drop.
- **Calendar view** *(coming next)* — week view mixing scheduled tasks with read-only
  Apple Calendar events, plus a subscribable `.ics` feed for scheduled tasks.
- **PIN login** *(coming later)* — single 4–6 digit PIN gate, no multi-user support.

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

## Project layout

```
backend/
  app/
    main.py        FastAPI app, static frontend serving
    config.py       Settings (DB path, host/port)
    database.py     SQLAlchemy engine/session
    models.py       Project, Task ORM models
    schemas.py      Pydantic request/response schemas
    routers/        API route handlers
  requirements.txt
frontend/
  src/
    api/            Typed fetch client for the backend API
    components/      Shared UI (layout, nav, cards, modals, board)
    pages/          Dashboard, Backlog board, Calendar
```

## Build order

1. ✅ Scaffold backend (FastAPI + SQLite schema) and frontend shell (React + Vite + Tailwind)
2. ✅ Projects + backlog CRUD, no calendar yet
3. Calendar view UI with local (in-app only) scheduling — no Apple sync yet
4. CalDAV read integration — show existing Apple Calendar events in the calendar view
5. `.ics` feed endpoint — publish scheduled tasks, confirm the subscribe flow works on Mac + iPhone
6. PIN auth
7. Confirm phone access over local Wi-Fi; wire up Tailscale for away-from-home access
8. Polish pass, test on phone, iterate
