import pytest
from unittest.mock import MagicMock, AsyncMock
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.services.weather_service import WeatherService
from app.clients.openweather_client import OpenWeatherClient, OpenWeatherProviderError
from app.services.city_service import CityService
from app.cache.redis_cache import RedisCache
from app.models.responses import TemperatureTrendResponse

# 1. Test invalid/missing Auth0 token is rejected
def test_forecast_endpoint_requires_authentication():
    # TestClient without verify_token dependency override
    with TestClient(app) as client:
        response = client.get("/api/v1/weather/cities/1248991/temperature-trend")
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid authentication credentials"

# 2. Test unapproved city ID is rejected
def test_forecast_endpoint_rejects_unapproved_city():
    # Use dependency override for auth, but verify validator rejects city
    from app.utils.auth import verify_token
    from app.models.auth import TokenPayload

    app.dependency_overrides[verify_token] = lambda: TokenPayload(
        sub="auth0|mock_user", email="mock@example.com", scope="read:weather"
    )

    with TestClient(app) as client:
        # 99999 is not in cities.json
        response = client.get("/api/v1/weather/cities/99999/temperature-trend")
        assert response.status_code == 400
        assert "not in the approved registry" in response.json()["detail"]

    app.dependency_overrides.clear()

# Mock raw OpenWeatherMap forecast payload
MOCK_RAW_FORECAST = {
    "list": [
        {"dt": 1629302400, "main": {"temp": 22.4}},
        {"dt": 1629313200, "main": {"temp": 20.1}},
        {"dt": 1629324000, "main": {"temp": 18.5}},
        {"dt": 1629291600, "main": {"temp": 24.0}},  # out of order
        {"dt": 1629334800, "main": {"temp": 17.2}},
        {"dt": 1629345600, "main": {"temp": 16.0}},
        {"dt": 1629356400, "main": {"temp": 15.5}},
        {"dt": 1629367200, "main": {"temp": 15.0}},
        {"dt": 1629378000, "main": {"temp": 14.2}},  # 9th point
    ]
}

# 3. Test normalization, ordering, and limit of 8 points
@pytest.mark.asyncio
async def test_forecast_normalization_and_sorting():
    mock_city_service = MagicMock(spec=CityService)
    mock_city_service.get_city_ids.return_value = [1248991]
    mock_city_service.get_city_name.return_value = "Colombo"

    mock_weather_client = MagicMock(spec=OpenWeatherClient)
    mock_weather_client.get_forecast_weather = AsyncMock(return_value=MOCK_RAW_FORECAST)

    service = WeatherService(city_service=mock_city_service, weather_client=mock_weather_client)
    response = await service.get_temperature_trend(1248991)

    assert isinstance(response, TemperatureTrendResponse)
    assert response.city_id == 1248991
    assert response.city_name == "Colombo"
    assert len(response.forecast_points) == 8
    
    # Assert sorted ascending by timestamp (unix dt equivalent)
    # The timestamps correspond to:
    # 1629291600 (24.0), 1629302400 (22.4), 1629313200 (20.1), 1629324000 (18.5),
    # 1629334800 (17.2), 1629345600 (16.0), 1629356400 (15.5), 1629367200 (15.0)
    expected_temps = [24.0, 22.4, 20.1, 18.5, 17.2, 16.0, 15.5, 15.0]
    actual_temps = [pt.temperature_c for pt in response.forecast_points]
    assert actual_temps == expected_temps

# 4. Test Cache HIT avoids provider call
@pytest.mark.asyncio
async def test_forecast_cache_hit():
    mock_city_service = MagicMock(spec=CityService)
    mock_city_service.get_city_ids.return_value = [1248991]
    mock_city_service.get_city_name.return_value = "Colombo"

    mock_weather_client = MagicMock(spec=OpenWeatherClient)
    mock_weather_client.get_forecast_weather = AsyncMock()

    mock_redis = MagicMock(spec=RedisCache)
    mock_redis.get_json = AsyncMock(return_value=MOCK_RAW_FORECAST)
    mock_redis.get_ttl = AsyncMock(return_value=450)

    service = WeatherService(
        city_service=mock_city_service,
        weather_client=mock_weather_client,
        redis_cache=mock_redis
    )

    response = await service.get_temperature_trend(1248991)

    # Assert cache HIT
    assert response.cache.status == "HIT"
    assert response.cache.ttl_seconds == 450
    # Ensure provider client was NOT called
    mock_weather_client.get_forecast_weather.assert_not_called()

# 5. Test Cache MISS calls provider and stores in Redis
@pytest.mark.asyncio
async def test_forecast_cache_miss():
    mock_city_service = MagicMock(spec=CityService)
    mock_city_service.get_city_ids.return_value = [1248991]
    mock_city_service.get_city_name.return_value = "Colombo"

    mock_weather_client = MagicMock(spec=OpenWeatherClient)
    mock_weather_client.get_forecast_weather = AsyncMock(return_value=MOCK_RAW_FORECAST)

    mock_redis = MagicMock(spec=RedisCache)
    mock_redis.get_json = AsyncMock(return_value=None)  # MISS
    mock_redis.set_json = MagicMock()  # Use normal mock because it returns None coroutine in async or just normal mock
    # Wait, set_json is async! So AsyncMock is safer
    mock_redis.set_json = AsyncMock()
    mock_redis.get_ttl = AsyncMock(return_value=None)

    service = WeatherService(
        city_service=mock_city_service,
        weather_client=mock_weather_client,
        redis_cache=mock_redis
    )

    response = await service.get_temperature_trend(1248991)

    # Assert cache MISS
    assert response.cache.status == "MISS"
    # Ensure provider client was called
    mock_weather_client.get_forecast_weather.assert_called_once_with(1248991)
    # Ensure raw result was cached in Redis with ex=900 (15 min)
    mock_redis.set_json.assert_called_once_with(
        "weather:forecast:1248991", MOCK_RAW_FORECAST, ttl_seconds=900
    )

# 6. Test provider failure returns HTTP 502 Bad Gateway
@pytest.mark.asyncio
async def test_forecast_provider_failure():
    mock_city_service = MagicMock(spec=CityService)
    mock_city_service.get_city_ids.return_value = [1248991]
    mock_city_service.get_city_name.return_value = "Colombo"

    mock_weather_client = MagicMock(spec=OpenWeatherClient)
    mock_weather_client.get_forecast_weather = AsyncMock(
        side_effect=OpenWeatherProviderError("Connection error", status_code=500)
    )

    service = WeatherService(city_service=mock_city_service, weather_client=mock_weather_client)

    with pytest.raises(HTTPException) as exc_info:
        await service.get_temperature_trend(1248991)

    assert exc_info.value.status_code == 502
    assert "Weather provider error" in exc_info.value.detail
