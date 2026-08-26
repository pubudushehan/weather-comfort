from fastapi import APIRouter, Depends
from app.models.responses import CacheStatusResponse, ProcessedCacheStatus, RawCacheSummary
from app.cache.redis_cache import RedisCache
from app.dependencies import get_redis_cache
from app.utils.auth import verify_token
from app.models.auth import TokenPayload

router = APIRouter()

@router.get("/cache/status", response_model=CacheStatusResponse)
async def get_cache_status(
    redis_cache: RedisCache = Depends(get_redis_cache),
    _token: TokenPayload = Depends(verify_token)
) -> CacheStatusResponse:
    ttl = await redis_cache.get_ttl("weather:processed:all")
    status = "HIT" if ttl is not None else "MISS"

    hits = await redis_cache.get_counter("stats:raw:hits")
    misses = await redis_cache.get_counter("stats:raw:misses")

    return CacheStatusResponse(
        processed_cache=ProcessedCacheStatus(
            key="weather:processed:all",
            status=status,
            ttl_seconds=ttl
        ),
        raw_cache_summary=RawCacheSummary(
            hits=hits,
            misses=misses
        )
    )
