# WeatherComfort Analytics — Caching Flow

This document explains how the caching system works in this project from top to bottom.
It is written for beginners — every code block is explained line by line.

---

## Why Do We Cache?

Every time the dashboard loads, we need weather data for 10+ cities.
If we fetched fresh data from OpenWeatherMap on every single request:
- The page would be **slow** (one HTTP call per city).
- We could **hit OpenWeatherMap's rate limit** quickly.
- The **same data** would be fetched repeatedly within seconds.

**Caching** solves this by saving the result in Redis (a fast in-memory database)
and reusing it for a set amount of time instead of refetching.

---

## The Three Cache Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                          Redis Server                            │
│                                                                  │
│  Key: weather:raw:{city_id}         TTL: 300 seconds (5 min)     │
│  Key: weather:processed:all         TTL:  60 seconds (1 min)     │
│  Key: weather:forecast:{city_id}    TTL: 900 seconds (15 min)    │
│                                                                  │
│  Key: stats:raw:hits                (counter — no expiry)        │
│  Key: stats:raw:misses              (counter — no expiry)        │
└──────────────────────────────────────────────────────────────────┘
```

| Layer | Redis Key | Expires After | What is Stored |
|---|---|---|---|
| Raw Weather | `weather:raw:{city_id}` | 5 minutes | Raw JSON from OpenWeatherMap per city |
| Processed Rankings | `weather:processed:all` | 1 minute | Fully ranked dashboard result |
| Forecast Trend | `weather:forecast:{city_id}` | 15 minutes | 5-day forecast JSON per city |

---

## Layer 0 — The Cache Wrapper Class

**File:** `backend/app/cache/redis_cache.py`

This is the **only file that talks to Redis directly**. All other files go through this class.
Think of it as the "gatekeeper" between our app and Redis.

```python
class RedisCache:
    def __init__(self) -> None:
        self._redis: Optional[Redis] = None
        # _redis starts as None — we do NOT connect to Redis on startup.
        # We wait until the first actual read/write (called "lazy initialization").
```

```python
    def get_client(self) -> Redis:
        if self._redis is None:
            # First time this is called, create the connection.
            self._redis = from_url(settings.REDIS_URL, decode_responses=True)
        return self._redis
        # Every call after the first one reuses the same connection.
```

### Reading from Redis

```python
    async def get_json(self, key: str) -> Optional[Any]:
        try:
            client = self.get_client()          # Get the Redis connection
            val = await client.get(key)         # Try to get the value at this key
            if val:
                return json.loads(val)          # The value is stored as a string,
                                                # so we convert it back to a dict.
        except Exception as e:
            logger.error("Redis get failed for key %s: %s", key, str(e))
        return None
        # If the key does not exist, or Redis is offline, we return None.
        # Returning None = "cache miss" — go fetch from OpenWeatherMap instead.
```

> **Beginner Tip:** `Optional[Any]` means this function can return a value OR `None`.
> `None` here means "there is nothing stored in cache for this key."

### Writing to Redis

```python
    async def set_json(self, key: str, value: Any, ttl_seconds: int) -> None:
        try:
            client = self.get_client()
            val = json.dumps(value)             # Convert dict → JSON string for storage
            await client.set(key, val, ex=ttl_seconds)
            # ex=ttl_seconds tells Redis to automatically delete this key
            # after that many seconds. This is the TTL (Time To Live).
        except Exception as e:
            logger.error("Redis set failed for key %s: %s", key, str(e))
```

> **Beginner Tip:** `ex` stands for "expire". `ex=300` means "delete this key after 300 seconds."

### Reading the TTL (time left before expiry)

```python
    async def get_ttl(self, key: str) -> Optional[int]:
        try:
            client = self.get_client()
            ttl = await client.ttl(key)         # Ask Redis: how many seconds are left?
            if ttl >= 0:
                return ttl                      # Return the remaining seconds
        except Exception as e:
            logger.error("Redis ttl failed for key %s: %s", key, str(e))
        return None
        # Returns None if the key doesn't exist or has no TTL.
```

### Incrementing a counter

```python
    async def incr(self, key: str) -> Optional[int]:
        try:
            client = self.get_client()
            return await client.incr(key)       # Add 1 to the number stored at this key
        except Exception as e:
            logger.error("Redis incr failed for key %s: %s", key, str(e))
        return None
        # Used to count how many times we hit/missed the raw weather cache.
```

---

## Layer 1 — Raw Weather Cache (5 minutes)

**File:** `backend/app/services/weather_service.py`
**Function:** `get_comfort_weather_ranking()`

This is the **first cache check** inside the comfort ranking flow.
We check Redis for **each city individually** using its numeric OpenWeatherMap ID.

```
Key format: weather:raw:1248991   ← for Colombo (city ID 1248991)
            weather:raw:2643743   ← for London  (city ID 2643743)
