import os
import json
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SONG_INFO_PATH = os.path.join(BASE_DIR, "storage", "songs", "get_song_info.json")
MODEL_PATH = os.path.join(BASE_DIR, "storage", "models", "genre_classifier.joblib")


def apply_genre_predictions():
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Trained genre model not found at {MODEL_PATH}. Run genre_classification_model.py first.")
        return

    if not os.path.exists(SONG_INFO_PATH):
        print(f"Error: {SONG_INFO_PATH} not found.")
        return

    model = joblib.load(MODEL_PATH)

    with open(SONG_INFO_PATH, "r", encoding="utf-8") as f:
        songs = json.load(f)

    df = pd.DataFrame(songs)
    X_pred = df[['artist', 'album_name']].fillna("Unknown")

    print("Predicting genres for all songs...")
    predictions = model.predict(X_pred)

    # Handle CatBoost 2D array output if applicable
    if len(predictions.shape) > 1:
        predictions = predictions.flatten()

    for i, song in enumerate(songs):
        song['genre'] = str(predictions[i])

    with open(SONG_INFO_PATH, "w", encoding="utf-8") as f:
        json.dump(songs, f, indent=4, ensure_ascii=False)

    print(f"Successfully updated genre predictions for {len(songs)} songs in {SONG_INFO_PATH}")


if __name__ == "__main__":
    apply_genre_predictions()