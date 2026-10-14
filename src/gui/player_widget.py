import sys
import os
import vlc
from PyQt6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel, QFrame, QSlider
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QSize


class PlayerWidget(QWidget):
    def __init__(self, main_window):
        super().__init__()
        self.main_window = main_window
        self.current_song = None
        self.is_favorite = False
        self.guide_vocal_enabled = False

        self.vlc_instance = vlc.Instance('--no-xlib')

        # Primary Media Player (Video Canvas & Instrumental Stem)
        self.media_player = self.vlc_instance.media_player_new()

        # Secondary Audio Player (Guide Vocal Stem)
        self.vocal_player = self.vlc_instance.media_player_new()

        self.timer = QTimer(self)
        self.timer.setInterval(100)
        self.timer.timeout.connect(self.sync_and_update_ui)

        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # Video Canvas
        self.video_frame = QFrame()
        self.video_frame.setStyleSheet("background-color: black; border-radius: 6px;")
        layout.addWidget(self.video_frame, stretch=5)

        if sys.platform.startswith('win'):
            self.media_player.set_hwnd(self.video_frame.winId())

        # Song Title and Guide Vocal Toggle Button Row
        info_row = QHBoxLayout()
        self.song_info_label = QLabel("*name song, *name artist")
        self.song_info_label.setStyleSheet("font-size: 15px; font-weight: bold; margin-left: 5px;")
        info_row.addWidget(self.song_info_label)

        info_row.addStretch()

        self.btn_guide_vocal = QPushButton("🎤 Guide Vocal: OFF")
        self.btn_guide_vocal.setStyleSheet(
            "background-color: #062B44; color: #888888; padding: 5px 10px; border-radius: 4px; font-weight: bold;")
        self.btn_guide_vocal.clicked.connect(self.toggle_guide_vocal)
        info_row.addWidget(self.btn_guide_vocal)

        layout.addLayout(info_row)

        # Controls Row
        ctrl_row = QHBoxLayout()

        self.play_btn = QPushButton()
        self.play_btn.setIcon(self.main_window.get_icon("start"))
        self.play_btn.setIconSize(QSize(20, 20))
        self.play_btn.clicked.connect(self.play)
        ctrl_row.addWidget(self.play_btn)

        self.pause_btn = QPushButton()
        self.pause_btn.setIcon(self.main_window.get_icon("pause"))
        self.pause_btn.setIconSize(QSize(20, 20))
        self.pause_btn.clicked.connect(self.pause)
        ctrl_row.addWidget(self.pause_btn)

        self.time_played_label = QLabel("0:00")
        ctrl_row.addWidget(self.time_played_label)

        self.seek_slider = QSlider(Qt.Orientation.Horizontal)
        self.seek_slider.setRange(0, 1000)
        self.seek_slider.setStyleSheet("""
            QSlider::groove:horizontal { height: 6px; background: #083C5E; border-radius: 3px; }
            QSlider::sub-page:horizontal { background: #27B7F5; border-radius: 3px; }
            QSlider::handle:horizontal { background: #FFFFFF; width: 14px; margin-top: -4px; margin-bottom: -4px; border-radius: 7px; }
        """)
        self.seek_slider.sliderMoved.connect(self.set_position)
        ctrl_row.addWidget(self.seek_slider)

        self.time_left_label = QLabel("-0:00")
        ctrl_row.addWidget(self.time_left_label)

        self.fav_btn = QPushButton()
        self.fav_btn.setIcon(self.main_window.get_icon("add.favorite"))
        self.fav_btn.setIconSize(QSize(22, 22))
        self.fav_btn.clicked.connect(self.toggle_favorite)
        ctrl_row.addWidget(self.fav_btn)

        layout.addLayout(ctrl_row)

    def load_and_play(self, song_info):
        self.current_song = song_info
        self.song_info_label.setText(f"{song_info['title']} - {song_info['artist']}")

        # 1. Load Video Media
        video_path = song_info["rendered_path"]
        media_video = self.vlc_instance.media_new(video_path)
        self.media_player.set_media(media_video)

        # 2. Load Guide Vocal Stem Media
        file_title = os.path.splitext(os.path.basename(song_info["raw_path"]))[0]
        vocal_stem_path = os.path.join(self.main_window.base_dir, "storage", "songs", f"{file_title}_vocals.mp3")

        if os.path.exists(vocal_stem_path):
            media_vocal = self.vlc_instance.media_new(vocal_stem_path)
            self.vocal_player.set_media(media_vocal)
            self.vocal_player.audio_set_volume(20 if self.guide_vocal_enabled else 0)

        self.play()

    def toggle_guide_vocal(self):
        self.guide_vocal_enabled = not self.guide_vocal_enabled
        if self.guide_vocal_enabled:
            self.btn_guide_vocal.setText("🎤 Guide Vocal: ON (20%)")
            self.btn_guide_vocal.setStyleSheet(
                "background-color: #007ACC; color: #FFFFFF; padding: 5px 10px; border-radius: 4px; font-weight: bold;")
            self.vocal_player.audio_set_volume(20)
        else:
            self.btn_guide_vocal.setText("🎤 Guide Vocal: OFF")
            self.btn_guide_vocal.setStyleSheet(
                "background-color: #062B44; color: #888888; padding: 5px 10px; border-radius: 4px; font-weight: bold;")
            self.vocal_player.audio_set_volume(0)

    def play(self):
        self.media_player.play()
        self.vocal_player.play()
        self.timer.start()

    def pause(self):
        self.media_player.pause()
        self.vocal_player.pause()

    def stop(self):
        self.media_player.stop()
        self.vocal_player.stop()
        self.timer.stop()

    def set_position(self, position):
        target_time = (position / 1000.0)
        self.media_player.set_position(target_time)
        self.vocal_player.set_position(target_time)

    def toggle_favorite(self):
        self.is_favorite = not self.is_favorite
        icon_name = "favorite" if self.is_favorite else "add.favorite"
        self.fav_btn.setIcon(self.main_window.get_icon(icon_name))

    def sync_and_update_ui(self):
        if not self.media_player.is_playing():
            return

        # Keep Guide Vocal Stem tight in sync with Video timeline
        video_time = self.media_player.get_time()
        vocal_time = self.vocal_player.get_time()

        if abs(video_time - vocal_time) > 80:  # >80ms drift correction
            self.vocal_player.set_time(video_time)

        media_length = self.media_player.get_length()
        if media_length > 0:
            pos = int((video_time / media_length) * 1000)
            self.seek_slider.setValue(pos)

            played_sec = video_time // 1000
            total_sec = media_length // 1000
            left_sec = max(0, total_sec - played_sec)

            self.time_played_label.setText(f"{played_sec // 60}:{played_sec % 60:02d}")
            self.time_left_label.setText(f"-{left_sec // 60}:{left_sec % 60:02d}")