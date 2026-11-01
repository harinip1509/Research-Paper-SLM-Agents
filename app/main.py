"""ScholarForge FastAPI Application Entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import router as api_router
from app.config import settings
from app.core.database import init_db
from app.services.faiss_service import faiss_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("scholarforge")

STATIC_DIR = Path(__file__).resolve().parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ScholarForge database and vector index...")
    init_db()
    try:
        faiss_service.initialize_index()
    except Exception as e:
        logger.warning("FAISS warm-up deferred: %s", e)
    logger.info("ScholarForge backend is ready.")
    yield
    logger.info("ScholarForge backend shutting down.")


app = FastAPI(
    title="ScholarForge API",
    description="Multi-agent assistant for writing conference papers with Topic Uniqueness scoring and multi-venue export.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/", tags=["UI"], include_in_schema=False)
    async def serve_dashboard():
        return FileResponse(str(STATIC_DIR / "index.html"))

    @app.get("/favicon.ico", include_in_schema=False)
    @app.get("/favicon.svg", include_in_schema=False)
    async def serve_favicon():
        fav_file = STATIC_DIR / "favicon.svg"
        if fav_file.exists():
            return FileResponse(str(fav_file), media_type="image/svg+xml")
        from fastapi.responses import Response
        svg_content = (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">'
            '<circle cx="32" cy="32" r="30" fill="#3D281D" stroke="#EADFD2" stroke-width="2"/>'
            '<text x="32" y="42" font-family="Georgia, serif" font-size="34" font-weight="600" fill="#FAF7F2" text-anchor="middle">S</text>'
            '</svg>'
        )
        return Response(content=svg_content, media_type="image/svg+xml")


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "app": "ScholarForge",
        "version": "0.1.0",
        "environment": settings.app_env,
        "embedding_model": settings.embedding_model_name,
        "groq_writing_model": settings.groq_model_writing,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
