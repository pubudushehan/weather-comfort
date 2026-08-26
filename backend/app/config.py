import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "WeatherComfort Analytics API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    MIN_CITY_COUNT: int = 8

    OPENWEATHER_API_KEY: str
    OPENWEATHER_BASE_URL: str = "https://api.openweathermap.org/data/2.5"
    OPENWEATHER_TIMEOUT_SECONDS: int = 10

    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_RAW_TTL_SECONDS: int = 300
    CACHE_PROCESSED_TTL_SECONDS: int = 60

    AUTH0_DOMAIN: str
    AUTH0_AUDIENCE: str
    AUTH0_ALGORITHMS: str = "RS256"

    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
