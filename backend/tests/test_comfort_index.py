from app.services.comfort_service import (
    calculate_comfort_index,
    calculate_temperature_score,
    calculate_humidity_score,
    calculate_wind_score,
    calculate_cloudiness_score,
)
import pytest

def test_ideal_conditions_produce_perfect_score():
    # Ideal parameters: Temp 22°C (18-26 range), Humidity 50%, Wind 2 m/s (<=5 range), Clouds 20% (<=40 range)
    result = calculate_comfort_index(
        temperature_c=22.0,
        humidity=50.0,
        wind_speed_mps=2.0,
        cloudiness_percent=20.0
    )
    
    assert result.total_score == 100.0
    assert result.score_breakdown.temperature == 100.0
    assert result.score_breakdown.humidity == 100.0
    assert result.score_breakdown.wind == 100.0
    assert result.score_breakdown.cloudiness == 100.0

def test_extreme_heat_reduces_score():
    # Temp 35°C (26 + 9). Score: 100 - (9 * 7) = 37
    result = calculate_comfort_index(
        temperature_c=35.0,
        humidity=50.0,
        wind_speed_mps=2.0,
        cloudiness_percent=20.0
    )
    
    # Weight: Temp (40%). Contribution = 37 * 0.4 = 14.8. 
    # Others contribution: 100 * 0.6 = 60.
    # Total = 74.8
    assert result.score_breakdown.temperature == 37.0
    assert result.total_score == 74.8

def test_extreme_cold_reduces_score():
    # Temp 5°C (18 - 13). Score: 100 - (13 * 7) = 9
    result = calculate_comfort_index(
        temperature_c=5.0,
        humidity=50.0,
        wind_speed_mps=2.0,
        cloudiness_percent=20.0
    )
    
    # Weight: Temp (40%). Contribution = 9 * 0.4 = 3.6.
    # Others = 60.
    # Total = 63.6
    assert result.score_breakdown.temperature == 9.0
    assert result.total_score == 63.6

def test_high_humidity_reduces_score():
    # Humidity 90% (90 - 50 = 40 difference). Score: 100 - (40 * 2) = 20
    result = calculate_comfort_index(
        temperature_c=22.0,
        humidity=90.0,
        wind_speed_mps=2.0,
        cloudiness_percent=20.0
    )
    
    # Weight: Humidity (25%). Contribution = 20 * 0.25 = 5.
    # Others = 75.
    # Total = 80.0
    assert result.score_breakdown.humidity == 20.0
    assert result.total_score == 80.0

def test_strong_wind_reduces_score():
    # Wind 10 m/s (10 - 5 = 5 diff). Score: 100 - (5 * 12) = 40
    result = calculate_comfort_index(
        temperature_c=22.0,
        humidity=50.0,
        wind_speed_mps=10.0,
        cloudiness_percent=20.0
    )
    
    # Weight: Wind (20%). Contribution = 40 * 0.20 = 8.
    # Others = 80.
    # Total = 88.0
    assert result.score_breakdown.wind == 40.0
    assert result.total_score == 88.0

def test_high_cloudiness_reduces_score():
    # Cloudiness 80% (80 - 40 = 40 diff). Score: 100 - (40 * 1.5) = 40
    result = calculate_comfort_index(
        temperature_c=22.0,
        humidity=50.0,
        wind_speed_mps=2.0,
        cloudiness_percent=80.0
    )
    
    # Weight: Cloudiness (15%). Contribution = 40 * 0.15 = 6.
    # Others = 85.
    # Total = 91.0
    assert result.score_breakdown.cloudiness == 40.0
    assert result.total_score == 91.0

def test_score_never_goes_below_zero():
    # Extreme parameters to force negative outputs prior to clamping
    result = calculate_comfort_index(
        temperature_c=-50.0,
        humidity=200.0,
        wind_speed_mps=100.0,
        cloudiness_percent=500.0
    )
    
    assert result.total_score == 0.0
    assert result.score_breakdown.temperature == 0.0
    assert result.score_breakdown.humidity == 0.0
    assert result.score_breakdown.wind == 0.0
    assert result.score_breakdown.cloudiness == 0.0

def test_score_never_exceeds_hundred():
    # Overly ideal values
    result = calculate_comfort_index(
        temperature_c=22.0,
        humidity=50.0,
        wind_speed_mps=0.0,
        cloudiness_percent=0.0
    )
    
    assert result.total_score == 100.0
    assert result.score_breakdown.temperature == 100.0
    assert result.score_breakdown.humidity == 100.0
    assert result.score_breakdown.wind == 100.0
    assert result.score_breakdown.cloudiness == 100.0

