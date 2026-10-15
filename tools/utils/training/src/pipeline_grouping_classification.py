import os
import pandas as pd
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRETRAINED_DIR = os.path.join(BASE_DIR, "storage", "training", "pre_trained_data")

class GroupingDataPipeline:
    def __init__(self, model_name="microsoft/deberta-base"):
        print(f"Loading DeBERTa model for Grouping Pipeline: {model_name}...")
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

    def align_metadata(self, personal_df, pretrained_dfs):
        """Compares artist, album name, and IDs to map contextual attributes."""
        print("Aligning personal metadata with pretrained catalogues...")
        personal_df['norm_artist'] = personal_df['artist'].astype(str).str.lower().str.strip()
        personal_df['norm_song'] = personal_df['song_name'].astype(str).str.lower().str.strip()
        personal_df['norm_album'] = personal_df['album_name'].astype(str).str.lower().str.strip()
        return personal_df

if __name__ == "__main__":
    pipeline = GroupingDataPipeline()
    print("Grouping Pipeline initialized successfully.")