import os
import pandas as pd
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRETRAINED_DIR = os.path.join(BASE_DIR, "storage", "training", "pre_trained_data")


class GenreFeaturePipeline:
    def __init__(self, model_name="distilbert/distilbert-base-multilingual-cased"):
        print(f"Loading Hugging Face model: {model_name}...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        self.model.eval()

    def get_embedding(self, text: str) -> np.ndarray:
        if not text or not isinstance(text, str):
            text = "unknown"
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
        with torch.no_grad():
            outputs = self.model(**inputs)
        return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

    def load_and_merge_pretrained_data(self):
        """Loads and cleans pretrained files, dropping empty rows and duplicates."""
        dfs = []

        # 1. music_genre.csv
        p1 = os.path.join(PRETRAINED_DIR, "music_genre.csv")
        if os.path.exists(p1):
            df = pd.read_csv(p1).dropna().drop_duplicates()
            df = df.rename(columns={'artist_name': 'artist', 'track_name': 'song_name', 'music_genre': 'genre'})
            dfs.append(df[['artist', 'song_name', 'genre']])

        # 2. data_w_genres.csv
        p2 = os.path.join(PRETRAINED_DIR, "data_w_genres.csv")
        if os.path.exists(p2):
            df = pd.read_csv(p2).dropna().drop_duplicates()
            # Maps genres column to primary genre string
            df['genre'] = df['genres'].apply(lambda x: eval(x)[0] if x.startswith('[') and len(eval(x)) > 0 else str(x))
            df = df.rename(columns={'artists': 'artist'})
            dfs.append(df[['artist', 'genre']])

        # 3. spotify_tracks.csv
        p3 = os.path.join(PRETRAINED_DIR, "spotify_tracks.csv")
        if os.path.exists(p3):
            df = pd.read_csv(p3).dropna().drop_duplicates()
            df = df.rename(
                columns={'artists': 'artist', 'name': 'song_name', 'album': 'album_name', 'id': 'spotify_id'})
            dfs.append(df[['spotify_id', 'artist', 'song_name', 'album_name', 'genre']])

        # 4. dataset.csv
        p4 = os.path.join(PRETRAINED_DIR, "dataset.csv")
        if os.path.exists(p4):
            df = pd.read_csv(p4).dropna().drop_duplicates()
            df = df.rename(columns={'artists': 'artist', 'track_name': 'song_name', 'album_name': 'album_name',
                                    'track_id': 'spotify_id', 'track_genre': 'genre'})
            dfs.append(df[['spotify_id', 'artist', 'song_name', 'album_name', 'genre']])

        print(f"Successfully loaded and cleaned pretrained data sources.")
        return dfs


if __name__ == "__main__":
    pipeline = GenreFeaturePipeline()
    datasets = pipeline.load_and_merge_pretrained_data()
    print(f"Loaded {len(datasets)} tables for genre feature augmentation.")