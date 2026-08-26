from fastapi import APIRouter
from app.models.responses import CacheStatusResponse, ProcessedCacheStatus, RawCacheSummary

router = APIRouter()

@router.get("/cache/status", response_model=CacheStatusResponse)
async def get_cache_status() -> CacheStatusResponse:
    # Return mock data for Section B
    return CacheStatusResponse(
        processed_cache=ProcessedCacheStatus(
            key="weather:processed:all",
            status="MISS",
            ttl_seconds=None
        ),
        raw_cache_summary=RawCacheSummary(
            hits=0,
            misses=0
        )
    )