def test_expected_arithmetic_weights():
    # Combination check
    # Temp 20°C -> 100
    # Humidity 60% -> 100 - (10 * 2) = 80
    # Wind 6 m/s -> 100 - (1 * 12) = 88
    # Cloudiness 50% -> 100 - (10 * 1.5) = 85
    # Overall: 100 * 0.4 + 80 * 0.25 + 88 * 0.20 + 85 * 0.15 = 40 + 20 + 17.6 + 12.75 = 90.35
    result = calculate_comfort_index(
        temperature_c=20.0,
        humidity=60.0,
        wind_speed_mps=6.0,
        cloudiness_percent=50.0
    )
    
    assert result.total_score == 90.35
    assert result.score_breakdown.temperature == 100.0
    assert result.score_breakdown.humidity == 80.0
    assert result.score_breakdown.wind == 88.0
    assert result.score_breakdown.cloudiness == 85.0

def test_rounding_to_two_decimals():
    # Temp 28.35°C (2.35 above 26) -> 100 - (2.35 * 7) = 83.55
    # Humidity 61.3% -> 100 - (11.3 * 2) = 77.40
    # Wind 6.2 m/s -> 100 - (1.2 * 12) = 85.60
    # Cloudiness 50.8% -> 100 - (10.8 * 1.5) = 83.80
    # Overall: 83.55 * 0.40 + 77.40 * 0.25 + 85.60 * 0.20 + 83.80 * 0.15
    # = 33.42 + 19.35 + 17.12 + 12.57 = 82.46
    result = calculate_comfort_index(
        temperature_c=28.35,
        humidity=61.3,
        wind_speed_mps=6.2,
        cloudiness_percent=50.8
    )

    assert result.total_score == 82.46
    assert result.score_breakdown.temperature == 83.55
    assert result.score_breakdown.humidity == 77.40
    assert result.score_breakdown.wind == 85.60
    assert result.score_breakdown.cloudiness == 83.80


@pytest.mark.parametrize(
    "temp_c,expected",
    [
        (18, 100.0),
        (26, 100.0),
        (22, 100.0),
        (17, 93.0),
        (27, 93.0),
        (17.9, 99.3),
        (26.1, 99.3),
        (0, 0.0),
    ],
)
def test_temperature_score_boundaries(temp_c, expected):
    assert calculate_temperature_score(temp_c) == pytest.approx(expected)


@pytest.mark.parametrize(
    "humidity,expected",
    [
        (50, 100.0),
        (90, 20.0),
        (10, 20.0),
        (60, 80.0),
        (40, 80.0),
        (150, 0.0),
    ],
)
def test_humidity_score_values(humidity, expected):
    assert calculate_humidity_score(humidity) == expected


def test_humidity_score_is_symmetric_around_ideal():
    assert calculate_humidity_score(30) == calculate_humidity_score(70)


@pytest.mark.parametrize(
    "wind_speed,expected",
    [
        (0, 100.0),
        (5, 100.0),
        (5.01, 99.88),
        (6, 88.0),
        (10, 40.0),
        (13.34, 0.0),
    ],
)
def test_wind_score_boundaries(wind_speed, expected):
    assert calculate_wind_score(wind_speed) == expected


@pytest.mark.parametrize(
    "cloudiness,expected",
    [
        (0, 100.0),
        (40, 100.0),
        (40.01, 99.985),
        (50, 85.0),
        (80, 40.0),
        (106.67, 0.0),
    ],
)
def test_cloudiness_score_boundaries(cloudiness, expected):
    assert calculate_cloudiness_score(cloudiness) == expected


def test_low_humidity_reduces_score():
    result = calculate_comfort_index(
        temperature_c=22.0,
        humidity=10.0,
        wind_speed_mps=2.0,
        cloudiness_percent=20.0,
    )

    assert result.score_breakdown.humidity == 20.0
    assert result.total_score == 80.0


def test_comfort_index_returns_complete_breakdown():
    result = calculate_comfort_index(
        temperature_c=20.0,
        humidity=60.0,
        wind_speed_mps=6.0,
        cloudiness_percent=50.0,
    )

    assert result.total_score == 90.35
    assert result.score_breakdown.temperature == 100.0
    assert result.score_breakdown.humidity == 80.0
    assert result.score_breakdown.wind == 88.0
    assert result.score_breakdown.cloudiness == 85.0
