import os
import sys
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QLabel, QLineEdit, QSplitter, QListWidget, QListWidgetItem, QMessageBox, QFileDialog
)
from PyQt6.QtCore import Qt, QSize
from PyQt6.QtGui import QIcon

from .library_widget import LibraryWidget
from .player_widget import PlayerWidget


class MainWindow(QMainWindow):
    def __init__(self, base_dir=r"C:\Dev\Karaoke_songs"):
        super().__init__()
        self.base_dir = base_dir
        self.raw_dir = os.path.join(base_dir, "storage", "song_data")
        self.karaoke_dir = os.path.join(base_dir, "storage", "song_lyrics")
        self.models_dir = os.path.join(base_dir, "storage", "models")

        self.icons_dir = os.path.join(os.path.dirname(__file__), "../../../src", "..", "assets", "icons")

        self.setWindowTitle("Karaoke Studio")
        self.resize(1400, 850)
        self.setStyleSheet("""
            QMainWindow { background-color: #031826; }
            QWidget { color: #FFFFFF; font-family: 'Segoe UI', Arial, sans-serif; }
            QPushButton { background-color: transparent; border: none; text-align: left; padding: 8px 12px; font-size: 15px; }
            QPushButton:hover { background-color: #062B44; border-radius: 4px; }
            QLineEdit { background-color: #042033; border: 1px solid #083C5E; border-radius: 4px; color: white; padding: 6px 10px; }
        """)

        self.queue = []
        self.nav_history = []

        self.init_ui()

    def get_icon(self, icon_name):
        path = os.path.join(self.icons_dir, f"{icon_name}.svg")
        if os.path.exists(path):
            return QIcon(path)
        return QIcon()

    def init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(5, 5, 5, 5)

        # 1. Top Navigation Menu Bar
        top_bar = QHBoxLayout()

        self.btn_app_icon = QPushButton()
        self.btn_app_icon.setIcon(self.get_icon("karaoke_studio"))
        self.btn_app_icon.setIconSize(QSize(30, 30))
        top_bar.addWidget(self.btn_app_icon)

        self.back_btn = QPushButton()
        self.back_btn.setIcon(self.get_icon("back"))
        self.back_btn.setIconSize(QSize(20, 20))
        self.back_btn.setVisible(False)
        self.back_btn.clicked.connect(self.go_back)
        top_bar.addWidget(self.back_btn)

        self.btn_home = QPushButton("Home")
        self.btn_home.setIcon(self.get_icon("home"))
        self.btn_home.clicked.connect(self.go_home)
        top_bar.addWidget(self.btn_home)

        self.btn_view = QPushButton("View")
        top_bar.addWidget(self.btn_view)

        self.btn_settings = QPushButton("Settings")
        top_bar.addWidget(self.btn_settings)

        self.btn_help = QPushButton("Help")
        self.btn_help.clicked.connect(self.show_about)
        top_bar.addWidget(self.btn_help)

        top_bar.addStretch()

        self.btn_cast = QPushButton()
        self.btn_cast.setIcon(self.get_icon("cast"))
        self.btn_cast.setIconSize(QSize(24, 24))
        top_bar.addWidget(self.btn_cast)

        main_layout.addLayout(top_bar)

        # 2. Main 3-Section Splitter Layout
        splitter = QSplitter(Qt.Orientation.Horizontal)

        # Left Sidebar (Search, Playlists, Genres, Favorites, History, Queue)
        left_sidebar = QWidget()
        left_layout = QVBoxLayout(left_sidebar)
        left_layout.setContentsMargins(0, 5, 0, 0)

        self.search_btn = QPushButton("  Search")
        self.search_btn.setIcon(self.get_icon("search"))
        self.search_btn.clicked.connect(self.toggle_search_mode)
        left_layout.addWidget(self.search_btn)

        sidebar_items = [
            ("Playlists", "queue"),
            ("Genres", "genres"),
            ("Favorites", "favorite"),
            ("History", "history"),
            ("Queue", "queue")
        ]

        for label, icon in sidebar_items:
            btn = QPushButton(f"  {label}")
            btn.setIcon(self.get_icon(icon))
            btn.clicked.connect(lambda checked, l=label: self.on_sidebar_click(l))
            left_layout.addWidget(btn)

        import_btn = QPushButton("  Import Song")
        import_btn.setIcon(self.get_icon("add.song"))
        import_btn.setStyleSheet(
            "background-color: #1DB954; color: black; font-weight: bold; border-radius: 4px; margin-top: 10px;")
        import_btn.clicked.connect(self.import_song_dialog)
        left_layout.addWidget(import_btn)

        left_layout.addStretch()
        splitter.addWidget(left_sidebar)

        # Middle Main Box (Upper = Active Video Player, Lower = Queue List)
        middle_box = QWidget()
        middle_layout = QVBoxLayout(middle_box)
        middle_layout.setContentsMargins(5, 0, 5, 0)

        self.player_widget = PlayerWidget(self)
        middle_layout.addWidget(self.player_widget, stretch=4)

        # Queue Section
        queue_header = QLabel("Queue")
        queue_header.setStyleSheet("font-size: 16px; font-weight: bold; margin-top: 5px;")
        middle_layout.addWidget(queue_header)

        self.queue_list = QListWidget()
        self.queue_list.setStyleSheet("background-color: #042033; border-radius: 6px; padding: 5px;")
        middle_layout.addWidget(self.queue_list, stretch=2)

        splitter.addWidget(middle_box)

        # Right Sidebar (Selected Playlist / Songs / Search Results Table)
        self.library_widget = LibraryWidget(self)
        splitter.addWidget(self.library_widget)

        splitter.setSizes([180, 720, 500])
        main_layout.addWidget(splitter)

    def toggle_search_mode(self):
        self.push_nav_history()
        self.library_widget.enable_search_mode()

    def on_sidebar_click(self, category):
        self.push_nav_history()
        self.library_widget.show_category(category)

    def push_nav_history(self):
        self.nav_history.append("view")
        self.back_btn.setVisible(True)

    def go_back(self):
        if self.nav_history:
            self.nav_history.pop()
            if not self.nav_history:
                self.back_btn.setVisible(False)
            self.library_widget.show_default_view()

    def go_home(self):
        self.nav_history.clear()
        self.back_btn.setVisible(False)
        self.library_widget.show_default_view()


    def add_song_to_queue(self, song_info):
        self.queue.append(song_info)
        idx = len(self.queue)
        item_str = f"#{idx}  |  {song_info['title']}  -  {song_info['artist']}"
        self.queue_list.addItem(QListWidgetItem(item_str))

        if self.player_widget.current_song is None:
            self.play_next_in_queue()

    def play_next_in_queue(self):
        if self.queue:
            song = self.queue.pop(0)
            self.queue_list.takeItem(0)
            for i in range(self.queue_list.count()):
                item = self.queue_list.item(i)
                parts = item.text().split("|", 1)
                if len(parts) > 1:
                    item.setText(f"#{i + 1} |{parts[1]}")

            self.player_widget.load_and_play(song)

    def show_about(self):
        QMessageBox.about(
            self,
            "About Karaoke Studio",
            "<h3>Karaoke Studio v1.0</h3>"
            "<p><b>Author:</b> Sandra van Buggenum | SnowY4you</p>"
            "<p>An AI-powered desktop karaoke application featuring automated vocal separation, "
            "WhisperX timestamp synchronization, and synchronized bouncing ball lyrics.</p>"
        )