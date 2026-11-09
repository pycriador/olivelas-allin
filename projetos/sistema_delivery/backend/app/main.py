from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import router
from .config import settings
from .database import Base, engine
from . import models  # noqa: F401


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if settings.environment.lower() in {"production", "prod"} and (
        settings.jwt_secret_key == "development-only-change-me" or len(settings.jwt_secret_key) < 32
    ):
        raise RuntimeError("Configure JWT_SECRET_KEY com ao menos 32 caracteres em produção.")
    if getattr(_app.state, "initialize_database", True):
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Olivelas Delivery API",
    description="API multi-tenant de pedidos, usuários, grupos de acesso, auditoria e integrações.",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key", "X-Tenant-ID"],
)
app.include_router(router)