```

```python
for city_id in city_ids:
    cached_raw = None

    if self.redis_cache:
        # Try to get the raw weather JSON for this specific city from Redis.
        cached_raw = await self.redis_cache.get_json(f"weather:raw:{city_id}")

    if cached_raw:
        # ✅ CACHE HIT — We already have this city's data, use it directly.
        successful_weather[city_id] = cached_raw
        raw_hits += 1
        await self.redis_cache.incr("stats:raw:hits")  # Add 1 to the hit counter
    else:
        # ❌ CACHE MISS — No cached data, we need to fetch from OpenWeatherMap.
        missed_city_ids.append(city_id)
        raw_misses += 1
        await self.redis_cache.incr("stats:raw:misses")  # Add 1 to the miss counter
```

After checking all cities, we fetch the missed ones from OpenWeatherMap **concurrently**
(all at the same time, not one by one), then save each one to Redis:

```python
# Fetch all missed cities from OpenWeatherMap at the same time
fetched_weather, provider_failures = await self.weather_client.get_multiple_weather(missed_city_ids)

# Save each freshly fetched city into Redis
for city_id, raw in fetched_weather.items():
    successful_weather[city_id] = raw
    await self.redis_cache.set_json(
        f"weather:raw:{city_id}",   # Key: includes the city ID
        raw,                         # Value: the raw dict from OpenWeatherMap
        ttl_seconds=300              # Expires in 5 minutes
    )
```

> **Beginner Tip:** If 10 users load the dashboard at the same time, only the first
> request fetches from OpenWeatherMap. The other 9 get the cached version instantly.

---

## Layer 2 — Processed Rankings Cache (1 minute)

**File:** `backend/app/services/weather_service.py`
**Function:** `get_comfort_weather_ranking()`

This is the **very first check** — it runs before the raw cache loop.
It stores the **entire finished dashboard result** as a single Redis key.

```
Key:  weather:processed:all
      ↑ one key for the whole ranking — not per city
```

### Checking the processed cache (at the top of the function):

```python
async def get_comfort_weather_ranking(self) -> ComfortWeatherResponse:

    if self.redis_cache:
        # Ask Redis: do we already have a finished ranking stored?
        cached_data = await self.redis_cache.get_json("weather:processed:all")

        if cached_data:
            # ✅ CACHE HIT — We have a complete ranking already. No computation needed.

            # Pydantic re-builds the typed response object from the stored JSON
            response = ComfortWeatherResponse.parse_obj(cached_data)

            # Mark the response so the API tells the client it was a cache hit
            response.cache.processed = "HIT"

            return response  # ← returns here, skips everything below
```

> **Beginner Tip:** If this hit, the function returns immediately. We never touch
> raw cache, never call OpenWeatherMap, never calculate scores — all of that is skipped.

### Writing the processed cache (at the bottom of the function):

```python
    # (After raw cache checks, API calls, score calculations, and ranking...)

    if self.redis_cache and len(sorted_cities) > 0:
        await self.redis_cache.set_json(
            "weather:processed:all",   # Single key for everyone
            response.dict(),           # Convert the Pydantic model to a plain dict
            ttl_seconds=60             # Expires in 1 minute
        )
```

### Why only 1 minute for processed, but 5 minutes for raw?

| Layer | TTL | Reason |
|---|---|---|
| Raw weather | 5 min | Raw data rarely changes within 5 minutes. Safe to reuse. |
| Processed ranking | 1 min | Rankings are what users actually see. We refresh them more often so the UI feels up-to-date. |

---

## Layer 3 — Forecast Cache (15 minutes)

**File:** `backend/app/services/weather_service.py`
**Function:** `get_temperature_trend(city_id)`

This cache layer is **completely separate** from layers 1 and 2.
It only activates when a user clicks "View Temperature Trend" on a city card.

```
Key format: weather:forecast:1248991   ← forecast for Colombo
            weather:forecast:2643743   ← forecast for London
```

```python
async def get_temperature_trend(self, city_id: int) -> TemperatureTrendResponse:

    # First, confirm the city_id is in our approved list (security check)
    if city_id not in self.city_service.get_city_ids():
        raise HTTPException(status_code=400, detail="City ID not in approved registry")

    cache_key = f"weather:forecast:{city_id}"
    cached_forecast = None
    cache_status = "MISS"      # Assume miss until proven otherwise

    if self.redis_cache:
        # Check if we already have forecast data for this city
        cached_forecast = await self.redis_cache.get_json(cache_key)

        if cached_forecast:
            cache_status = "HIT"
            # Also read how many seconds are left until it expires
            ttl_seconds = await self.redis_cache.get_ttl(cache_key)
```

If there is no cache entry, we fetch from OpenWeatherMap and save it:

```python
    if not cached_forecast:
        # ❌ MISS — Fetch 5-day / 3-hour forecast from OpenWeatherMap
        cached_forecast = await self.weather_client.get_forecast_weather(city_id)

        if self.redis_cache:
            # Save the raw forecast JSON for 15 minutes
            await self.redis_cache.set_json(cache_key, cached_forecast, ttl_seconds=900)
            ttl_seconds = 900
