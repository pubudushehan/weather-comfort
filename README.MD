# WeatherComfort Analytics

## Overview
Placeholder

## Features
Placeholder

## Architecture
Placeholder

## Technology Stack
Placeholder

## Prerequisites
Placeholder

## Environment Variables
Placeholder

## Local Development Setup
Placeholder

## Run with Docker

Before running the stack using Docker Compose, ensure that you have created the required local configuration files (these are git-ignored and should contain valid environment keys):
- [frontend/.env.local](file:///Users/pubudushehan/Desktop/Programming/weather-comfort/frontend/.env.local) (see [frontend/.env.local.example](file:///Users/pubudushehan/Desktop/Programming/weather-comfort/frontend/.env.local.example))
- [backend/.env](file:///Users/pubudushehan/Desktop/Programming/weather-comfort/backend/.env) (see [backend/.env.example](file:///Users/pubudushehan/Desktop/Programming/weather-comfort/backend/.env.example))

### Build and Start Stack
Build and start all services (Redis, Backend, and Frontend) in the foreground:
```bash
docker compose up --build
```

Build and run in detached (background) mode:
```bash
docker compose up -d --build
```

### Manage Logs & Containers
To view active container logs:
```bash
docker compose logs -f
```

To shut down and remove all containers:
```bash
docker compose down
```

### Verification
Once started, verify the services are running at these URLs:
- **Frontend App**: http://localhost:3000
- **Backend API Health**: http://localhost:8000/health
- **Backend API Documentation (Swagger)**: http://localhost:8000/docs

To verify Redis connection and health:
```bash
docker compose exec redis redis-cli ping
```
Expected output:
```text
PONG
```

## Running Redis
Placeholder

## Running Backend
Placeholder

## Running Frontend
Placeholder

## Authentication and Authorization
Placeholder

## Comfort Index Formula
Placeholder

## Variable Weight Rationale
Placeholder

## Cache Design
Placeholder

## API Endpoints
Placeholder

## Testing
Placeholder

## Deployment
Placeholder

## Trade-offs
Placeholder

## Known Limitations
Placeholder

## Screen Recording
Placeholder
