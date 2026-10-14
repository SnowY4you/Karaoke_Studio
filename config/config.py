# Python 3.12

import os


#  -----------------------------------
# Directory configuration
#  -----------------------------------
BASE_DIR = r"C:\Dev\Karaoke_Studio"

# Storage
STORAGE_DIR = os.path.join(BASE_DIR, "storage")

CACHE_DIR = os.path.join(STORAGE_DIR, "cache")
LOGS_DIR = os.path.join(STORAGE_DIR, "logs")
MODELS_DIR = os.path.join(STORAGE_DIR, "models")
SONG_DATA_DIR = os.path.join(STORAGE_DIR, "song_data")
SONG_LYRICS_DIR = os.path.join(STORAGE_DIR, "song_lyrics")
SONGS_DIR = os.path.join(STORAGE_DIR, "songs")
LYRICS_BACKGROUND_DIR = os.path.join(STORAGE_DIR, "lyrics_bakground")
TEMP_STORAGE_DIR = os.path.join(STORAGE_DIR, "temp_storage")

RAW_DIR = os.path.join(TEMP_STORAGE_DIR, "raw_songs")
LYRICS_DIR = os.path.join(TEMP_STORAGE_DIR, "lyrics")
COMPLETED_SONGS_DIR = os.path.join(TEMP_STORAGE_DIR, "processed_songs")


# Assets
ASSETS_DIR = os.path.join(BASE_DIR, "assets")

ICONS_DIR = os.path.join(ASSETS_DIR, "temp_storage")

# Config
CONFIG_DIR = os.path.join(BASE_DIR, "config")

# src
SRC_DIR = os.path.join(BASE_DIR, "src")

GUI_DIR = os.path.join(SRC_DIR, "gui")
CORE_DIR = os.path.join(SRC_DIR, "core")
UTILS_DIR = os.path.join(SRC_DIR, "utils")