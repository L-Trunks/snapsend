import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import share, upload, admin
from .services.cleanup_service import start_cleanup_scheduler, stop_cleanup_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    start_cleanup_scheduler()
    yield
    stop_cleanup_scheduler()


app = FastAPI(
    title="SnapSend API",
    description="Anonymous temporary file & text sharing platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(share.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
