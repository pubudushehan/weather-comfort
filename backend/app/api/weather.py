from fastapi import APIRouter, Depends
from app.models.responses import ComfortWeatherResponse
from app.services.weather_service import WeatherService
from app.dependencies import get_weather_service

router = APIRouter()

@router.get("/weather/comfort", response_model=ComfortWeatherResponse)
async def get_comfort_weather(
    weather_service: WeatherService = Depends(get_weather_service)
) -> ComfortWeatherResponse:
    return await weather_service.get_comfort_weather_ranking()
