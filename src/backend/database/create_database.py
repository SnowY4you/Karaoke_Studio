# Creating the database

import sqlite3
import os
import logging

logger = logging.getLogger("KaraokeStudio.Database")


class KaraokeDatabase:
    def __init__(self, db_path="storage/karaoke_studio.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.init_db()

    def get_connection(self):
        return sqlite3.connect(self.db_path)

    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Songs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS songs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    artist TEXT NOT NULL,
                    link_inst_file VARCHAR NULL,
					link_vocals_file VARCHAR NULL,
					link_lyrics VARCHAR NULL,
                    genre TEXT DEFAULT 'Pop',
                    grouping TEXT DEFAULT 'Party Hits',
                    duration TEXT,
                    is_favorite INTEGER DEFAULT 0,
                    last_played DATETIME,
                    spotify_id TEXT
                )
            """)

            # Playlists table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS playlists (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL
                )
            """)

            # Playlist-Song Relations
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS playlist_songs (
                    playlist_id INTEGER,
                    song_id INTEGER,
                    PRIMARY KEY (playlist_id, song_id),
                    FOREIGN KEY(playlist_id) REFERENCES playlists(id),
                    FOREIGN KEY(song_id) REFERENCES songs(id)
                )
            """)

            # Default Playlist Groupings Insert
            default_groupings = [
                "Party Hits", "Duets", "Disney", "80's", "70's", "60's", "90's", "Y2K",
                "Road Trip Classics", "One-Hit Wonders", "Covers & Remakes", "Guilty Pleasures",
                "Svenska Klassiker", "Metal & Hard Rock", "Melodifestivalen & Eurovision",
                "Power Ballads", "Movie Soundtracks & Musicals", "Latin & Reggaeton Beats", "Christmas Classics"
            ]
            for g in default_groupings:
                cursor.execute("INSERT OR IGNORE INTO playlists (name) VALUES (?)", (g,))

            conn.commit()
            logger.info("SQLite Database initialized successfully.")

    def add_or_update_song(self, song_data: dict):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO songs (title, artist, genre, grouping, duration, link_inst_file, link_vocals_file, link_lyrics, spotify_id)
                VALUES (:title, :artist, :genre, :grouping, :duration, :link_inst_file, :link_vocals_file, :link_lyrics, :spotify_id)
                    genre=excluded.genre,
                    grouping=excluded.grouping
            """, song_data)
            conn.commit()

    def toggle_favorite(self, song_id: int):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE songs SET is_favorite = NOT is_favorite WHERE id = ?", (song_id,))
            conn.commit()

    def record_history(self, song_id: int):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE songs SET last_played = CURRENT_TIMESTAMP WHERE id = ?", (song_id,))
            conn.commit()