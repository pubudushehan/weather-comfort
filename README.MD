# WeatherComfort Analytics

WeatherComfort Analytics is a secure, full-stack weather analytics application that retrieves real-time weather data for a predefined list of global cities, computes an outdoor comfort rating using a custom backend-owned formula, and displays them ranked in a responsive dashboard. The system features three-layer Redis server-side caching (raw weather, processed rankings, and forecast trends), secure user authentication through Auth0, and containerized deployment support.

<!-- Add screenshots or demo links here before submission -->

## Table of Contents
1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Request Flow](#request-flow)
6. [Codebase Structure](#codebase-structure)
7. [Prerequisites](#prerequisites)
8. [Environment Variables](#environment-variables)
9. [OpenWeatherMap Setup](#openweathermap-setup)
10. [Auth0 Setup](#auth0-setup)
11. [Local Installation](#local-installation)
12. [Run Locally Without Docker](#run-locally-without-docker)
13. [Run with Docker Compose](#run-with-docker-compose)
14. [API Documentation](#api-documentation)
15. [Comfort Index Formula](#comfort-index-formula)
16. [Formula Rationale](#formula-rationale)
17. [Caching Design](#caching-design)
18. [Authentication and Authorization Design](#authentication-and-authorization-design)
19. [Frontend UX](#frontend-ux)
20. [Testing](#testing)
21. [Linting, Type Checking, and Build](#linting-type-checking-and-build)
22. [Security](#security)
23. [Trade-offs and Design Decisions](#trade-offs-and-design-decisions)
24. [Known Limitations](#known-limitations)
25. [Future Improvements](#future-improvements)
26. [Project Verification](#project-verification)

---

## Overview
WeatherComfort Analytics aims to help users find the most comfortable outdoor environments instantly. It queries weather conditions (temperature, humidity, wind, and clouds) for a static allowlist of cities, processes them into a normalized Comfort Index Score (from 0 to 100), and ranks them in descending order. 

To maintain strict security boundaries and application integrity, all math calculations and sorting are performed exclusively by the backend. The frontend is a presentation layer that displays these rankings securely once the user is authenticated via Auth0.

---

## Core Features
* **Predefined City Registry**: City identifiers are loaded securely on the backend from [cities.json](file:///Users/pubudushehan/Desktop/Programming/weather-comfort/backend/app/data/cities.json) containing at least 10 valid city codes.
* **Backend Comfort Calculations**: Current weather data is retrieved from OpenWeatherMap, and normalized component ratings are computed on the server.
* **Three-Layer Redis Caching**: Minimizes OpenWeatherMap calls and dashboard latency using separate cache layers:
  - **Raw current weather** - 300 seconds (5 minutes).
  - **Processed comfort rankings** - 60 seconds (1 minute).
  - **Forecast / temperature trend** - 900 seconds (15 minutes).
* **Cache Telemetry**: Dashboard cache stats via `/api/v1/cache/status` (processed TTL + raw hit/miss counters). Per-request cache HIT/MISS and TTL are also returned in comfort and temperature-trend API responses and shown in the UI.
* **Identity Management & MFA**: Integration with Auth0 to support user logins, sign-outs, and multi-factor authentication (MFA).
* **Responsive Dashboard**: Fully adaptive user interface supporting mobile and desktop views, unified theme selections (light/dark modes), and persistent UI preferences.
* **Robust Docker Support**: A containerized local environment configured via Docker Compose to spin up Redis, the FastAPI backend, and the Next.js frontend with a single command.
* **Comfort Index Unit Tests**: Pytest suite focused on the Comfort Index formula - component scorers, weighted totals, boundary values, clamping, and rounding (39 tests).

---

## Technology Stack

| Layer | Technology | Version / Details | Purpose |
|---|---|---|---|
| **Frontend** | Next.js (App Router) | `16.3.3` | React Application Framework |
| **Frontend Language** | TypeScript | `^5` | Strict static typing and code reliability |
| **Styling** | Tailwind CSS | `^4` (with custom selector support) | Responsive CSS layout and theme styles |
| **UI Components** | Lucide React | `^1.34.0` | High-quality icons |
| **State & Fetching** | TanStack Query | `^5.102.6` | Client side queries, caching, loading, & refreshes |
| **Auth Client** | Next.js Auth0 SDK | `@auth0/nextjs-auth0` | OAuth2 sessions and token retreival |
| **Backend** | FastAPI | `^0.141` | High-performance asynchronous Python API |
| **Backend Language** | Python | `3.12+` / Type annotated | API routes and business services |
| **Validation** | Pydantic v2 | `pydantic-settings`, `pydantic` | Request and response schema validations |
| **HTTP Client** | HTTPX | Async client | Non-blocking external queries |
| **Cache Server** | Redis | `7-alpine` (via `redis-py`) | Server-side cache storage |
| **Backend Testing** | Pytest | `pytest-asyncio`, `pytest` | Unit testing |
| **Containerization** | Docker / Compose | Multi-container stack | Consistent local runtime environment |

---

## Architecture

![Architecture Diagram](docs/Architecture%20Diagram.png)

_Architecture diagram: browser → frontend → Auth0 → backend → Redis → OpenWeatherMap_
---

## Request Flow

1. **Visit Dashboard**: The user opens `/dashboard` in the browser. Next.js middleware checks the user session. Unauthenticated users are redirected to Auth0.
2. **Access Token Retrieval**: Next.js retrieves a signed JWT access token for the `https://weather-comfort-api` audience.
3. **FastAPI Request**: The frontend makes a request to `GET /api/v1/weather/comfort` passing the JWT in the `Authorization` header.
4. **Token Verification**: FastAPI intercepts the request, retrieves signing keys from the Auth0 JWKS endpoint, validates the signature, check expiry, audience, and issuer.
5. **Processed Cache Check**: The backend queries Redis for `weather:processed:all`. If it exists, the cached city rankings are returned instantly (Cache HIT).
6. **Raw Cache Check**: If a processed cache miss occurs, the backend reads city codes from `cities.json` and queries Redis for `weather:raw:{city_id}`.
7. **Weather API Fetch**: For any city with a raw cache MISS, the backend fetches fresh weather data from OpenWeatherMap and caches the raw response for 300 seconds.
8. **Index Computation**: The backend normalizes weather attributes, calculates component comfort scores and weighted averages, and rounds outputs to 2 decimal places.
9. **Ranking and Sorting**: Cities are sorted by Comfort Score descending, assigned ranks, and the result is cached in Redis for 60 seconds.
10. **Render**: The backend returns a typed response, and the frontend displays the cards in the browser.

### Temperature Trend Request Flow

1. **Open Trend Modal**: The user clicks "View temperature trend" on a city card or table row.
2. **Forecast Request**: The frontend calls `GET /api/v1/weather/cities/{city_id}/temperature-trend` with a JWT.
3. **Forecast Cache Check**: The backend queries Redis for `weather:forecast:{city_id}`.
4. **OpenWeatherMap Forecast Fetch**: On cache MISS, the backend fetches the 5-day / 3-hour forecast from OpenWeatherMap and caches it for 900 seconds (15 minutes).
5. **Normalize & Return**: The backend returns the next 8 forecast points (24 hours) plus per-response cache metadata (`HIT`/`MISS`, TTL).
6. **Render Chart**: The trend modal displays the line chart and cache status badge.

---

## Codebase Structure

```text
weather-comfort/
├── docker-compose.yml           # Multi-container orchestration
├── README.md                     # Documentation overview
│
├── backend/                      # FastAPI Application
│   ├── app/
│   │   ├── api/                 # Endpoint routers (health, weather, cache)
│   │   ├── cache/               # Redis connection and caching wrapper
│   │   ├── clients/             # OpenWeatherMap async API client
│   │   ├── data/                # Predefined cities list (cities.json)
│   │   ├── models/              # Pydantic schemas (auth, weather, responses)
│   │   ├── services/            # Comfort logic and weather parsing services
│   │   ├── utils/               # JWT validators and datetime utils
│   │   ├── config.py            # Pydantic Settings configuration loader
│   │   ├── logging_config.py    # Log configurations
│   │   └── main.py              # FastAPI application entrypoint
│   │
│   ├── tests/                   # Python unit tests
│   ├── .dockerignore            # Docker ignore patterns
│   ├── Dockerfile               # Python slim container definition
│   ├── .env.example             # Backend environment template
│   └── requirements.txt         # Core dependencies
│
└── frontend/                     # Next.js Application
    ├── app/
    │   ├── api/                 # Server-side proxy API routers
    │   ├── dashboard/           # Auth-protected dashboard route
    │   ├── layout.tsx           # Global layouts and providers
    │   ├── page.tsx             # Interactive landing page
    │   └── globals.css          # Tailwind configurations
    │
    ├── components/              # Shared elements (theme toggles, headers, cards)
    ├── lib/                     # API client hooks and Auth0 client setups
    ├── middleware.ts            # Next.js session route protectors
    ├── .dockerignore            # Docker ignore patterns
    ├── Dockerfile               # Node alpine container definition
    ├── .env.local.example       # Frontend environment template
    └── package.json             # Package scripts and dependencies
```

---

## Prerequisites
* **Node.js**: Version `22.x` (or newer)
* **Python**: Version `3.12.x`
* **Docker Desktop**: Required to run the multi-container stack or the Redis service.
* **OpenWeatherMap Account**: A registered API key to access current weather endpoints.
* **Auth0 Account**: An active tenant configured with a Web Application and API Resource.

---

## Environment Variables

### Backend Environment (`backend/.env`)
```env
APP_NAME="WeatherComfort Analytics API"
ENVIRONMENT=development
DEBUG=true

HOST=0.0.0.0
PORT=8000

OPENWEATHER_API_KEY=your_openweathermap_api_key
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5
OPENWEATHER_TIMEOUT_SECONDS=10

REDIS_URL=redis://localhost:6379/0
CACHE_RAW_TTL_SECONDS=300
CACHE_PROCESSED_TTL_SECONDS=60
# Forecast cache TTL is currently fixed at 900 seconds (15 minutes) in application code.

AUTH0_DOMAIN=your-auth0-tenant.us.auth0.com
AUTH0_AUDIENCE=https://weather-comfort-api
AUTH0_ALGORITHMS=RS256

CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend Environment (`frontend/.env.local`)
```env
AUTH0_SECRET=your_32_byte_session_secret_hash
APP_BASE_URL=http://localhost:3000

AUTH0_DOMAIN=your-auth0-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_AUDIENCE=https://weather-comfort-api

NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## OpenWeatherMap Setup
1. Log in to [OpenWeatherMap](https://openweathermap.org/) and generate an API key.
2. Put the key in the backend `.env` file under `OPENWEATHER_API_KEY`.
3. The backend queries weather details by city ID using the following template:
   ```text
   https://api.openweathermap.org/data/2.5/weather?id={city_id}&appid={API_KEY}&units=metric
   ```
4. The `units=metric` flag ensures that temperatures are returned in Celsius, and wind speed in meters/second.

---

## Auth0 Setup

1. **Tenant**: Register an account on [Auth0](https://auth0.com/).
2. **Application (Next.js)**:
   - Create a **Regular Web Application** in your Auth0 dashboard.
   - Configure **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
   - Configure **Allowed Logout URLs**: `http://localhost:3000`
   - Configure **Allowed Web Origins**: `http://localhost:3000`
   - Copy the Client ID, Client Secret, and Domain to `frontend/.env.local`.
3. **API (FastAPI)**:
   - Create an **API** in the Auth0 dashboard.
   - Set the identifier (e.g. `https://weather-comfort-api`) and copy this to `AUTH0_AUDIENCE` in both frontend and backend configurations.
   - Set signature algorithm to `RS256`.
4. **Test User**:
   - Create a test user in Auth0 **User Management** and assign them to your database connection.
   - *Security note:* Keep user credentials private; do not document the password in source files or the README.
5. **Additional Settings**:
   - To restrict signups, toggle off the "Disable Signups" switch in your Auth0 database connection settings.
   - Configure Multi-Factor Authentication (MFA) in the Security section of the Auth0 dashboard.

---

## Local Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd weather-comfort
```

### 2. Frontend Configuration
```bash
cd frontend
npm install
cp .env.local.example .env.local
```
*(On Windows, you can duplicate and rename `.env.local.example` to `.env.local` manually)*

### 3. Backend Configuration
```bash
cd ../backend
python -m venv .venv
```
* **macOS/Linux Activation**:
  ```bash
  source .venv/bin/activate
  ```
* **Windows PowerShell Activation**:
  ```powershell
  .venv\Scripts\Activate.ps1
  ```
* **Install Requirements**:
  ```bash
  pip install -r requirements.txt
  ```

---

## Run Locally Without Docker

Before running without Docker, start a local Redis instance on port `6379`. Alternatively, spin up only the Redis service using:
```bash
docker compose up -d redis
```

### Start Services

```bash
# Terminal 1 - Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Expected URLs
* **Frontend Landing Page**: http://localhost:3000
* **Backend API Root**: http://localhost:8000
* **Backend Health Check**: http://localhost:8000/health
* **API Documentation (Swagger)**: http://localhost:8000/docs

---

## Run with Docker Compose

Ensure Docker Desktop is running, then execute the following commands in the root directory:

* **Validate Compose File**:
  ```bash
  docker compose config
  ```
* **Build and Start (Foreground)**:
  ```bash
  docker compose up --build
  ```
* **Start Stack (Background / Detached)**:
  ```bash
  docker compose up -d --build
  ```
* **View Active Logs**:
  ```bash
  docker compose logs -f
  ```
* **Stop Container Services**:
  ```bash
  docker compose down
  ```
* **Wipe Persistent Cache Volume**:
  ```bash
  docker compose down -v
  ```

### Docker Network Details
* The Next.js frontend container maps port `3000` to the host.
* The FastAPI backend container maps port `8000` to the host.
* The Next.js Route Handlers connect internally to the FastAPI backend using `API_BASE_URL=http://backend:8000`.
* The FastAPI backend resolves the Redis cache using `REDIS_URL=redis://redis:6379/0`.
* The client browser calls the API proxy routes relatively (`/api/...`), completely keeping the internal Docker service hostnames secure.

---

## API Documentation

| Method | Path | Auth Required | Purpose |
|---|---|---|---|
| **GET** | `/health` | No | Public endpoint verifying api status |
| **GET** | `/api/v1/weather/comfort` | Yes (JWT Token) | Fetches, computes, and returns ranked comfort indexes |
| **GET** | `/api/v1/cache/status` | Yes (JWT Token) | Debug endpoint for processed cache key/TTL and cumulative raw cache hit/miss counters |

### Example Request
```http
GET /api/v1/weather/comfort
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

### Example Abbreviated Response (`ComfortWeatherResponse`)
```json
{
  "generated_at": "2026-08-28T02:40:00Z",
  "formula_version": "v1",
  "city_count": 10,
  "failed_city_count": 0,
  "cache": {
    "processed": "MISS",
    "raw_hits": 8,
    "raw_misses": 2
  },
  "cities": [
    {
      "city_id": 1850147,
      "city_name": "Tokyo",
      "country": "JP",
      "rank": 1,
      "comfort_score": 85.40,
      "weather": {
        "description": "clear sky",
        "temperature_c": 22.4,
        "humidity": 45,
        "wind_speed_mps": 3.2,
        "cloudiness_percent": 0
      },
      "score_breakdown": {
        "temperature": 82.50,
        "humidity": 100.00,
        "wind": 92.30,
        "cloudiness": 100.00
      }
    }
  ]
}
```

---

## Comfort Index Formula

The Comfort Index is calculated on the backend for each city, normalizing each parameter to a `0-100` range before taking a weighted average.

### Component Formulas

| Parameter | Weight | Ideal / Acceptable Range | Mathematical Behavior |
|---|---:|---|---|
| **Temperature** | 40% | `18.0°C` to `26.0°C` | Standard ideal range is `100.0`. Every degree above `26°C` or below `18°C` penalizes the score by `7.0` points. Minimum is `0.0`. |
| **Humidity** | 25% | `50%` | Ideal value is `50%`. Every 1% deviation (absolute difference) penalizes the score by `2.0` points. Minimum is `0.0`. |
| **Wind Speed** | 20% | $\le 5.0$ m/s | Winds $\le 5.0$ m/s receive `100.0`. Every 1 m/s exceeding `5.0` m/s penalizes the score by `12.0` points. Minimum is `0.0`. |
| **Cloudiness** | 15% | $\le 40\%$ | Cloud covers $\le 40\%$ receive `100.0`. Every 1% exceeding `40%` penalizes the score by `1.5` points. Minimum is `0.0`. |

* **Total Comfort Score calculation**:
  $$\text{Total Score} = (\text{Temp Score} \times 0.40) + (\text{Humidity Score} \times 0.25) + (\text{Wind Score} \times 0.20) + (\text{Clouds Score} \times 0.15)$$
* **Constraints**: Both component scores and the final total score are clamped between `0.00` and `100.00` and rounded to exactly `2` decimal places.
* **Sorting**: Ranked in descending order (highest score gets Rank #1).
* **Tie-Breaker**: In the event of identical scores, cities are sorted alphabetically by name.

---

## Formula Rationale

The formula is a research-informed but intentionally simplified product heuristic. Thermal-comfort standards and outdoor-comfort research recognize temperature, humidity, air movement, and environmental conditions as relevant factors. The exact thresholds and weights are configurable calibration choices designed to produce a transparent and explainable city ranking.

This is not a medical, occupational, or universal physiological comfort standard.

*Reference guidelines:*
- [ASHRAE Standard 55 Thermal Environmental Conditions](https://www.ashrae.org/)
- [NOAA National Weather Service Heat Index Assessment](https://www.weather.gov/safety/heat-index)

### Why These Four Factors?

The Comfort Index turns different weather conditions into one score from 0 to 100, making it easy to compare which city feels most pleasant right now. Each input maps to a common outdoor-comfort signal:

* **Temperature** - the baseline thermal signal people notice first.
* **Humidity** - shifts how warm or sticky the air feels at a given temperature.
* **Wind** - can improve comfort with light airflow, but strong wind reduces it outdoors.
* **Cloudiness** - affects sun exposure and brightness; useful as a secondary environmental modifier.

### Reasoning Behind Variable Weights

Weights were chosen to reflect **perceived impact**, not equal mathematical importance. They sum to `100%` so the final score stays intuitive and easy to explain in the UI.

| Parameter | Weight | Why this weight |
|---|---:|---|
| **Temperature** | 40% | Strongest single driver of outdoor comfort. Small temperature changes usually affect rankings more than small changes in the other factors. ASHRAE-style comfort guidance also treats air temperature as the primary variable. |
| **Humidity** | 25% | Second-largest influence because moisture strongly changes how temperature *feels*, especially in warm conditions (aligned with heat-index style thinking from NOAA guidance). |
| **Wind Speed** | 20% | Meaningful but secondary. Light breeze helps; excessive wind quickly makes outdoor conditions worse, so it should influence rankings without overpowering temperature. |
| **Cloudiness** | 15% | Smallest weight because it mainly moderates comfort through sun/shade and brightness rather than core thermal feel. It still matters, but less than the three factors above. |

**Design intent:** prioritize the factors users most strongly associate with “comfortable weather,” while keeping the formula transparent enough to show a per-component breakdown on the dashboard.

---

## Caching Design

Server-side caching minimizes latency, avoids redundant OpenWeatherMap calls, and protects API rate limits. Redis is preferred over local in-memory dictionaries so cache state stays consistent across scaled uvicorn processes.

### Cache Layers

| Layer | Redis Key | TTL | Purpose | Used By |
|---|---|---:|---|---|
| **Raw current weather** | `weather:raw:{city_id}` | 300s (5 min) | Stores the raw OpenWeatherMap `/weather` JSON per city | Comfort ranking flow |
| **Processed rankings** | `weather:processed:all` | 60s (1 min) | Stores the fully ranked comfort dashboard response | `GET /api/v1/weather/comfort` |
| **Forecast trend** | `weather:forecast:{city_id}` | 900s (15 min) | Stores the raw OpenWeatherMap `/forecast` JSON per city | `GET /api/v1/weather/cities/{city_id}/temperature-trend` |

### Comfort Ranking Cache Flow

```text
Request to /weather/comfort
  ↓
Check processed cache (weather:processed:all)
  ├── HIT  → Return cached ranking JSON instantly (60s TTL)
  └── MISS
        ↓
    Loop through cities in cities.json
    Check raw cache (weather:raw:{city_id})
        ├── HIT  → Increment stats:raw:hits, reuse raw weather JSON (300s TTL)
        └── MISS → Increment stats:raw:misses, fetch /weather from OpenWeatherMap & save to Redis
        ↓
    Calculate Comfort Scores & Rank Cities
    Save output to processed cache (weather:processed:all)
    Return response with cache.processed = "MISS", raw_hits, raw_misses
```

### Temperature Trend Cache Flow

```text
Request to /weather/cities/{city_id}/temperature-trend
  ↓
Validate city_id against cities.json allowlist
  ↓
Check forecast cache (weather:forecast:{city_id})
  ├── HIT  → Read cached forecast JSON (900s TTL)
  └── MISS → Fetch /forecast from OpenWeatherMap & save to Redis
        ↓
Extract next 8 points (24 hours at 3-hour intervals)
Return TemperatureTrendResponse with cache.status and cache.ttl_seconds
```

> [!TIP]
> If Redis becomes unavailable, the caching layer catches errors, logs them, and gracefully falls back to querying OpenWeatherMap directly. Comfort responses are served with `cache.processed = "MISS"`; forecast requests still return data but with `cache.status = "MISS"`.

---

## Authentication and Authorization Design
* **Auth0 Identity Provider**: The application maintains no local user database. Auth0 handles user credential storage, registrations, and logins.
* **Next.js Route Protection**: Next.js middleware guards private client routes (`/dashboard`) by verifying user authentication sessions. Unauthenticated users are redirected to login.
* **FastAPI Token Validation**: FastAPI independently validates the signed JWT token sent in the `Authorization` header. It validates the RS256 signature against Auth0 public keys (JWKS), verifies token expiration (`exp`), matching audience (`aud`), and matching issuer (`iss`).

---

## Frontend UX
* **Polished Landing Page**: Premium product landing page containing a desktop/mobile navigation header, grid feature decks, mathematical Chip values, and a timeline representing computational steps.
* **Auth-Protected Dashboard**: Renders city ranking cards in descending order using custom animated comfort indicators, a data grid table, and real-time cache summary badges.
* **Theme Switching**: Includes a theme toggle (sun/moon icons) to switch between light and dark modes. Theme choices are persisted across page reloads.
* **Resilient States**: Gracefully displays skeletons during loading states and custom panels with reload options during network or authorization failures.

### Landing Page

<table>
  <tr>
    <td align="center"><strong>🌙 Dark Mode</strong></td>
    <td align="center"><strong>☀️ Light Mode</strong></td>
  </tr>
  <tr>
    <td><img src="docs/Landing%20page%20dark.png" alt="Landing Page Dark Mode" /></td>
    <td><img src="docs/Landing%20page%20light.png" alt="Landing Page Light Mode" /></td>
  </tr>
</table>

### Dashboard

<table>
  <tr>
    <td align="center"><strong>🌙 Dark Mode</strong></td>
    <td align="center"><strong>☀️ Light Mode</strong></td>
  </tr>
  <tr>
    <td><img src="docs/Dashboard%20dark.png" alt="Dashboard Dark Mode" /></td>
    <td><img src="docs/Dashboard%20light.png" alt="Dashboard Light Mode" /></td>
  </tr>
</table>

### Temperature Trend Graph

![Temperature Trend Graph](docs/Temperature%20graph.png)

---

## Testing

* **Backend Test Framework**: Pytest.
* **Coverage Scope**: Comfort Index formula only — direct unit tests for each component scorer (`temperature`, `humidity`, `wind`, `cloudiness`), integration tests for weighted totals, boundary values, floor/ceiling clamping, and 2-decimal rounding.
* **Test File**: `backend/tests/test_comfort_index.py` (39 tests).
* **Isolation**: Pure function tests with no external API, Redis, or database dependencies.
* **Run Tests**:
  ```bash
  cd backend
  source .venv/bin/activate
  pytest tests/test_comfort_index.py -v
  ```

---

## Linting, Type Checking, and Build
To verify type integrity and style guides before committing, execute:
```bash
# Frontend
cd frontend
npm run lint    # Next.js ESLint execution
npm run build   # Production asset compilation

# Backend
cd backend
python -m compileall app
```

---

## Security
* **Secret Isolation**: Secrets are kept only in host environments and ignored by git.
* **API Key Safety**: OpenWeatherMap API keys are accessed only on the backend.
* **Token Verification**: Enforced JWT validations on all FastAPI endpoints.
* **CORS Allowed Origins**: Strict list matching allowed frontend hosts (`http://localhost:3000`).
* **Error Sanitization**: Production builds suppress internal cache traces or stack errors.

---

## Trade-offs and Design Decisions

* **FastAPI + Next.js separation**: Enables clean separation of concerns, letting Next.js focus on client state and FastAPI on index calculations and data processing.
* **Redis Caching (three layers)**: Adds a service dependency, but separates raw weather (5 min), processed rankings (1 min), and forecast trends (15 min) so each data type can expire at an appropriate rate while protecting third-party API limits.
* **No Database**: A relational database is omitted because the application is designed to calculate scores from real-time weather data and predefined city lists.
* **Static City Allowlist**: City codes are loaded from a backend config file to prevent arbitrary inputs.

---

## Known Limitations
* **Simplified Heuristic**: The Comfort Index does not account for wind/humidity interactions or seasonal preferences.
* **Static Cities**: The list of tracked cities cannot be edited by users dynamically through the dashboard UI.
* **No Historical Storage**: Historical weather patterns are not retained.

---

## Future Improvements
* **UTCI/Apparent Temperature**: Incorporate apparent temperature equations (e.g. humidex, wind chill).
* **Additional Parameters**: Integrate air quality (AQI), UV index, and precipitation.
* **Historical Trends**: Persist scores in a database to render historical comfort trend charts in the frontend.

---


## Project Verification

The full verification checklist and step-by-step QA instructions have been moved to [docs/verification.md]. Refer to that document for expected test commands, verification steps, and CI guidance.





