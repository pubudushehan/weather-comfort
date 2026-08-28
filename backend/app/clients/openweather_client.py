import asyncio
import httpx
import logging
from typing import List, Dict, Tuple, Optional
from app.config import settings

logger = logging.getLogger("weather-comfort")

class OpenWeatherClientError(Exception):
    """Base exception for the OpenWeatherMap client."""
    pass

class OpenWeatherProviderError(OpenWeatherClientError):
    """Raised when the provider API returns a non-2xx status code or connection fails."""
    def __init__(self, message: str, status_code: Optional[int] = None) -> None:
        super().__init__(message)
        self.status_code = status_code

class OpenWeatherClient:
    def __init__(self, client: Optional[httpx.AsyncClient] = None) -> None:
        self._client = client

    async def get_current_weather(self, city_id: int) -> dict:
        """
        Fetch current weather for a single city from OpenWeatherMap.
        Converts provider HTTP and connection errors into OpenWeatherProviderError exceptions.
        """
        base_url = settings.OPENWEATHER_BASE_URL
        api_key = settings.OPENWEATHER_API_KEY
        timeout = settings.OPENWEATHER_TIMEOUT_SECONDS

        params = {
            "id": city_id,
            "appid": api_key,
            "units": "metric"
        }

        # Do NOT log params or URLs with appid to prevent security/credential leakage
        logger.debug("Fetching weather for city_id: %d from OpenWeatherMap", city_id)

        if self._client is not None:
            try:
                response = await self._client.get(
                    f"{base_url}/weather",
                    params=params,
                    timeout=timeout
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code
                logger.error("OpenWeatherMap returned HTTP status %d for city %d", status_code, city_id)
                raise OpenWeatherProviderError(
                    f"Weather provider returned status {status_code} for city {city_id}",
                    status_code=status_code
                ) from e
            except (httpx.RequestError, httpx.TimeoutException) as e:
                logger.error("Connection or timeout failure querying OpenWeatherMap for city %d: %s", city_id, str(e))
                raise OpenWeatherProviderError(
                    f"Failed to connect to weather provider for city {city_id}: {str(e)}"
                ) from e
        else:
            try:
                async with httpx.AsyncClient() as async_client:
                    response = await async_client.get(
                        f"{base_url}/weather",
                        params=params,
                        timeout=timeout
                    )
                    response.raise_for_status()
                    return response.json()
            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code
                logger.error("OpenWeatherMap returned HTTP status %d for city %d", status_code, city_id)
                raise OpenWeatherProviderError(
                    f"Weather provider returned status {status_code} for city {city_id}",
                    status_code=status_code
                ) from e
            except (httpx.RequestError, httpx.TimeoutException) as e:
                logger.error("Connection or timeout failure querying OpenWeatherMap for city %d: %s", city_id, str(e))
                raise OpenWeatherProviderError(
                    f"Failed to connect to weather provider for city {city_id}: {str(e)}"
                ) from e

    async def get_multiple_weather(self, city_ids: List[int]) -> Tuple[Dict[int, dict], int]:
        """
        Fetch current weather for multiple cities concurrently with a concurrency limit.
        Returns a tuple: (successful_results, failed_city_count)
        where successful_results is a dict mapping city_id -> weather response dict.
        """
        semaphore = asyncio.Semaphore(5)  # Suggested limit of 5
        successful_results: Dict[int, dict] = {}
        failed_count = 0

        async def sem_fetch(city_id: int) -> Optional[Tuple[int, dict]]:
            nonlocal failed_count
            async with semaphore:
                try:
                    data = await self.get_current_weather(city_id)
                    return (city_id, data)
                except OpenWeatherClientError as e:
                    logger.warning("Failed to fetch weather for city %d: %s", city_id, str(e))
                    failed_count += 1
                    return None

        tasks = [sem_fetch(cid) for cid in city_ids]
        results = await asyncio.gather(*tasks)

        for res in results:
            if res is not None:
                cid, data = res
                successful_results[cid] = data

        return successful_results, failed_count

    async def get_forecast_weather(self, city_id: int) -> dict:
        """
        Fetch 5-day / 3-hour forecast for a single city from OpenWeatherMap.
        """
        base_url = settings.OPENWEATHER_BASE_URL
        api_key = settings.OPENWEATHER_API_KEY
        timeout = settings.OPENWEATHER_TIMEOUT_SECONDS

        params = {
            "id": city_id,
            "appid": api_key,
            "units": "metric"
        }

        logger.debug("Fetching forecast for city_id: %d from OpenWeatherMap", city_id)

        if self._client is not None:
            try:
                response = await self._client.get(
                    f"{base_url}/forecast",
                    params=params,
                    timeout=timeout
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code
                logger.error("OpenWeatherMap returned HTTP status %d for forecast of city %d", status_code, city_id)
                raise OpenWeatherProviderError(
                    f"Weather provider returned status {status_code} for city {city_id}",
                    status_code=status_code
                ) from e
            except (httpx.RequestError, httpx.TimeoutException) as e:
                logger.error("Connection or timeout failure querying OpenWeatherMap forecast for city %d: %s", city_id, str(e))
                raise OpenWeatherProviderError(
                    f"Failed to connect to weather provider for city {city_id}: {str(e)}"
                ) from e
        else:
            try:
                async with httpx.AsyncClient() as async_client:
                    response = await async_client.get(
                        f"{base_url}/forecast",
                        params=params,
                        timeout=timeout
                    )
                    response.raise_for_status()
                    return response.json()
            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code
                logger.error("OpenWeatherMap returned HTTP status %d for forecast of city %d", status_code, city_id)
                raise OpenWeatherProviderError(
                    f"Weather provider returned status {status_code} for city {city_id}",
                    status_code=status_code
                ) from e
            except (httpx.RequestError, httpx.TimeoutException) as e:
                logger.error("Connection or timeout failure querying OpenWeatherMap forecast for city %d: %s", city_id, str(e))
                raise OpenWeatherProviderError(
                    f"Failed to connect to weather provider for city {city_id}: {str(e)}"
                ) from e
