from app.services.city_service import CityService
from app.clients.openweather_client import OpenWeatherClient
from app.services.weather_service import WeatherService

# We import WeatherService at runtime if needed, but since we are creating it, let's import it directly

def get_city_service() -> CityService:
    return CityService()

def get_weather_client() -> OpenWeatherClient:
    return OpenWeatherClient()

def get_weather_service() -> WeatherService:
    return WeatherService(
        city_service=get_city_service(),
        weather_client=get_weather_client()
    )
