from datetime import datetime, timezone
from typing import Any, List, Dict, Optional, Tuple
import logging

from app.services.city_service import CityService
from app.clients.openweather_client import OpenWeatherClient
from app.services.comfort_service import calculate_comfort_index
from app.models.weather import CityResult, WeatherDetails
from app.models.responses import ComfortWeatherResponse, CacheSummary, ForecastPoint, TrendCacheInfo, TemperatureTrendResponse
from fastapi import HTTPException

logger = logging.getLogger("weather-comfort")

class WeatherService:
    def __init__(
        self,
        city_service: CityService,
        weather_client: OpenWeatherClient,
        redis_cache: Optional[Any] = None
    ) -> None:
        self.city_service = city_service
        self.weather_client = weather_client
        self.redis_cache = redis_cache

    async def get_comfort_weather_ranking(self) -> ComfortWeatherResponse:
        """
        Loads allowed city IDs, checks processed cache, checks raw cache,
        fetches missing city weather, processes scores, and saves to cache layers.
        """
        logger.info("Initiating comfort weather ranking flow...")

        # 1. Check processed cache
        if self.redis_cache:
            try:
                cached_data = await self.redis_cache.get_json("weather:processed:all")
                if cached_data:
                    # Deserialize cache and mark processed HIT
                    response = ComfortWeatherResponse.parse_obj(cached_data)
                    response.cache.processed = "HIT"
                    logger.info("Processed dashboard cache HIT.")
                    return response
            except Exception as e:
                logger.error("Failed to read processed cache: %s", str(e))

        # 2. Processed Cache MISS
        city_ids = self.city_service.get_city_ids()
        successful_weather: Dict[int, dict] = {}
        missed_city_ids: List[int] = []
        raw_hits = 0
        raw_misses = 0

        # Check raw cache for each city
        for city_id in city_ids:
            cached_raw = None
            if self.redis_cache:
                try:
                    cached_raw = await self.redis_cache.get_json(f"weather:raw:{city_id}")
                except Exception as e:
                    logger.error("Failed to read raw cache for city %d: %s", city_id, str(e))

            if cached_raw:
                successful_weather[city_id] = cached_raw
                raw_hits += 1
                if self.redis_cache:
                    await self.redis_cache.incr("stats:raw:hits")
            else:
                missed_city_ids.append(city_id)
                raw_misses += 1
                if self.redis_cache:
                    await self.redis_cache.incr("stats:raw:misses")

        # Fetch concurrent weather from provider for missing cities
        failed_city_count = 0
        if missed_city_ids:
            logger.info("Raw cache misses: %s. Fetching from OpenWeatherMap...", missed_city_ids)
            fetched_weather, provider_failures = await self.weather_client.get_multiple_weather(missed_city_ids)
            failed_city_count += provider_failures

            # Cache raw results
            for city_id, raw in fetched_weather.items():
                successful_weather[city_id] = raw
                if self.redis_cache:
                    try:
                        await self.redis_cache.set_json(f"weather:raw:{city_id}", raw, ttl_seconds=300)
                    except Exception as e:
                        logger.error("Failed to set raw cache for city %d: %s", city_id, str(e))

        city_results: List[CityResult] = []
        for city_id, raw in successful_weather.items():
            try:
                # Normalize provider fields
                city_name = raw.get("name", "Unknown")
                country = raw.get("sys", {}).get("country", "Unknown")

                weather_list = raw.get("weather", [])
                description = weather_list[0].get("description", "clear sky") if weather_list else "clear sky"

                main_data = raw.get("main", {})
                temp_c = float(main_data.get("temp", 0.0))
                humidity = int(main_data.get("humidity", 0))
                pressure = int(main_data.get("pressure", 1013))

                wind_data = raw.get("wind", {})
                wind_speed = float(wind_data.get("speed", 0.0))

                clouds_data = raw.get("clouds", {})
                cloudiness = int(clouds_data.get("all", 0))

                # Visibility is in meters, convert to km
                visibility_m = raw.get("visibility")
                visibility_km = float(visibility_m / 1000) if visibility_m is not None else 10.0

                # Compute index score
                calc_result = calculate_comfort_index(
                    temperature_c=temp_c,
                    humidity=float(humidity),
                    wind_speed_mps=wind_speed,
                    cloudiness_percent=float(cloudiness),
                )

                weather_details = WeatherDetails(
                    description=description,
                    temperature_c=temp_c,
                    humidity=humidity,
                    pressure_hpa=pressure,
                    wind_speed_mps=wind_speed,
                    cloudiness_percent=cloudiness,
                    visibility_km=visibility_km
                )

                city_result = CityResult(
                    city_id=city_id,
                    city_name=city_name,
                    country=country,
                    rank=0,  # Assigned after sorting
                    comfort_score=calc_result.total_score,
                    weather=weather_details,
                    score_breakdown=calc_result.score_breakdown
                )
                city_results.append(city_result)
            except Exception as e:
                logger.error("Failed to parse and compute comfort score for city %d: %s", city_id, str(e), exc_info=True)
                failed_city_count += 1

        # Stable sort: comfort_score descending, city_name.lower() ascending
        sorted_cities = sorted(
            city_results,
            key=lambda city: (-city.comfort_score, city.city_name.lower())
        )

        # Assign ranks starting at 1
        for rank, city in enumerate(sorted_cities, start=1):
            city.rank = rank

        generated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        response = ComfortWeatherResponse(
            generated_at=generated_at,
            formula_version="v1",
            city_count=len(sorted_cities),
            failed_city_count=failed_city_count,
            cache=CacheSummary(
                processed="MISS",
                raw_hits=raw_hits,
                raw_misses=raw_misses
            ),
            cities=sorted_cities
        )

        # Cache processed results in Redis (TTL = 60s)
        if self.redis_cache and len(sorted_cities) > 0:
            try:
                await self.redis_cache.set_json("weather:processed:all", response.dict(), ttl_seconds=60)
            except Exception as e:
                logger.error("Failed to write processed dashboard cache: %s", str(e))

        return response

    async def get_temperature_trend(self, city_id: int) -> TemperatureTrendResponse:
        """
        Retrieves the 24-hour temperature forecast trend (8 points, 3-hour interval) for a city.
        """
        # 1. Validate city ID
        city_ids = self.city_service.get_city_ids()
        if city_id not in city_ids:
            raise HTTPException(
                status_code=400,
                detail=f"City ID {city_id} is not in the approved registry"
            )

        city_name = self.city_service.get_city_name(city_id) or "Unknown"

        cache_key = f"weather:forecast:{city_id}"
        cached_forecast = None
        ttl_seconds = None
        cache_status = "MISS"

        # 2. Check cache
        if self.redis_cache:
            try:
                cached_forecast = await self.redis_cache.get_json(cache_key)
                if cached_forecast:
                    cache_status = "HIT"
                    ttl_seconds = await self.redis_cache.get_ttl(cache_key)
            except Exception as e:
                logger.error("Failed to read forecast cache for city %d: %s", city_id, str(e))

        # 3. Cache MISS -> Fetch from OpenWeatherMap
        if not cached_forecast:
            try:
                cached_forecast = await self.weather_client.get_forecast_weather(city_id)
                if self.redis_cache:
                    try:
                        await self.redis_cache.set_json(cache_key, cached_forecast, ttl_seconds=900)
                        ttl_seconds = 900
                      # Force statistics updates if needed, or keep it simple
                    except Exception as e:
                        logger.error("Failed to write forecast cache for city %d: %s", city_id, str(e))
            except Exception as e:
                logger.error("Failed to fetch forecast from provider for city %d: %s", city_id, str(e))
                raise HTTPException(
                    status_code=502,
                    detail=f"Weather provider error: {str(e)}"
                )

        # 4. Process forecast data
        forecast_list = cached_forecast.get("list", [])
        
        # Sort and filter the first 8 points (next 24 hours)
        sorted_points = sorted(forecast_list, key=lambda x: x.get("dt", 0))
        selected_points = sorted_points[:8]

        forecast_points = []
        for pt in selected_points:
            dt_unix = pt.get("dt")
            temp_c = float(pt.get("main", {}).get("temp", 0.0))
            
            # Format to ISO 8601 UTC timestamp (e.g. "2026-08-28T09:00:00Z")
            dt_utc = datetime.fromtimestamp(dt_unix, tz=timezone.utc)
            timestamp_utc = dt_utc.isoformat().replace("+00:00", "Z")
            
            forecast_points.append(
                ForecastPoint(
                    timestamp_utc=timestamp_utc,
                    temperature_c=temp_c
                )
            )

        generated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        return TemperatureTrendResponse(
            city_id=city_id,
            city_name=city_name,
            source_interval_hours=3,
            forecast_points=forecast_points,
            generated_at=generated_at,
            cache=TrendCacheInfo(
                status=cache_status,
                ttl_seconds=ttl_seconds
            )
        )
