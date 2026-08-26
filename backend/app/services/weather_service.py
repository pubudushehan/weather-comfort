from datetime import datetime, timezone
from typing import List, Dict, Tuple
import logging

from app.services.city_service import CityService
from app.clients.openweather_client import OpenWeatherClient
from app.services.comfort_service import calculate_comfort_index
from app.models.weather import CityResult, WeatherDetails
from app.models.responses import ComfortWeatherResponse, CacheSummary

logger = logging.getLogger("weather-comfort")

class WeatherService:
    def __init__(self, city_service: CityService, weather_client: OpenWeatherClient) -> None:
        self.city_service = city_service
        self.weather_client = weather_client

    async def get_comfort_weather_ranking(self) -> ComfortWeatherResponse:
        """
        Loads allowed city IDs, fetches weather data, normalizes parameter values,
        calculates Comfort Index Scores, ranks cities stably, and returns the response envelope.
        """
        logger.info("Initiating comfort weather ranking flow...")

        # Load allowed city IDs
        city_ids = self.city_service.get_city_ids()

        # Fetch concurrent weather from weather client
        successful_weather, failed_city_count = await self.weather_client.get_multiple_weather(city_ids)

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

        return ComfortWeatherResponse(
            generated_at=generated_at,
            formula_version="v1",
            city_count=len(sorted_cities),
            failed_city_count=failed_city_count,
            cache=CacheSummary(
                processed="MISS",
                raw_hits=0,
                raw_misses=len(city_ids)
            ),
            cities=sorted_cities
        )
