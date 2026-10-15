import os
import json
from tinytag import TinyTag

# Define base and directory paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SONG_FILE = os.path.join(BASE_DIR, "storage", "songs")
OUTPUT_FILE = os.path.join(SONG_FILE, "get_song_info.json")

formatted_songs = []
song_id = 0

# Scan through the directory and subdirectories for MP3 files
for root, dirs, files in os.walk(SONG_FILE):
    for file in files:
        if file.lower().endswith(".mp3"):
            filepath = os.path.join(root, file)

            try:
                # Read metadata using TinyTag
                tag = TinyTag.get(filepath)

                song_record = {
                    "id": song_id,  # Auto-assigns 0, 1, 2, ...
                    "song_id": None,  # Will be added later
                    "song_name": tag.title,
                    "artist": tag.artist,
                    "album_name": tag.album,
                    "album_id": None,  # Will be added later
                    "genre": tag.genre,
                    "grouping": None,  # Will be added later
                    "release_date": tag.year,
                    "filename": file,  # File name
                    "duration": tag.duration  # Audio duration in seconds
                }

                formatted_songs.append(song_record)
                song_id += 1

            except Exception as e:
                print(f"Error reading metadata from {file}: {e}")

# Save the extracted data to the JSON output file
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(formatted_songs, f, indent=4, ensure_ascii=False)

print(f"Successfully processed {len(formatted_songs)} songs. Saved to: {OUTPUT_FILE}")