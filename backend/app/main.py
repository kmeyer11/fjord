from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app import auth
from app.config import settings
from app.routers import auth as auth_router
from app.routers import calendar, ics_feed, projects, tasks

# Schema creation/changes are Alembic's job (see backend/alembic/), not
# main.py's — run `alembic upgrade head` before starting the server (the
# Docker image's CMD does this automatically).

app = FastAPI(title="Fjord")

# Permissive CORS for the Vite dev server (frontend and backend run as separate
# processes only in development; in production FastAPI serves the built frontend
# directly from the same origin, so this middleware is a no-op there).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# The PIN gate protects the data API; auth's own routes stay open (you need to
# be able to log in before you're logged in), and the .ics feed is checked by
# its own token instead — Apple's calendar client can't do a cookie login.
# require_session_or_api_token also accepts a long-lived bearer token, for
# programmatic clients like the MCP server (see app/generate_api_token.py).
app.include_router(auth_router.router)
app.include_router(projects.router, dependencies=[Depends(auth.require_session_or_api_token)])
app.include_router(tasks.router, dependencies=[Depends(auth.require_session_or_api_token)])
app.include_router(calendar.router, dependencies=[Depends(auth.require_session_or_api_token)])
app.include_router(ics_feed.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


assets_dir = settings.frontend_dist_dir / "assets"
if assets_dir.is_dir():
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    index_file = settings.frontend_dist_dir / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return JSONResponse(
        status_code=503,
        content={"detail": "Frontend not built. Run `npm run build` in frontend/."},
    )
