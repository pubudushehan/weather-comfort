import pytest
from unittest.mock import MagicMock
from app.services.weather_service import WeatherService
from app.clients.openweather_client import OpenWeatherClient
from app.services.city_service import CityService

@pytest.mark.asyncio
async def test_weather_service_ranking_and_normalization():
    # Mock CityService
    mock_city_service = MagicMock(spec=CityService)
    mock_city_service.get_city_ids.return_value = [1248991, 1850147, 2644210]
    
    # Mock OpenWeatherClient
    mock_weather_client = MagicMock(spec=OpenWeatherClient)
    
    # Colombo: Ideal conditions -> score 100
    raw_colombo = {
        "name": "Colombo",
        "sys": {"country": "LK"},
        "weather": [{"description": "light rain"}],
        "main": {"temp": 22.0, "humidity": 50, "pressure": 1010},
        "wind": {"speed": 2.0},
        "clouds": {"all": 20},
        "visibility": 8000
    }
    
    # Tokyo: Ideal conditions -> score 100. Ties with Colombo. Colombo vs Tokyo: C < T, so Colombo ranks 1, Tokyo ranks 2
    raw_tokyo = {
        "name": "Tokyo",
        "sys": {"country": "JP"},
        "weather": [{"description": "clear sky"}],
        "main": {"temp": 22.0, "humidity": 50, "pressure": 1012},
        "wind": {"speed": 2.0},
        "clouds": {"all": 20},
        "visibility": 10000
    }
    
    # Liverpool: Poor conditions -> lower score
    raw_liverpool = {
        "name": "Liverpool",
        "sys": {"country": "GB"},
        "weather": [{"description": "broken clouds"}],
        "main": {"temp": 35.0, "humidity": 90, "pressure": 1015},
        "wind": {"speed": 10.0},
        "clouds": {"all": 80},
        "visibility": 6000
    }
    
    mock_weather_client.get_multiple_weather.return_value = (
        {
            1248991: raw_colombo,
            1850147: raw_tokyo,
            2644210: raw_liverpool
        },
        0
    )
    
    service = WeatherService(city_service=mock_city_service, weather_client=mock_weather_client)
    response = await service.get_comfort_weather_ranking()
    
    assert response.city_count == 3
    assert response.failed_city_count == 0
    
    # Assert stable ranking
    # Rank 1: Colombo (score 100, name 'C')
    # Rank 2: Tokyo (score 100, name 'T')
    # Rank 3: Liverpool (score < 100)
    assert response.cities[0].city_name == "Colombo"
    assert response.cities[0].rank == 1
    assert response.cities[0].comfort_score == 100.0
    
    assert response.cities[1].city_name == "Tokyo"
    assert response.cities[1].rank == 2
    assert response.cities[1].comfort_score == 100.0
    
    assert response.cities[2].city_name == "Liverpool"
    assert response.cities[2].rank == 3
    assert response.cities[2].comfort_score < 100.0
    
    # Check normalization properties
    colombo_result = response.cities[0]
    assert colombo_result.weather.temperature_c == 22.0
    assert colombo_result.weather.humidity == 50
    assert colombo_result.weather.visibility_km == 8.0 # 8000m -> 8.0km

@pytest.mark.asyncio
async def test_weather_service_partial_failure():
    mock_city_service = MagicMock(spec=CityService)
    mock_city_service.get_city_ids.return_value = [1248991, 999]
    
    mock_weather_client = MagicMock(spec=OpenWeatherClient)
    raw_colombo = {
        "name": "Colombo",
        "sys": {"country": "LK"},
        "weather": [{"description": "light rain"}],
        "main": {"temp": 22.0, "humidity": 50, "pressure": 1010},
        "wind": {"speed": 2.0},
        "clouds": {"all": 20},
        "visibility": 8000
    }
    
    # Colombo succeeds, ID 999 fails
    mock_weather_client.get_multiple_weather.return_value = (
        {1248991: raw_colombo},
        1
    )
    
    service = WeatherService(city_service=mock_city_service, weather_client=mock_weather_client)
    response = await service.get_comfort_weather_ranking()
    
    assert response.city_count == 1
    assert response.failed_city_count == 1
    assert len(response.cities) == 1
    assert response.cities[0].city_name == "Colombo"
