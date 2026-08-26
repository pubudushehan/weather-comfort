from typing import Optional
from pydantic import BaseModel
from app.models.weather import ScoreBreakdown

class ComfortIndexResult(BaseModel):
    total_score: float
    score_breakdown: ScoreBreakdown

def calculate_temperature_score(temp_c: float) -> float:
    if 18 <= temp_c <= 26:
        return 100.0

    if temp_c < 18:
        return max(0.0, 100.0 - ((18 - temp_c) * 7))

    return max(0.0, 100.0 - ((temp_c - 26) * 7))

def calculate_humidity_score(humidity: float) -> float:
    return max(0.0, 100.0 - (abs(humidity - 50) * 2))

def calculate_wind_score(wind_speed: float) -> float:
    if wind_speed <= 5:
        return 100.0

    return max(0.0, 100.0 - ((wind_speed - 5) * 12))

def calculate_cloudiness_score(cloudiness: float) -> float:
    if cloudiness <= 40:
        return 100.0

    return max(0.0, 100.0 - ((cloudiness - 40) * 1.5))

def calculate_visibility_score(visibility_m: Optional[int]) -> float:
    if visibility_m is None:
        return 70.0

    visibility_km = visibility_m / 1000

    if visibility_km >= 8:
        return 100.0

    return max(0.0, (visibility_km / 8) * 100)

def calculate_comfort_index(
    temperature_c: float,
    humidity: float,
    wind_speed_mps: float,
    cloudiness_percent: float,
    visibility_m: Optional[int] = None
) -> ComfortIndexResult:
    """
    Calculate overall Comfort Index Score and component breakdown.
    Version 1 Weights:
    - Temperature: 0.40
    - Humidity: 0.25
    - Wind Speed: 0.20
    - Cloudiness: 0.15
    """
    temp_score = calculate_temperature_score(temperature_c)
    humidity_score = calculate_humidity_score(humidity)
    wind_score = calculate_wind_score(wind_speed_mps)
    clouds_score = calculate_cloudiness_score(cloudiness_percent)

    # Round component scores to 2 decimal places
    temp_score = round(min(100.0, max(0.0, temp_score)), 2)
    humidity_score = round(min(100.0, max(0.0, humidity_score)), 2)
    wind_score = round(min(100.0, max(0.0, wind_score)), 2)
    clouds_score = round(min(100.0, max(0.0, clouds_score)), 2)

    total_score = (
        temp_score * 0.40
        + humidity_score * 0.25
        + wind_score * 0.20
        + clouds_score * 0.15
    )

    total_score = min(100.0, max(0.0, total_score))
    total_score = round(total_score, 2)

    breakdown = ScoreBreakdown(
        temperature=temp_score,
        humidity=humidity_score,
        wind=wind_score,
        cloudiness=clouds_score
    )

    return ComfortIndexResult(
        total_score=total_score,
        score_breakdown=breakdown
    )
