from fastapi.testclient import TestClient

def test_health_endpoint(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "weather-comfort-api"

def test_comfort_weather_endpoint(client: TestClient):
    response = client.get("/api/v1/weather/comfort")
    assert response.status_code == 200
    data = response.json()
    
    # Verify root fields
    assert "generated_at" in data
    assert data["formula_version"] == "v1"
    assert data["city_count"] >= 0
    assert data["failed_city_count"] >= 0
    assert "cache" in data
    assert "cities" in data
    
    # Verify cache summary structure
    cache_info = data["cache"]
    assert "processed" in cache_info
    assert "raw_hits" in cache_info
    assert "raw_misses" in cache_info
    
    # Verify city structures if any exists
    if len(data["cities"]) > 0:
        city = data["cities"][0]
        assert "city_id" in city
        assert "city_name" in city
        assert "country" in city
        assert "rank" in city
        assert "comfort_score" in city
        assert "weather" in city
        assert "score_breakdown" in city
        
        weather = city["weather"]
        assert "description" in weather
        assert "temperature_c" in weather
        assert "humidity" in weather
        assert "pressure_hpa" in weather
        assert "wind_speed_mps" in weather
        assert "cloudiness_percent" in weather
        assert "visibility_km" in weather
        
        breakdown = city["score_breakdown"]
        assert "temperature" in breakdown
        assert "humidity" in breakdown
        assert "wind" in breakdown
        assert "cloudiness" in breakdown

def test_cache_status_endpoint(client: TestClient):
    response = client.get("/api/v1/cache/status")
    assert response.status_code == 200
    data = response.json()
    
    # Verify keys
    assert "processed_cache" in data
    assert "raw_cache_summary" in data
    
    processed = data["processed_cache"]
    assert processed["key"] == "weather:processed:all"
    assert "status" in processed
    
    raw = data["raw_cache_summary"]
    assert "hits" in raw
    assert "misses" in raw

def test_endpoints_require_authentication_without_override():
    # Fresh TestClient without dependency overrides to verify 401 Unauthorized
    from app.main import app
    from fastapi.testclient import TestClient
    
    with TestClient(app) as unauth_client:
        # GET /health is public
        res_health = unauth_client.get("/health")
        assert res_health.status_code == 200
        
        # GET /api/v1/weather/comfort is private
        res_comfort = unauth_client.get("/api/v1/weather/comfort")
        assert res_comfort.status_code == 401
        assert res_comfort.json()["detail"] == "Invalid authentication credentials"
        
        # GET /api/v1/cache/status is private
        res_cache = unauth_client.get("/api/v1/cache/status")
        assert res_cache.status_code == 401
        assert res_cache.json()["detail"] == "Invalid authentication credentials"
