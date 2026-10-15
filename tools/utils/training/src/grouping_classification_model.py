import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import GridSearchCV

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SONG_INFO_PATH = os.path.join(BASE_DIR, "storage", "songs", "get_song_info.json")
MODEL_DIR = os.path.join(BASE_DIR, "storage", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

default_groupings = [
    "60s Classics", "70s Classics", "80s Anthems", "90s Nostalgia", "Y2K (00s)", "Modern Chart",
    "Svenska Klassiker", "Melodifestivalen & Eurovision", "Allsång & Afterski", "Visa & Akustiskt",
    "Party Hits", "Duets & Group Songs", "Power Ballads", "One-Hit Wonders",
    "Guilty Pleasures", "Cheesy / Comedy", "Enkla Låtar (Easy Mode)",
    "Disney", "Movie Soundtracks & Musicals", "Boybands & Girlgroups",
    "Road Trip Classics", "Covers & Remakes", "Christmas Classics",
    "Metal & Hard Rock", "Hip-Hop & Rap", "R&B & Soul", "Rock & Alternative",
    "Pop & Top 40", "Latin & Reggaeton Beats", "Electronic & Dance", "Eurodance"
]


def apply_rule_based(row):
    title = str(row.get('song_name', '')).lower()
    album = str(row.get('album_name', '')).lower()
    year = str(row.get('release_date', ''))
    if "christmas" in title or "jul" in title: return "Christmas Classics"
    if "disney" in album: return "Disney"
    if year.startswith("196"): return "60s Classics"
    if year.startswith("197"): return "70s Classics"
    if year.startswith("198"): return "80s Anthems"
    if year.startswith("199"): return "90s Nostalgia"
    return None


def train_grouping_model():
    if not os.path.exists(SONG_INFO_PATH):
        print("Error: get_song_info.json not found.")
        return

    with open(SONG_INFO_PATH, "r", encoding="utf-8") as f:
        songs = json.load(f)

    df = pd.DataFrame(songs)
    df['rule_grouping'] = df.apply(apply_rule_based, axis=1)
    df['combined_text'] = df['artist'].fillna("") + " " + df['song_name'].fillna("") + " " + df['album_name'].fillna("")
    df['grouping'] = df['rule_grouping'].fillna("Modern Chart")

    pipeline_lr = make_pipeline(
        TfidfVectorizer(max_features=1000),
        LogisticRegression(max_iter=500, random_state=42)
    )
    param_grid = {'logisticregression__C': [0.1, 1.0, 10.0]}

    print("Running GridSearchCV for Logistic Regression Grouping Classifier...")
    grid_search_lr = GridSearchCV(pipeline_lr, param_grid, cv=3, scoring='accuracy')
    grid_search_lr.fit(df['combined_text'], df['grouping'])

    print(f"Best estimator for LR model:\n{grid_search_lr.best_estimator_}")
    print(f"Best parameter values for LR model:\n{grid_search_lr.best_params_}")
    print(f"Best score for LR model: {round(grid_search_lr.best_score_, 3)}")

    # Prediction tabulation and pretty tables
    names = df['song_name'].tolist()
    categories = default_groupings
    song_groups = {name: [] for name in names}
    song_pred = {name: [] for name in names}
    song_genre = {}
    pred_count = {name: {cat: 0 for cat in categories} for name in names}

    for idx, row in df.iterrows():
        song_groups[row['song_name']].append(row['combined_text'])

    best_estimator_LR = grid_search_lr.best_estimator_
    for name in names:
        for text in song_groups[name]:
            pred = best_estimator_LR.predict([text])[0]
            if pred in pred_count[name]:
                pred_count[name][pred] += 1
                song_pred[name].append(pred)

    print("\n--- Prediction Count Table (Sample) ---")
    count_rows = [{"Song Name": n, **pred_count[n]} for n in list(names)[:10]]
    print(pd.DataFrame(count_rows).fillna(0).to_string(index=False))

    for name in names:
        stats = pred_count[name]
        song_genre[name] = max(stats, key=stats.get) if sum(stats.values()) > 0 else "Modern Chart"

    print("\n--- Final Resolved Groupings (Sample) ---")
    print(pd.DataFrame(list(song_genre.items()), columns=["Song Name", "Assigned Grouping"]).head(10).to_string(
        index=False))

    model_path = os.path.join(MODEL_DIR, "grouping_classifier.joblib")
    joblib.dump(best_estimator_LR, model_path)
    print(f"\nGrouping model saved successfully to {model_path}")


if __name__ == "__main__":
    train_grouping_model()