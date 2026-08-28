## Project Verification Checklist

- [x] Next.js frontend starts on port 3000.
- [x] FastAPI backend starts on port 8000.
- [x] Redis starts on port 6379.
- [x] GET `/health` responds with HTTP 200.
- [x] Auth0 login and redirects work.
- [x] Dashboard route `/dashboard` is protected.
- [x] Predefined cities are loaded and comfort scores are calculated.
- [x] Cities are sorted and ranked in descending order.
- [x] Server-side caching (raw, processed, and forecast layers) is functional.
- [x] Cache debug endpoint `/api/v1/cache/status` is accurate for processed cache and raw hit/miss counters.
- [x] Light and dark modes toggle and persist.
- [x] Pytest suite passes successfully (39/39 passed).
- [x] Temperature trend forecast graphs show next 24 hours (8 points) with 15-minute forecast cache (`weather:forecast:{city_id}`).
- [x] Docker Compose launches the full stack cleanly.
- [x] No secrets or API keys are committed.