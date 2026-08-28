from pydantic import BaseModel, Field

class ScoreBreakdown(BaseModel):
    temperature: float = Field(..., description="Comfort score component for temperature (0-100)")
    humidity: float = Field(..., description="Comfort score component for humidity (0-100)")
    wind: float = Field(..., description="Comfort score component for wind speed (0-100)")
    cloudiness: float = Field(..., description="Comfort score component for cloudiness (0-100)")

class WeatherDetails(BaseModel):
    description: str = Field(..., description="Weather description text (e.g. overcast clouds)")
    temperature_c: float = Field(..., description="Temperature in Celsius")
    humidity: int = Field(..., description="Humidity percentage (0-100)")
    pressure_hpa: int = Field(..., description="Atmospheric pressure in hPa")
    wind_speed_mps: float = Field(..., description="Wind speed in meters per second")
    cloudiness_percent: int = Field(..., description="Cloudiness percentage (0-100)")
    visibility_km: float = Field(..., description="Visibility distance in kilometers")

class CityResult(BaseModel):
    city_id: int = Field(..., description="Predefined city numeric ID")
    city_name: str = Field(..., description="Name of the city")
    country: str = Field(..., description="Two-letter country code")
    rank: int = Field(..., description="City rank based on overall comfort score (starting at 1)")
    comfort_score: float = Field(..., description="Custom Comfort Index score (0.00 - 100.00)")
    weather: WeatherDetails
    score_breakdown: ScoreBreakdown
