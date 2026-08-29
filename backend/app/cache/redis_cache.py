import json
import logging
from typing import Any, Optional
from redis.asyncio import Redis, from_url
from app.config import settings

logger = logging.getLogger("weather-comfort")

class RedisCache:
    def __init__(self) -> None:
        self._redis: Optional[Redis] = None

    def get_client(self) -> Redis:
        """
        Initializes and returns the asynchronous Redis client using settings.REDIS_URL.
        """
        if self._redis is None:
            self._redis = from_url(settings.REDIS_URL, decode_responses=True)
        return self._redis

    async def close(self) -> None:
        """
        Closes the Redis connection pool.
        """
        if self._redis is not None:
            await self._redis.aclose()
            self._redis = None
            logger.info("Closed Redis connection pool.")

    async def get_json(self, key: str) -> Optional[Any]:
        """
        Fetches string from Redis and parses it as JSON. Returns None on cache miss or error.
        """
        try:
            client = self.get_client()
            val = await client.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.error("Redis get failed for key %s: %s", key, str(e))
        return None

    async def set_json(self, key: str, value: Any, ttl_seconds: int) -> None:
        """
        Serializes value to JSON and stores it in Redis with specified TTL.
        """
        try:
            client = self.get_client()
            val = json.dumps(value)
            await client.set(key, val, ex=ttl_seconds)
        except Exception as e:
            logger.error("Redis set failed for key %s: %s", key, str(e))

    async def get_ttl(self, key: str) -> Optional[int]:
        """
        Retrieves the remaining time to live (TTL) of a key in seconds.
        Returns None if key has no TTL, does not exist, or on error.
        """
        try:
            client = self.get_client()
            ttl = await client.ttl(key)
            if ttl >= 0:
                return ttl
        except Exception as e:
            logger.error("Redis ttl failed for key %s: %s", key, str(e))
        return None

    async def delete(self, key: str) -> None:
        """
        Removes a key from Redis.
        """
        try:
            client = self.get_client()
            await client.delete(key)
        except Exception as e:
            logger.error("Redis delete failed for key %s: %s", key, str(e))

    async def incr(self, key: str) -> Optional[int]:
        """
        Increments a numeric counter in Redis.
        """
        try:
            client = self.get_client()
            return await client.incr(key)
        except Exception as e:
            logger.error("Redis incr failed for key %s: %s", key, str(e))
        return None

    async def get_counter(self, key: str) -> int:
        """
        Retrieves a numeric counter from Redis. Returns 0 if key does not exist or on error.
        """
        try:
            client = self.get_client()
            val = await client.get(key)
            if val is not None:
                return int(val)
        except Exception as e:
            logger.error("Redis get_counter failed for key %s: %s", key, str(e))
        return 0
