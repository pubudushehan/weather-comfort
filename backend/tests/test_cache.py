import pytest
from unittest.mock import MagicMock, AsyncMock
from app.cache.redis_cache import RedisCache
from app.services.weather_service import WeatherService
from app.services.city_service import CityService
from app.clients.openweather_client import OpenWeatherClient

@pytest.mark.asyncio
async def test_redis_cache_wrapper_methods():
    # Test RedisCache wrapper with mock Redis client
    cache = RedisCache()
    mock_redis = AsyncMock()
    cache._redis = mock_redis
    
    # Test set_json
    await cache.set_json("test_key", {"foo": "bar"}, ttl_seconds=10)
    mock_redis.set.assert_called_once_with("test_key", '{"foo": "bar"}', ex=10)
    
    # Test get_json
    mock_redis.get.return_value = '{"foo": "bar"}'
    res = await cache.get_json("test_key")
    assert res == {"foo": "bar"}
    mock_redis.get.assert_called_once_with("test_key")
    
    # Test get_ttl
    mock_redis.ttl.return_value = 5
    ttl = await cache.get_ttl("test_key")
    assert ttl == 5
    
    # Test delete
    await cache.delete("test_key")
    mock_redis.delete.assert_called_once_with("test_key")
    
    # Test incr
    mock_redis.incr.return_value = 2
    count = await cache.incr("test_key")
    assert count == 2
    
    # Test get_counter
    mock_redis.get.return_value = "2"
    val = await cache.get_counter("test_key")
    assert val == 2

@pytest.mark.asyncio
async def test_redis_cache_wrapper_error_handling():
    cache = RedisCache()
    mock_redis = AsyncMock()
    mock_redis.get.side_effect = Exception("Connection refused")
    mock_redis.set.side_effect = Exception("Connection refused")
    mock_redis.ttl.side_effect = Exception("Connection refused")
    mock_redis.incr.side_effect = Exception("Connection refused")
    cache._redis = mock_redis
    
    # Verify wrapper methods do not crash and handle errors gracefully
    assert await cache.get_json("key") is None
    await cache.set_json("key", {}, 10)
    assert await cache.get_ttl("key") is None
    assert await cache.incr("key") is None
    assert await cache.get_counter("key") == 0

@pytest.mark.asyncio
async def test_weather_service_uses_processed_cache_hit():
    mock_city_service = MagicMock(spec=CityService)
    mock_weather_client = MagicMock(spec=OpenWeatherClient)
    mock_cache = AsyncMock(spec=RedisCache)
    
    cached_response = {
        "generated_at": "2026-08-27T00:00:00Z",
        "formula_version": "v1",
        "city_count": 1,
        "failed_city_count": 0,
        "cache": {
            "processed": "MISS",
            "raw_hits": 0,
            "raw_misses": 1
        },
        "cities": []
    }
    mock_cache.get_json.return_value = cached_response
    
    service = WeatherService(
        city_service=mock_city_service,
        weather_client=mock_weather_client,
        redis_cache=mock_cache
    )
    
    response = await service.get_comfort_weather_ranking()
    assert response.cache.processed == "HIT"
    mock_cache.get_json.assert_called_once_with("weather:processed:all")
    mock_weather_client.get_multiple_weather.assert_not_called()

@pytest.mark.asyncio
async def test_weather_service_processed_cache_miss_raw_cache_hits():
    mock_city_service = MagicMock(spec=CityService)
    mock_city_service.get_city_ids.return_value = [1248991, 1850147]
    mock_weather_client = MagicMock(spec=OpenWeatherClient)
    mock_cache = AsyncMock(spec=RedisCache)
    
    # Processed cache is MISS, Colombo is raw HIT, Tokyo is raw MISS
    mock_cache.get_json.side_effect = lambda key: {
        "weather:processed:all": None,
        "weather:raw:1248991": {
            "name": "Colombo",
            "sys": {"country": "LK"},
            "weather": [{"description": "light rain"}],
            "main": {"temp": 22.0, "humidity": 50, "pressure": 1010},
            "wind": {"speed": 2.0},
            "clouds": {"all": 20},
            "visibility": 8000
        },
        "weather:raw:1850147": None
    }.get(key)
    
    raw_tokyo = {
        "name": "Tokyo",
        "sys": {"country": "JP"},
        "weather": [{"description": "clear sky"}],
        "main": {"temp": 22.0, "humidity": 50, "pressure": 1012},
        "wind": {"speed": 2.0},
        "clouds": {"all": 20},
        "visibility": 10000
    }
    mock_weather_client.get_multiple_weather.return_value = ({1850147: raw_tokyo}, 0)
    
    service = WeatherService(
        city_service=mock_city_service,
        weather_client=mock_weather_client,
        redis_cache=mock_cache
    )
    
    response = await service.get_comfort_weather_ranking()
    
    assert response.cache.processed == "MISS"
    assert response.cache.raw_hits == 1
    assert response.cache.raw_misses == 1
    assert response.city_count == 2
    
    # Verify new raw data and processed results are cached
    mock_cache.set_json.assert_any_call("weather:raw:1850147", raw_tokyo, ttl_seconds=300)
    mock_cache.set_json.assert_any_call("weather:processed:all", response.dict(), ttl_seconds=60)
