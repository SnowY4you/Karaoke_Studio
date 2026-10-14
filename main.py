import sys
import os
import logging

# Ensure root directory is on Python system path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import Qt

from src.utils.logger import setup_logger
from src.gui.main_window import MainWindow

# Core storage folder requirements
REQUIRED_STORAGE_FOLDERS = [
    os.path.join(BASE_DIR, "storage", "models"),
    os.path.join(BASE_DIR, "storage", "song_data"),
    os.path.join(BASE_DIR, "storage", "song_lyrics"),
    os.path.join(BASE_DIR, "storage", "cache"),
    os.path.join(BASE_DIR, "storage", "logs"),
]


def init_environment():
    """Ensures all required runtime directories exist."""
    for folder in REQUIRED_STORAGE_FOLDERS:
        os.makedirs(folder, exist_ok=True)


def main():
    # 1. Boot Storage and Logging
    init_environment()
    logger = setup_logger(os.path.join(BASE_DIR, "storage", "logs"))
    logger.info("Initializing Karaoke Studio application...")

    # 2. Configure Windows High DPI scaling
    if hasattr(Qt, 'AA_EnableHighDpiScaling'):
        QApplication.setAttribute(Qt.ApplicationAttribute.AA_EnableHighDpiScaling, True)
    if hasattr(Qt, 'AA_UseHighDpiPixmaps'):
        QApplication.setAttribute(Qt.ApplicationAttribute.AA_UseHighDpiPixmaps, True)

    # 3. Instantiate Qt Application
    app = QApplication(sys.argv)
    app.setApplicationName("Karaoke Studio")
    app.setOrganizationName("SnowY4you")

    # 4. Launch Main Window
    window = MainWindow(base_dir=BASE_DIR)
    window.show()

    logger.info("Application window displayed successfully.")
    sys.exit(app.exec())


if __name__ == "__main__":
    main()