import logging
import sys
from app.config import settings

def setup_logging() -> None:
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ],
        force=True  # Overwrites any default logging configurations
    )
    
    logger = logging.getLogger("weather-comfort")
    logger.info("Logging configured successfully at level %s", logging.getLevelName(log_level))
