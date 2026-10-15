import os
import json
import joblib
import pandas as pd
import numpy as np
from catboost import CatBoostClassifier
from imblearn.combine import SMOTETomek
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import f1_score

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SONG_INFO_PATH = os.path.join(BASE_DIR, "storage", "songs", "get_song_info.json")
MODEL_DIR = os.path.join(BASE_DIR, "storage", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

GENRES = [
    "Pop", "Hip-Hop", "Rap", "R&B", "Soul", "Rock", "Dance", "Country",
    "Reggae", "Svensk", "Metal", "Alternative", "World", "Holiday",
    "Schlager", "Dansband", "Jazz & Blues", "Latin"
]


def train_genre_model():
    if not os.path.exists(SONG_INFO_PATH):
        print("Error: get_song_info.json not found.")
        return

    with open(SONG_INFO_PATH, "r", encoding="utf-8") as f:
        songs = json.load(f)

    df = pd.DataFrame(songs)
    df['artist'] = df['artist'].fillna("Unknown")
    df['album_name'] = df['album_name'].fillna("Unknown")
    df['genre'] = df['genre'].apply(lambda g: g if g in GENRES else "Pop")

    X = df[['artist', 'album_name']]
    y = df['genre']

    cat_features = ['artist', 'album_name']
    genre_pipeline = ImbPipeline([
        ("resample", SMOTETomek(random_state=42)),
        ("classifier", CatBoostClassifier(
            iterations=300,
            learning_rate=0.08,
            depth=6,
            verbose=50,
            cat_features=cat_features
        ))
    ])

    print("Training Genre Classification Model with Stratified K-Fold...")
    skf = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    best_score = 0
    best_model = None

    for train_idx, val_idx in skf.split(X, y):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

        genre_pipeline.fit(X_train, y_train)
        preds = genre_pipeline.predict(X_val)
        score = f1_score(y_val, preds, average='macro', zero_division=0)

        if score >= best_score:
            best_score = score
            best_model = genre_pipeline

    print(f"Best Genre Model Validation Macro-F1 Score: {best_score:.3f}")
    model_path = os.path.join(MODEL_DIR, "genre_classifier.joblib")
    joblib.dump(best_model, model_path)
    print(f"Genre model saved successfully to {model_path}")


if __name__ == "__main__":
    train_genre_model()