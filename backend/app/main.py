from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.config import settings
from app.logging_config import setup_logging
from app.api.health import router as health_router
from app.api.weather import router as weather_router
from app.api.cache import router as cache_router
from app.dependencies import redis_cache

# Setup logging
setup_logging()
logger = logging.getLogger("weather-comfort")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up %s in %s environment...", settings.APP_NAME, settings.ENVIRONMENT)
    yield
    logger.info("Shutting down %s...", settings.APP_NAME)
    await redis_cache.close()

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(weather_router, prefix="/api/v1")
app.include_router(cache_router, prefix="/api/v1")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception occurred: %s", str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"}
    )
