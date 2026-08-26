from app.services.city_service import CityService
from app.clients.openweather_client import OpenWeatherClient
from app.services.weather_service import WeatherService
from app.cache.redis_cache import RedisCache

# Global Redis Cache singleton
redis_cache = RedisCache()

def get_city_service() -> CityService:
    return CityService()

def get_weather_client() -> OpenWeatherClient:
    return OpenWeatherClient()

def get_redis_cache() -> RedisCache:
    return redis_cache

def get_weather_service() -> WeatherService:
    return WeatherService(
        city_service=get_city_service(),
        weather_client=get_weather_client(),
        redis_cache=get_redis_cache()
    )
