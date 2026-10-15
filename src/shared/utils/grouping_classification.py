import os
import json
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SONG_INFO_PATH = os.path.join(BASE_DIR, "storage", "songs", "get_song_info.json")
MODEL_PATH = os.path.join(BASE_DIR, "storage", "models", "grouping_classifier.joblib")

def apply_grouping_predictions():
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Trained grouping model not found at {MODEL_PATH}. Run grouping_classification_model.py first.")
        return

    if not os.path.exists(SONG_INFO_PATH):
        print(f"Error: {SONG_INFO_PATH} not found.")
        return

    model = joblib.load(MODEL_PATH)

    with open(SONG_INFO_PATH, "r", encoding="utf-8") as f:
        songs = json.load(f)

    df = pd.DataFrame(songs)
    df['combined_text'] = df['artist'].fillna("") + " " + df['song_name'].fillna("") + " " + df['album_name'].fillna("")

    print("Predicting groupings for all songs...")
    predictions = model.predict(df['combined_text'])

    for i, song in enumerate(songs):
        song['grouping'] = str(predictions[i])

    with open(SONG_INFO_PATH, "w", encoding="utf-8") as f:
        json.dump(songs, f, indent=4, ensure_ascii=False)

    print(f"Successfully updated grouping predictions for {len(songs)} songs in {SONG_INFO_PATH}")

if __name__ == "__main__":
    apply_grouping_predictions()