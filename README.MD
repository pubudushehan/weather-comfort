# WeatherComfort Analytics

WeatherComfort Analytics is a secure, full-stack weather analytics application that retrieves real-time weather data for a predefined list of global cities, computes an outdoor comfort rating using a custom backend-owned formula, and displays them ranked in a responsive dashboard. The system features server-side caching, secure user authentication through Auth0, and containerized deployment support.

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
21. [Temperature Trend Graphs](#temperature-trend-graphs)
22. [Linting, Type Checking, and Build](#linting-type-checking-and-build)
23. [Security](#security)
24. [Error Handling and Resilience](#error-handling-and-resilience)
25. [Deployment](#deployment)
26. [Trade-offs and Design Decisions](#trade-offs-and-design-decisions)
27. [Known Limitations](#known-limitations)
28. [Future Improvements](#future-improvements)
29. [Project Verification Checklist](#project-verification-checklist)
30. [Assignment Submission Notes](#assignment-submission-notes)

---

## Overview
WeatherComfort Analytics aims to help users find the most comfortable outdoor environments instantly. It queries weather conditions (temperature, humidity, wind, and clouds) for a static allowlist of cities, processes them into a normalized Comfort Index Score (from 0 to 100), and ranks them in descending order. 

To maintain strict security boundaries and application integrity, all math calculations and sorting are performed exclusively by the backend. The frontend is a presentation layer that displays these rankings securely once the user is authenticated via Auth0.

> [!NOTE]
> The Comfort Index Score is a research-informed product heuristic designed to rank environments based on typical human comfort ranges. It is not a medical, occupational, or physiological health standard.

---

## Core Features
* **Predefined City Registry**: City identifiers are loaded securely on the backend from [cities.json](file:///Users/pubudushehan/Desktop/Programming/weather-comfort/backend/app/data/cities.json) containing at least 10 valid city codes.
* **Backend Comfort Calculations**: Current weather data is retrieved from OpenWeatherMap, and normalized component ratings are computed on the server.
* **Dual-Layer Caching**: Uses Redis server-side caching:
  - Raw weather responses are cached for 300 seconds (5 minutes).
  - Processed and ranked comfort indexes are cached for 60 seconds (1 minute).
* **Cache Telemetry**: Provides a dedicated cache status debug endpoint (/api/v1/cache/status) reporting hits, misses, and remaining TTLs.
* **Identity Management & MFA**: Integration with Auth0 to support user logins, sign-outs, and multi-factor authentication (MFA).
* **Responsive Dashboard**: Fully adaptive user interface supporting mobile and desktop views, unified theme selections (light/dark modes), and persistent UI preferences.
* **Robust Docker Support**: A containerized local environment configured via Docker Compose to spin up Redis, the FastAPI backend, and the Next.js frontend with a single command.
* **Comprehensive Test Coverage**: Python backend validation suite testing Cache adapters, Comfort index formulas, endpoints, and city data loaders.

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

```mermaid
flowchart TD
    U[User Browser] <-->|HTTPS / Session Cookie| F[Next.js Frontend Node Server]
    F <-->|OAuth2 Flow / MFA| A[Auth0 Identity Provider]
    F -->|Internal API Call + JWT Token| B[FastAPI Backend API]
    B <-->|Cache JSON & Statistics| R[(Redis Cache Server)]
    B -->|API GET Key Auth| O[OpenWeatherMap API]
    B -->|Load Allowlist| C[cities.json]
```

### Responsibility Breakdown
* **Next.js Frontend**: Manages browser-facing interactions, enforces client-side route guards, performs OAuth authentication handshakes, and queries the backend.
* **FastAPI Backend**: Acts as the single source of truth for the Comfort Index calculations, handles JWT validation, connects to Redis, and queries OpenWeatherMap.
* **Redis**: Acts as the server-side cache authority, saving raw and processed results to prevent API rate-limit exhaustion and reduce query latency.
* **Auth0**: Manages user identity verification, enforces Multi-Factor Authentication (MFA), and handles user account registrations securely.
* **OpenWeatherMap**: Serves as the primary external data provider for current meteorological data.

> [!IMPORTANT]
> The frontend never calls the OpenWeatherMap API directly, nor does it calculate the Comfort Index. The OpenWeatherMap API key is kept completely secret and is only accessed by the backend.

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

> [!WARNING]
> Never commit `.env` or `.env.local` files to source control. They contain private API keys, client secrets, and session salts. Always copy configuration keys from the `.example` files and populate them locally.

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
| **GET** | `/api/v1/cache/status` | Yes (JWT Token) | Debug endpoint returning raw hits/misses and TTL details |

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
The formula is a research-informed but intentionally simplified product heuristic. Thermal-comfort standards and outdoor-comfort research recognize temperature, humidity, air movement, and environmental conditions as relevant factors. The exact thresholds and weights in this project are configurable calibration choices designed to produce a transparent and explainable city ranking.

This is not a medical, occupational, or universal physiological comfort standard.

*Reference guidelines:*
- [ASHRAE Standard 55 Thermal Environmental Conditions](https://www.ashrae.org/)
- [NOAA National Weather Service Heat Index Assessment](https://www.weather.gov/safety/heat-index)

### Why This Formula?

The Comfort Index turns different weather conditions into one simple score from 0 to 100, making it easy to compare which city feels most pleasant right now.

It considers temperature, humidity, wind, and cloudiness because each affects how people experience weather outdoors. Temperature has the highest impact, while humidity, wind, and cloud cover fine-tune the result. The formula is a simple, transparent comfort guide not a scientific rule and is designed to give clear, consistent city rankings.

---

## Caching Design

Server-side caching is utilized to minimize latency, prevent redundant database lookups, and protect OpenWeatherMap API rate limits. Redis is preferred over local in-memory dictionaries to ensure state consistency across scaled uvicorn processes.

### Caching Flow
```text
Request to /weather/comfort
  ↓
Check processed cache (weather:processed:all)
  ├── HIT  → Return cached ranking JSON instantly (60s TTL)
  └── MISS
        ↓
    Loop through cities in cities.json
    Check raw cache (weather:raw:{city_id})
        ├── HIT  → Retrieve raw weather data (300s TTL)
        └── MISS → Fetch from OpenWeatherMap & save to Redis
        ↓
    Calculate Comfort Scores & Rank Cities
    Save output to processed cache (weather:processed:all)
    Return response
```

> [!TIP]
> If Redis becomes unavailable, the caching system catches the error, logs it, and gracefully falls back to querying OpenWeatherMap directly, serving the response with a status `cache.processed = "MISS"`.

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

---

## Testing

* **Backend Test Framework**: Pytest with `pytest-asyncio`.
* **Coverage Scope**: Comfort Index computations, raw/processed cache logic, city ID loading, OpenWeatherMap client, and API router validations.
* **Isolation**: All external API calls and Redis connections are mocked in the test suite to ensure that tests can run offline.
* **Run Tests**:
  ```bash
  cd backend
  source .venv/bin/activate
  pytest
  ```

---

## Temperature Trend Graphs
* **Backend Forecast Endpoint**: Exposes a secure API endpoint (`GET /api/v1/weather/cities/{city_id}/temperature-trend`) that requires Auth0 authentication and verifies the city code is present in the approved allowlist.
* **Forecast Query**: Retrieves weather forecasts using the OpenWeatherMap 5-day / 3-hour forecast API (`/forecast`), returning the next 24 hours of data represented as 8 data points at 3-hour intervals. Note that this is forecast data, not historical data.
* **Forecast Cache**: Saves the raw forecast data under a dedicated Redis cache key (`weather:forecast:{city_id}`) with a Time-to-Live (TTL) of 900 seconds (15 minutes).
* **Responsive Line Charts**: Displays forecast trends inside a modal overlay when the user clicks the "View temperature trend" button on any city card or ranking list row. The chart uses Recharts to render Celsius values over time with adaptive themes, interactive tooltips, loading skeleton screens, retry error handlers, and min/max summarized bounds.

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

## Error Handling and Resilience
* **OpenWeatherMap Outage**: Timeout configurations on the httpx client prevent requests from hanging. City service handles individual query failures without crashing the entire batch.
* **Redis Outage**: Falls back to direct weather lookups gracefully.
* **Incorrect Input**: Filters out duplicates or missing configurations from `cities.json`.

---

## Deployment
No public deployment is currently included. The project can be run locally using the documented local or Docker Compose setups.

---

## Trade-offs and Design Decisions

* **FastAPI + Next.js separation**: Enables clean separation of concerns, letting Next.js focus on client state and FastAPI on index calculations and data processing.
* **Redis Caching**: Adding Redis adds a service dependency, but it protects third-party rate limits and improves speed.
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

## Project Verification Checklist

- [x] Next.js frontend starts on port 3000.
- [x] FastAPI backend starts on port 8000.
- [x] Redis starts on port 6379.
- [x] GET `/health` responds with HTTP 200.
- [x] Auth0 login and redirects work.
- [x] Dashboard route `/dashboard` is protected.
- [x] Predefined cities are loaded and comfort scores are calculated.
- [x] Cities are sorted and ranked in descending order.
- [x] Server-side caching (raw and processed) is functional.
- [x] Cache debug endpoint `/api/v1/cache/status` is accurate.
- [x] Light and dark modes toggle and persist.
- [x] Pytest suite passes successfully (37/37 passed).
- [x] Temperature trend forecast graphs show next 24 hours (8 points, 15-minute cache).
- [x] Docker Compose launches the full stack cleanly.
- [x] No secrets or API keys are committed.

