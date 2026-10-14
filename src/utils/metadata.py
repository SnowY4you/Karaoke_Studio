import os
import json
import re
import logging
from mutagen.mp3 import MP3
from mutagen.id3 import ID3NoHeaderError

logger = logging.getLogger("KaraokeStudio.Metadata")


def extract_metadata(filepath: str) -> dict:
    """
    Reads metadata (Title, Artist, Duration, Genre, Release Year) from embedded MP3 tags.
    Falls back to safe filename parsing if tags are missing, and updates info_songs.json.
    """
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    METADATA_DIR = os.path.join(BASE_DIR, "storage", "song_data")
    METADATA_FILE = os.path.join(METADATA_DIR, "info_songs.json")

    filename = os.path.basename(filepath)
    filename_no_ext = os.path.splitext(filename)[0]

    # 1. Load the full MP3 object using the actual file path
    try:
        audio = MP3(filepath)
        duration_ms = int(audio.info.length * 1000)
        length_in_seconds = round(audio.info.length)
        tags = audio.tags
    except Exception as e:
        logger.error(f"Error reading MP3 audio properties for {filepath}: {e}")
        return {}

    # Format duration (MM:SS)
    minutes = length_in_seconds // 60
    seconds = length_in_seconds % 60
    duration_formatted = f"{minutes}:{seconds:02d}"

    # 2. Extract Tags safely with filename fallback
    song_name = None
    artist_name = None
    genre = "Unknown Genre"
    release_year = None

    if tags is not None:
        song_name = str(tags.get('TIT2', '')) if tags.get('TIT2') else None
        artist_name = str(tags.get('TPE1', '')) if tags.get('TPE1') else None

        if tags.get('TCON'):
            genre = str(tags.get('TCON'))

        # ID3v2.4 (TDRC) vs ID3v2.3 (TYER)
        if 'TDRC' in tags:
            release_year = str(tags['TDRC']).split('-')[0]
        elif 'TYER' in tags:
            release_year = str(tags['TYER']).split('-')[0]

    # Fallback to filename parsing if ID3 title/artist tags are missing
    if not song_name or not artist_name:
        if " - " in filename_no_ext:
            parts = filename_no_ext.split(" - ", 1)
            song_name = song_name or parts[0].strip()
            artist_name = artist_name or parts[1].strip()
        else:
            song_name = song_name or filename_no_ext
            artist_name = artist_name or "Unknown Artist"

    # Generate a clean song_id
    clean_artist = re.sub(r'[^a-zA-Z0-9]', '', artist_name.lower())
    clean_song = re.sub(r'[^a-zA-Z0-9]', '', song_name.lower())
    song_id = f"local_{clean_artist}_{clean_song}"

    metadata = {
        "song_id": song_id,
        "song_name": song_name,
        "artist_name": artist_name,
        "genre": genre,
        "duration": duration_formatted,
        "duration_ms": duration_ms,
        "release_year": release_year
    }

    # 3. Save / Update in info_songs.json
    save_to_json(METADATA_FILE, metadata)

    return metadata


def save_to_json(json_path: str, new_song: dict):
    """Appends or updates a song record in the info_songs.json file."""
    os.makedirs(os.path.dirname(json_path), exist_ok=True)

    songs_list = []
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                songs_list = json.load(f)
        except Exception as e:
            logger.warning(f"Could not read existing {json_path}, creating fresh list: {e}")
            songs_list = []

    # Update existing entry if song_id exists, otherwise append
    updated = False
    for idx, song in enumerate(songs_list):
        if song.get("song_id") == new_song["song_id"]:
            songs_list[idx] = new_song
            updated = True
            break

    if not updated:
        songs_list.append(new_song)

    try:
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(songs_list, f, indent=4, ensure_ascii=False)
        logger.info(f"Saved metadata for '{new_song['song_name']}' to {json_path}")
    except Exception as e:
        logger.error(f"Failed to write metadata to {json_path}: {e}")