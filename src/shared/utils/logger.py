import os
import sys
import logging
from logging.handlers import RotatingFileHandler


def setup_logger(log_dir: str = None, level=logging.INFO) -> logging.Logger:
    """
    Initializes a central application logger with rotating file handler and standard console output.
    """
    if log_dir is None:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../src", ".."))
        log_dir = os.path.join(base_dir, "storage", "logs")

    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "karaoke_studio.logs")

    logger = logging.getLogger("KaraokeStudio")
    logger.setLevel(level)

    # Avoid duplicate handlers if setup is called multiple times
    if logger.hasHandlers():
        logger.handlers.clear()

    # Log formatters
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # 1. Console Stream Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 2. Rotating File Handler (Max 5MB per file, max 3 backups)
    file_handler = RotatingFileHandler(
        log_file, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    logger.info(f"Logging initialized. Output target: {log_file}")
    return logger