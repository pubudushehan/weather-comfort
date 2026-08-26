from fastapi import APIRouter
from datetime import datetime, timezone
from app.models.responses import ComfortWeatherResponse, CacheSummary
from app.models.weather import CityResult, WeatherDetails, ScoreBreakdown

router = APIRouter()

@router.get("/weather/comfort", response_model=ComfortWeatherResponse)
async def get_comfort_weather() -> ComfortWeatherResponse:
    # Return mock data for Section B
    mock_city = CityResult(
        city_id=2172797,
        city_name="Cairns",
        country="AU",
        rank=1,
        comfort_score=82.45,
        weather=WeatherDetails(
            description="overcast clouds",
            temperature_c=26.12,
            humidity=73,
            pressure_hpa=1012,
            wind_speed_mps=2.57,
            cloudiness_percent=100,
            visibility_km=10.0
        ),
        score_breakdown=ScoreBreakdown(
            temperature=100.0,
            humidity=54.0,
            wind=100.0,
            cloudiness=10.0
        )
    )
    
    return ComfortWeatherResponse(
        generated_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        formula_version="v1",
        city_count=1,
        failed_city_count=0,
        cache=CacheSummary(
            processed="MISS",
            raw_hits=0,
            raw_misses=1
        ),
        cities=[mock_city]
    )
