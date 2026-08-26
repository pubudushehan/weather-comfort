import pytest
from unittest.mock import MagicMock, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_weather_service
from app.models.responses import ComfortWeatherResponse, CacheSummary
from app.models.weather import CityResult, WeatherDetails, ScoreBreakdown

@pytest.fixture
def mock_weather_service():
    service = MagicMock()
    mock_city = CityResult(
        city_id=1248991,
        city_name="Colombo",
        country="LK",
        rank=1,
        comfort_score=100.0,
        weather=WeatherDetails(
            description="light rain",
            temperature_c=22.0,
            humidity=50,
            pressure_hpa=1010,
            wind_speed_mps=2.0,
            cloudiness_percent=20,
            visibility_km=8.0
        ),
        score_breakdown=ScoreBreakdown(
            temperature=100.0,
            humidity=100.0,
            wind=100.0,
            cloudiness=100.0
        )
    )
    
    mock_response = ComfortWeatherResponse(
        generated_at="2026-08-27T00:00:00Z",
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
    
    service.get_comfort_weather_ranking = AsyncMock(return_value=mock_response)
    return service

@pytest.fixture
def client(mock_weather_service):
    app.dependency_overrides[get_weather_service] = lambda: mock_weather_service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
