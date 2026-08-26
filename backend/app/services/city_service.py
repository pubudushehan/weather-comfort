import os
import json
import logging
from typing import List

logger = logging.getLogger("weather-comfort")

class CityServiceError(Exception):
    """Base exception for city service operations."""
    pass

class CityFileNotFoundError(CityServiceError):
    """Raised when cities.json file is not found."""
    pass

class InvalidCityJsonError(CityServiceError):
    """Raised when cities.json contains invalid JSON formatting."""
    pass

class InsufficientCitiesError(CityServiceError):
    """Raised when number of valid city IDs is fewer than required."""
    pass

class CityService:
    def __init__(self, file_path: str = None) -> None:
        if file_path is None:
            # Resolve default path relative to this file's location
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.file_path = os.path.join(base_dir, "data", "cities.json")
        else:
            self.file_path = file_path

    def get_city_ids(self) -> List[int]:
        """
        Load city IDs from cities.json.
        Validate CityCode values.
        Remove duplicates.
        Ensure at least settings.MIN_CITY_COUNT valid city IDs exist.
        """
        from app.config import settings
        
        if not os.path.exists(self.file_path):
            logger.error("cities.json file not found at path: %s", self.file_path)
            raise CityFileNotFoundError(f"Cities file not found: {self.file_path}")
            
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            logger.error("Failed to parse cities.json: %s", str(e))
            raise InvalidCityJsonError(f"Invalid JSON format in cities file: {str(e)}")
            
        if not isinstance(data, dict) or "List" not in data:
            logger.error("Invalid schema in cities.json: root key 'List' is missing")
            raise InvalidCityJsonError("Invalid schema in cities file: root must contain 'List'")
            
        city_list = data["List"]
        if not isinstance(city_list, list):
            logger.error("Invalid schema in cities.json: 'List' is not a list")
            raise InvalidCityJsonError("Invalid schema in cities file: 'List' must be a list")
            
        city_ids: List[int] = []
        for index, item in enumerate(city_list):
            if not isinstance(item, dict):
                logger.warning("Skipping non-dict city item at index %d", index)
                continue
                
            city_code_str = item.get("CityCode")
            if city_code_str is None:
                logger.warning("Skipping city item at index %d: missing 'CityCode'", index)
                continue
                
            try:
                # Extract and convert numeric CityCode to int
                city_id = int(city_code_str)
                city_ids.append(city_id)
            except (ValueError, TypeError) as e:
                logger.warning("Skipping invalid city code '%s' at index %d: %s", city_code_str, index, str(e))
                continue
                
        # Remove duplicates while preserving insertion order
        seen = set()
        unique_city_ids: List[int] = []
        for cid in city_ids:
            if cid not in seen:
                seen.add(cid)
                unique_city_ids.append(cid)
                
        min_count = settings.MIN_CITY_COUNT
        if len(unique_city_ids) < min_count:
            logger.error(
                "Insufficient valid cities. Extracted %d unique city IDs, but required at least %d",
                len(unique_city_ids),
                min_count
            )
            raise InsufficientCitiesError(
                f"Fewer than {min_count} valid city IDs are found. Extracted: {len(unique_city_ids)}"
            )
            
        logger.info("Successfully loaded %d unique city IDs", len(unique_city_ids))
        return unique_city_ids
