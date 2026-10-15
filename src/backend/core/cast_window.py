import sys
import vlc
from PyQt6.QtWidgets import QMainWindow, QFrame, QVBoxLayout, QWidget, QApplication
from PyQt6.QtCore import Qt


class CastWindow(QMainWindow):
    def __init__(self, vlc_instance):
        super().__init__()
        self.vlc_instance = vlc_instance
        self.setWindowTitle("Karaoke Studio - TV Lyrics Display")

        self.video_frame = QFrame()
        self.video_frame.setStyleSheet("background-color: black;")

        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addWidget(self.video_frame)

        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

    def attach_to_player(self, media_player):
        if sys.platform.startswith('win'):
            media_player.set_hwnd(self.video_frame.winId())

    def open_on_second_screen(self):
        screens = QApplication.screens()
        if len(screens) > 1:
            # Move to Monitor 2
            screen2 = screens[1]
            geom = screen2.geometry()
            self.move(geom.x(), geom.y())
            self.showFullScreen()
        else:
            # Fallback to borderless window on Monitor 1
            self.showNormal()