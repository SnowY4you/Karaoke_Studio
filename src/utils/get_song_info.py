import os
import json
import re
import time
import requests

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SONG_FILE = os.path.join(BASE_DIR, "storage", "song_data", "info_songs.json")
OUTPUT_DIR = os.path.join(BASE_DIR, "storage", "song_lyrics")

LRCLIB_SEARCH_URL = "https://lrclib.net/api/search"

HEADERS = {
    "User-Agent": "KaraokeStudioApp/1.0 (https://github.com/SnowY4you/Karaoke_Studio)"
}


def sanitize_filename(filename):
    """Remove invalid filesystem characters for paths."""
    return re.sub(r'[\\/*?:"<>|]', "", filename).strip()


def clean_title(title):
    """Remove parenthetical noise like '(2022 Remaster)' for query string."""
    cleaned = re.sub(r'\s*\([^)]*remaster[^)]*\)', '', title, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*-\s*.*remaster.*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*\([^)]*\)', '', cleaned)
    return cleaned.strip()


def fetch_duration_matched_lyrics(track_name, artist_name, duration_ms, tolerance_sec=5):
    """
    Searches LRCLIB for lyrics and selects the candidate whose duration
    matches Spotify's duration within a strict tolerance window.
    """
    target_duration_sec = round(duration_ms / 1000)
    cleaned_name = clean_title(track_name)
    primary_artist = artist_name.split(",")[0].strip()

    try:
        query_str = f"{primary_artist} {cleaned_name}"
        res = requests.get(LRCLIB_SEARCH_URL, params={"q": query_str}, headers=HEADERS, timeout=6)

        if res.status_code == 200:
            results = res.json()
            if isinstance(results, list) and len(results) > 0:
                candidates = []

                for item in results:
                    item_duration = item.get("duration", 0)
                    diff = abs(item_duration - target_duration_sec)

                    # Only accept results within tolerance window
                    if diff <= tolerance_sec:
                        has_synced = bool(item.get("syncedLyrics"))
                        candidates.append((diff, not has_synced, item))

                if candidates:
                    # Sort candidates: closest duration match first, prioritizing synced lyrics
                    candidates.sort(key=lambda x: (x[0], x[1]))
                    best_match = candidates[0][2]

                    return {
                        "synced_lyrics": best_match.get("syncedLyrics"),
                        "plain_lyrics": best_match.get("plainLyrics"),
                        "duration_diff": abs(best_match.get("duration", 0) - target_duration_sec),
                        "found": True
                    }

    except Exception as e:
        print(f" (Request error: {e})", end="")

    return {"synced_lyrics": None, "plain_lyrics": None, "duration_diff": None, "found": False}


def main():
    if not os.path.exists(SONG_FILE):
        print(f"❌ Could not find song database at: {SONG_FILE}")
        return

    with open(SONG_FILE, "r", encoding="utf-8") as f:
        songs = json.load(f)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Loaded {len(songs)} songs. Downloading duration-matched lyrics to:\n{OUTPUT_DIR}\n")

    saved_count = 0
    synced_count = 0

    for idx, song in enumerate(songs, start=1):
        song_id = song.get("song_id")
        song_name = song.get("song_name")
        artist_name = song.get("artist_name")
        duration_ms = song.get("duration_ms", 0)

        clean_filename = sanitize_filename(f"{song_name} - {artist_name}.json")
        file_path = os.path.join(OUTPUT_DIR, clean_filename)

        print(f"[{idx}/{len(songs)}] {song_name} - {artist_name}...", end="", flush=True)

        lyrics_data = fetch_duration_matched_lyrics(song_name, artist_name, duration_ms, tolerance_sec=5)

        output_payload = {
            "song_id": song_id,
            "song_name": song_name,
            "artist_name": artist_name,
            "has_synced_lyrics": bool(lyrics_data["synced_lyrics"]),
            "synced_lyrics": lyrics_data["synced_lyrics"],
            "plain_lyrics": lyrics_data["plain_lyrics"]
        }

        with open(file_path, "w", encoding="utf-8") as out_f:
            json.dump(output_payload, out_f, indent=4, ensure_ascii=False)

        if lyrics_data["found"]:
            saved_count += 1
            if lyrics_data["synced_lyrics"]:
                synced_count += 1
                status = f"Synced LRC (Δ{lyrics_data['duration_diff']}s)"
            else:
                status = f"Plain Text (Δ{lyrics_data['duration_diff']}s)"
            print(f" -> ✓ Matched ({status})")
        else:
            print(f" -> ⚠️ No duration match within ±5s")

        time.sleep(0.12)

    print(f"\n==========================================")
    print(f"Done! Matched {saved_count}/{len(songs)} songs within 5s duration window.")
    print(f"Synced LRC Lyrics: {synced_count}/{saved_count}")
    print(f"==========================================")


if __name__ == "__main__":
    main()