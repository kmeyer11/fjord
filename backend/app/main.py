from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import projects, tasks

Base.metadata.create_all(bind=engine)

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

app.include_router(projects.router)
app.include_router(tasks.router)


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
