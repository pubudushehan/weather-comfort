Manual Verification
To run and verify the endpoints manually:

Start the FastAPI backend server:

bash

cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
Verify endpoints using curl:

Health check endpoint:
bash

curl -i http://localhost:8000/health
Response (HTTP 200):
json

{"status":"ok","service":"weather-comfort-api"}
Weather comfort endpoint:
bash

curl -i http://localhost:8000/api/v1/weather/comfort
Response (HTTP 200) conforms to ComfortWeatherResponse schema.
Cache status endpoint:
bash

curl -i http://localhost:8000/api/v1/cache/status
Response (HTTP 200) conforms to CacheStatusResponse schema.