from pydantic import BaseModel, Field
from typing import List, Optional
from app.models.weather import CityResult

class CacheSummary(BaseModel):
    processed: str = Field(..., description="Processed cache status (e.g., HIT, MISS)")
    raw_hits: int = Field(..., description="Number of raw cache hits")
    raw_misses: int = Field(..., description="Number of raw cache misses")

class ComfortWeatherResponse(BaseModel):
    generated_at: str = Field(..., description="ISO 8601 UTC timestamp when response was generated")
    formula_version: str = Field(..., description="Comfort score formula version (e.g. v1, v2)")
    city_count: int = Field(..., description="Number of cities successfully processed")
    failed_city_count: int = Field(..., description="Number of cities that failed during fetching")
    cache: CacheSummary
    cities: List[CityResult] = Field(..., description="List of ranked city comfort scores")

class ProcessedCacheStatus(BaseModel):
    key: str = Field(..., description="Redis key used for processed cache storage")
    status: str = Field(..., description="Processed cache status (e.g., HIT, MISS)")
    ttl_seconds: Optional[int] = Field(None, description="Time to live in seconds")

class RawCacheSummary(BaseModel):
    hits: int = Field(..., description="Total raw cache hits across cities")
    misses: int = Field(..., description="Total raw cache misses across cities")

class CacheStatusResponse(BaseModel):
    processed_cache: ProcessedCacheStatus
    raw_cache_summary: RawCacheSummary
