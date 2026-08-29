from fastapi import APIRouter, Depends
from app.models.responses import ComfortWeatherResponse, TemperatureTrendResponse
from app.services.weather_service import WeatherService
from app.dependencies import get_weather_service
from app.utils.auth import verify_token
from app.models.auth import TokenPayload

router = APIRouter()

@router.get("/weather/comfort", response_model=ComfortWeatherResponse)
async def get_comfort_weather(
    weather_service: WeatherService = Depends(get_weather_service),
    _token: TokenPayload = Depends(verify_token)
) -> ComfortWeatherResponse:
    return await weather_service.get_comfort_weather_ranking()

@router.get("/weather/cities/{city_id}/temperature-trend", response_model=TemperatureTrendResponse)
async def get_temperature_trend(
    city_id: int,
    weather_service: WeatherService = Depends(get_weather_service),
    _token: TokenPayload = Depends(verify_token)
) -> TemperatureTrendResponse:
    return await weather_service.get_temperature_trend(city_id)