```

Then we process the data to extract just the next 24 hours (8 points):

```python
    forecast_list = cached_forecast.get("list", [])

    # Sort by timestamp (dt = Unix timestamp, a number representing date+time)
    sorted_points = sorted(forecast_list, key=lambda x: x.get("dt", 0))

    # Take only the first 8 entries (8 × 3 hours = 24 hours)
    selected_points = sorted_points[:8]

    forecast_points = []
    for pt in selected_points:
        dt_unix = pt.get("dt")                              # Unix timestamp number
        temp_c = float(pt.get("main", {}).get("temp", 0.0))# Temperature in Celsius

        # Convert the Unix number into a human-readable UTC timestamp string
        # e.g.  1724832000  →  "2026-08-28T12:00:00Z"
        dt_utc = datetime.fromtimestamp(dt_unix, tz=timezone.utc)
        timestamp_utc = dt_utc.isoformat().replace("+00:00", "Z")

        forecast_points.append(ForecastPoint(
            timestamp_utc=timestamp_utc,
            temperature_c=temp_c
        ))
```

The response includes the cache metadata so the UI can display it:

```python
    return TemperatureTrendResponse(
        city_id=city_id,
        city_name=city_name,
        forecast_points=forecast_points,
        cache=TrendCacheInfo(
            status=cache_status,        # "HIT" or "MISS"
            ttl_seconds=ttl_seconds     # e.g. 743 (seconds remaining)
        )
    )
```

> **Beginner Tip:** Forecast data changes slowly. 15 minutes is safe to cache because
> a 3-hour forecast point does not meaningfully change in 15 minutes.

---

## Cache Status Endpoint

**File:** `backend/app/api/cache.py`
**Endpoint:** `GET /api/v1/cache/status`

This endpoint lets the dashboard display live cache statistics.
It reads from Redis but **does not write anything**.

```python
@router.get("/cache/status", response_model=CacheStatusResponse)
async def get_cache_status(
    redis_cache: RedisCache = Depends(get_redis_cache),   # Inject the cache wrapper
    _token: TokenPayload = Depends(verify_token)           # Require Auth0 login
) -> CacheStatusResponse:

    # Read the TTL of the processed cache key
    ttl = await redis_cache.get_ttl("weather:processed:all")

    # If a TTL exists, the key is alive → HIT. If None, it expired/never set → MISS.
    status = "HIT" if ttl is not None else "MISS"

    # Read the cumulative hit and miss counters (these never expire)
    hits   = await redis_cache.get_counter("stats:raw:hits")
    misses = await redis_cache.get_counter("stats:raw:misses")

    return CacheStatusResponse(
        processed_cache=ProcessedCacheStatus(
            key="weather:processed:all",
            status=status,           # "HIT" or "MISS"
            ttl_seconds=ttl          # Seconds until next refresh, or None
        ),
        raw_cache_summary=RawCacheSummary(
            hits=hits,               # Total cities served from cache since startup
            misses=misses            # Total cities fetched from OpenWeatherMap
        )
    )
```

> **Beginner Tip:** `hits + misses` = total individual city lookups since the server started.
> A healthy running server should have many more hits than misses.

---

## Full Decision Tree

```
Browser requests dashboard
         │
         ▼
FastAPI GET /api/v1/weather/comfort
         │
         ▼
  Check weather:processed:all in Redis
         │
  ┌──────┴──────────────────────┐
  │ HIT                         │ MISS
  │                             │
Return instantly ✅              Check weather:raw:{city_id} for each city
(~1ms, skip everything)                     │
                              ┌─────────────┴─────────────┐
                              │ HIT (per city)             │ MISS (per city)
                              │                            │
                        Reuse cached JSON ✅         Fetch from OpenWeatherMap
                        incr stats:raw:hits          Save to weather:raw:{city_id}
                                                     TTL = 300s
                                                     incr stats:raw:misses
                              │
                              ▼
                     Calculate Comfort Index
                     Sort + Rank all cities
                              │
                              ▼
                  Save to weather:processed:all
                  TTL = 60s
                              │
                              ▼
                     Return ranked response
                     (cache.processed = "MISS")

─────────────────────────────────────────────

Browser clicks "View Temperature Trend"
         │
         ▼
FastAPI GET /api/v1/weather/cities/{city_id}/temperature-trend
         │
         ▼
  Validate city_id is in the approved allowlist
         │
         ▼
  Check weather:forecast:{city_id} in Redis
         │
  ┌──────┴──────────────────────┐
  │ HIT                         │ MISS
  │                             │
Read TTL remaining            Fetch /forecast from OpenWeatherMap
Return cached data ✅         Save to weather:forecast:{city_id}
(cache.status = "HIT")        TTL = 900s
                              Return data
                              (cache.status = "MISS")
```

---

## Key Takeaways

1. **Redis stores everything as strings.** Our code serializes Python dicts to JSON strings before saving, and parses them back on reads.
2. **Every Redis error is caught silently.** If Redis goes down, the app falls back to direct OpenWeatherMap calls — it does not crash.
3. **Layers are independent.** Forecast cache and ranking cache do not affect each other.
4. **TTL is set at write time.** Redis automatically deletes the key after the TTL; we never delete keys manually.
5. **Processed cache is checked first.** If it hits, raw cache is never checked and OpenWeatherMap is never called.

### manually delete the key from Redis:

docker exec weather-comfort-redis redis-cli del weather:processed:all
