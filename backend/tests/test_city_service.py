import pytest
import json
from app.services.city_service import (
    CityService,
    CityFileNotFoundError,
    InvalidCityJsonError,
    InsufficientCitiesError
)
from app.config import settings

def test_load_valid_cities(tmp_path):
    # Setup test file
    test_data = {
        "List": [
            {"CityCode": "1248991", "CityName": "Colombo"},
            {"CityCode": "1850147", "CityName": "Tokyo"},
            {"CityCode": "2644210", "CityName": "Liverpool"},
            {"CityCode": "2988507", "CityName": "Paris"},
            {"CityCode": "2147714", "CityName": "Sydney"},
            {"CityCode": "4930956", "CityName": "Boston"},
            {"CityCode": "1796236", "CityName": "Shanghai"},
            {"CityCode": "3143244", "CityName": "Oslo"}
        ]
    }
    file_path = tmp_path / "cities_test.json"
    file_path.write_text(json.dumps(test_data))
    
    # Run service
    service = CityService(file_path=str(file_path))
    city_ids = service.get_city_ids()
    
    assert len(city_ids) == 8
    assert city_ids == [1248991, 1850147, 2644210, 2988507, 2147714, 4930956, 1796236, 3143244]

def test_missing_file():
    service = CityService(file_path="non_existent_file.json")
    with pytest.raises(CityFileNotFoundError):
        service.get_city_ids()

def test_invalid_json(tmp_path):
    file_path = tmp_path / "cities_invalid.json"
    file_path.write_text("invalid json string {")
    
    service = CityService(file_path=str(file_path))
    with pytest.raises(InvalidCityJsonError):
        service.get_city_ids()

def test_invalid_schema(tmp_path):
    # Root is not dict
    file_path_1 = tmp_path / "cities_schema_1.json"
    file_path_1.write_text(json.dumps([]))
    with pytest.raises(InvalidCityJsonError):
        CityService(file_path=str(file_path_1)).get_city_ids()
        
    # 'List' missing
    file_path_2 = tmp_path / "cities_schema_2.json"
    file_path_2.write_text(json.dumps({"cities": []}))
    with pytest.raises(InvalidCityJsonError):
        CityService(file_path=str(file_path_2)).get_city_ids()

def test_insufficient_cities(tmp_path, monkeypatch):
    test_data = {
        "List": [
            {"CityCode": "1248991", "CityName": "Colombo"},
            {"CityCode": "1850147", "CityName": "Tokyo"}
        ]
    }
    file_path = tmp_path / "cities_insufficient.json"
    file_path.write_text(json.dumps(test_data))
    
    # Force MIN_CITY_COUNT to 8 during this test
    monkeypatch.setattr(settings, "MIN_CITY_COUNT", 8)
    
    service = CityService(file_path=str(file_path))
    with pytest.raises(InsufficientCitiesError):
        service.get_city_ids()

def test_skip_invalid_entries_and_deduplicate(tmp_path):
    test_data = {
        "List": [
            {"CityCode": "1248991", "CityName": "Colombo"},
            {"CityCode": "1850147", "CityName": "Tokyo"},
            # Duplicate
            {"CityCode": "1248991", "CityName": "Colombo"},
            # Malformed missing CityCode
            {"CityName": "Liverpool"},
            # Malformed non-numeric code
            {"CityCode": "invalid_code", "CityName": "Liverpool"},
            # Non-dict item
            "just_a_string",
            {"CityCode": "2644210", "CityName": "Liverpool"},
            {"CityCode": "2988507", "CityName": "Paris"},
            {"CityCode": "2147714", "CityName": "Sydney"},
            {"CityCode": "4930956", "CityName": "Boston"},
            {"CityCode": "1796236", "CityName": "Shanghai"},
            {"CityCode": "3143244", "CityName": "Oslo"}
        ]
    }
    file_path = tmp_path / "cities_skip_dedup.json"
    file_path.write_text(json.dumps(test_data))
    
    service = CityService(file_path=str(file_path))
    city_ids = service.get_city_ids()
    
    # Duplicate, malformed entries, and non-dicts are ignored or deduplicated.
    assert len(city_ids) == 8
    assert city_ids == [1248991, 1850147, 2644210, 2988507, 2147714, 4930956, 1796236, 3143244]
