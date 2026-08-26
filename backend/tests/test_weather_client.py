import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock
from app.clients.openweather_client import OpenWeatherClient, OpenWeatherProviderError, OpenWeatherClientError

@pytest.mark.asyncio
async def test_get_current_weather_success():
    # Mock httpx.Response
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {"name": "Colombo", "main": {"temp": 30.0}}
    
    # Mock httpx.AsyncClient
    mock_http_client = MagicMock(spec=httpx.AsyncClient)
    mock_http_client.get = AsyncMock(return_value=mock_response)
    
    # Instantiate client and call method
    client = OpenWeatherClient(client=mock_http_client)
    result = await client.get_current_weather(city_id=1248991)
    
    assert result["name"] == "Colombo"
    assert result["main"]["temp"] == 30.0
    mock_http_client.get.assert_called_once()
    mock_response.raise_for_status.assert_called_once()

@pytest.mark.asyncio
async def test_get_current_weather_http_error():
    # Mock httpx response that raises HTTPStatusError
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 404
    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
        message="Not Found",
        request=MagicMock(spec=httpx.Request),
        response=mock_response
    )
    
    mock_http_client = MagicMock(spec=httpx.AsyncClient)
    mock_http_client.get = AsyncMock(return_value=mock_response)
    
    client = OpenWeatherClient(client=mock_http_client)
    with pytest.raises(OpenWeatherProviderError) as exc_info:
        await client.get_current_weather(city_id=999)
        
    assert exc_info.value.status_code == 404
    assert "status 404" in str(exc_info.value)

@pytest.mark.asyncio
async def test_get_current_weather_network_error():
    # Mock httpx client throwing timeout exception
    mock_http_client = MagicMock(spec=httpx.AsyncClient)
    mock_http_client.get.side_effect = httpx.TimeoutException("Timeout")
    
    client = OpenWeatherClient(client=mock_http_client)
    with pytest.raises(OpenWeatherProviderError) as exc_info:
        await client.get_current_weather(city_id=1248991)
        
    assert "Failed to connect to weather provider" in str(exc_info.value)

@pytest.mark.asyncio
async def test_get_multiple_weather_concurrency_and_partial_failures():
    # Mock responses: 2 successes, 1 failure
    mock_response_1 = MagicMock(spec=httpx.Response)
    mock_response_1.status_code = 200
    mock_response_1.json.return_value = {"name": "Colombo"}
    
    mock_response_2 = MagicMock(spec=httpx.Response)
    mock_response_2.status_code = 200
    mock_response_2.json.return_value = {"name": "Tokyo"}
    
    # HTTP error Response for the 3rd city
    mock_response_3 = MagicMock(spec=httpx.Response)
    mock_response_3.status_code = 500
    mock_response_3.raise_for_status.side_effect = httpx.HTTPStatusError(
        message="Internal Server Error",
        request=MagicMock(spec=httpx.Request),
        response=mock_response_3
    )

    mock_http_client = MagicMock(spec=httpx.AsyncClient)
    mock_http_client.get.side_effect = [mock_response_1, mock_response_2, mock_response_3]
    
    client = OpenWeatherClient(client=mock_http_client)
    city_ids = [1248991, 1850147, 999]
    
    results, failed_count = await client.get_multiple_weather(city_ids)
    
    # 2 succeeded, 1 failed
    assert len(results) == 2
    assert failed_count == 1
    assert results[1248991]["name"] == "Colombo"
    assert results[1850147]["name"] == "Tokyo"
    assert 999 not in results
