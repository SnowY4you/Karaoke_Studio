import os
import glob
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QLabel, QPushButton, QMessageBox, QLineEdit, QHeaderView, QFrame
)
from PyQt6.QtCore import Qt


class LibraryWidget(QWidget):
    def __init__(self, main_window):
        super().__init__()
        self.main_window = main_window
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(5, 5, 5, 5)

        # Header Title / Active View Label
        self.title_label = QLabel("*Name of list selected")
        self.title_label.setStyleSheet("font-size: 16px; font-weight: bold; color: #FFFFFF;")
        layout.addWidget(self.title_label)

        # Dynamic Search Bar (Triggers when clicking search or typing in search mode)
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("🔍 song, artist")
        self.search_input.setStyleSheet(
            "background-color: #042033; border: 1px solid #083C5E; border-radius: 4px; padding: 6px;")
        self.search_input.textChanged.connect(self.filter_songs)
        self.search_input.setVisible(False)
        layout.addWidget(self.search_input)

        # Song List Table (Title, Artist, Duration, Last Played)
        self.table = QTableWidget()
        self.table.setColumnCount(4)
        self.table.setHorizontalHeaderLabels(["Title", "Artist", "Duration", "Last Played"])
        self.table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.table.setStyleSheet("""
            QTableWidget { background-color: #042033; gridline-color: #083C5E; border-radius: 6px; }
            QHeaderView::section { background-color: #062B44; color: white; padding: 6px; font-weight: bold; border: none; }
            QTableWidget::item { padding: 6px; }
            QTableWidget::item:selected { background-color: #007ACC; color: white; }
        """)
        self.table.doubleClicked.connect(self.add_selected_to_queue)
        layout.addWidget(self.table)

        # Bottom Action Bar
        btn_layout = QHBoxLayout()
        self.btn_process = QPushButton("Build AI Track")
        self.btn_process.setStyleSheet("background-color: #007ACC; font-weight: bold; padding: 8px;")
        self.btn_process.clicked.connect(self.process_selected)

        self.btn_add_queue = QPushButton("Add to Queue")
        self.btn_add_queue.setStyleSheet("background-color: #FF9800; color: black; font-weight: bold; padding: 8px;")
        self.btn_add_queue.clicked.connect(self.add_selected_to_queue)

        btn_layout.addWidget(self.btn_process)
        btn_layout.addWidget(self.btn_add_queue)
        layout.addLayout(btn_layout)

        self.refresh_library()

    def enable_search_mode(self):
        self.search_input.setVisible(True)
        self.search_input.setFocus()
        self.title_label.setText("Search Songs & Artists")

    def refresh_library(self):
        self.table.setRowCount(0)
        raw_files = glob.glob(os.path.join(self.main_window.raw_dir, "*.*"))

        for row_idx, path in enumerate(raw_files):
            file_name = os.path.basename(path)
            title = os.path.splitext(file_name)[0]
            rendered_path = os.path.join(self.main_window.karaoke_dir, f"{title}_karaoke.mp4")

            is_ready = os.path.exists(rendered_path)
            status_tag = " [Ready]" if is_ready else " [Raw]"

            self.table.insertRow(row_idx)

            title_item = QTableWidgetItem(f"{title}{status_tag}")
            artist_item = QTableWidgetItem("Unknown Artist")
            duration_item = QTableWidgetItem("03:45")
            last_played_item = QTableWidgetItem("Never")

            song_data = {
                "title": title,
                "artist": "Unknown Artist",
                "raw_path": path,
                "rendered_path": rendered_path if is_ready else None,
                "is_ready": is_ready
            }
            title_item.setData(Qt.ItemDataRole.UserRole, song_data)

            self.table.setItem(row_idx, 0, title_item)
            self.table.setItem(row_idx, 1, artist_item)
            self.table.setItem(row_idx, 2, duration_item)
            self.table.setItem(row_idx, 3, last_played_item)

    def filter_songs(self, query):
        query_str = query.lower()
        for row in range(self.table.rowCount()):
            title_item = self.table.item(row, 0)
            artist_item = self.table.item(row, 1)
            match = query_str in title_item.text().lower() or query_str in artist_item.text().lower()
            self.table.setRowHidden(row, not match)

    def show_category(self, category):
        self.search_input.setVisible(False)
        self.title_label.setText(f"*Selected: {category}")
        for row in range(self.table.rowCount()):
            self.table.setRowHidden(row, False)

    def show_default_view(self):
        self.search_input.setVisible(False)
        self.title_label.setText("*Name of list selected")
        for row in range(self.table.rowCount()):
            self.table.setRowHidden(row, False)

    def get_selected_song_data(self):
        if self.table.currentRow() < 0:
            return None
        first_item = self.table.item(self.table.currentRow(), 0)
        return first_item.data(Qt.ItemDataRole.UserRole)

    def add_selected_to_queue(self):
        song_data = self.get_selected_song_data()
        if not song_data:
            return

        if not song_data["is_ready"]:
            QMessageBox.warning(self, "Track Not Ready",
                                "Click 'Build AI Track' first to process lyrics and instrumental stems.")
            return

        self.main_window.add_song_to_queue(song_data)

    def process_selected(self):
        song_data = self.get_selected_song_data()
        if not song_data:
            QMessageBox.warning(self, "Select Song", "Please select a song from the right table first.")
            return

        raw_path = song_data["raw_path"]

        from .worker import ProcessingWorker
        self.worker = ProcessingWorker(
            raw_path=raw_path,
            raw_dir=self.main_window.raw_dir,
            models_dir=self.main_window.models_dir,
            karaoke_dir=self.main_window.karaoke_dir
        )
        self.worker.progress_signal.connect(lambda msg: self.title_label.setText(f"Processing: {msg}"))
        self.worker.finished_signal.connect(self.on_build_finished)
        self.worker.error_signal.connect(self.on_build_error)
        self.worker.start()

    def on_build_finished(self, title, output_path):
        QMessageBox.information(self, "Success", f"AI Track successfully built for: {title}")
        self.refresh_library()

    def on_build_error(self, title, err):
        QMessageBox.critical(self, "Error", f"Failed building AI track {title}:\n{err}")
        self.refresh_library()