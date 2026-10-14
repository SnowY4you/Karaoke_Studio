import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

TARGET_GENRES = [
    "Pop", "Hip-Hop / Rap", "R&B / Soul", "Rock", "Dance", "Country",
    "Reggae", "Svensk", "Metal", "Alternative", "World", "Holiday"
]


class GenreClassifier:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        self.model = LogisticRegression(max_iter=1000)
        self.is_trained = False

    def train_on_spotify_dataset(self, csv_url="hf://datasets/maharshipandya/spotify-tracks-dataset/dataset.csv"):
        """
        Trains classifier on Spotify Dataset.
        """
        try:
            df = pd.read_csv(csv_url)
            df['combined_features'] = df['track_name'].fillna('') + ' ' + df['artists'].fillna('') + ' ' + df[
                'track_genre'].fillna('')

            X = self.vectorizer.fit_transform(df['combined_features'])
            y = df['track_genre']

            self.model.fit(X, y)
            self.is_trained = True
        except Exception as e:
            print(f"Dataset training fallback applied: {e}")

    def predict_genre_and_grouping(self, title: str, artist: str) -> tuple[str, str]:
        if not self.is_trained:
            # Simple Keyword Rule Fallbacks
            query = f"{title} {artist}".lower()
            if any(w in query for w in ["christmas", "jul", "santa", "xmas"]): return "Holiday", "Christmas Classics"
            if any(w in query for w in ["metal", "slayer", "metallica", "iron"]): return "Metal", "Metal & Hard Rock"
            if any(w in query for w in ["duet", "feat", "ft."]): return "Pop", "Duets"
            return "Pop", "Party Hits"

        X_test = self.vectorizer.transform([f"{title} {artist}"])
        pred_genre = self.model.predict(X_test)[0]

        # Map raw Spotify genre to target grouping
        grouping = "Party Hits"
        if "metal" in pred_genre:
            grouping = "Metal & Hard Rock"
        elif "pop" in pred_genre:
            grouping = "Party Hits"

        return pred_genre.capitalize(), grouping