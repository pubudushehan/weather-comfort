from datetime import datetime, timezone
from typing import Any, List, Dict, Optional, Tuple
import logging

from app.services.city_service import CityService
from app.clients.openweather_client import OpenWeatherClient
from app.services.comfort_service import calculate_comfort_index
from app.models.weather import CityResult, WeatherDetails
from app.models.responses import ComfortWeatherResponse, CacheSummary

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
                    visibility_m=visibility_m
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
