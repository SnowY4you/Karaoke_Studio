from PyQt6.QtCore import QThread, pyqtSignal


class ProcessingWorker(QThread):
    progress_signal = pyqtSignal(str)
    finished_signal = pyqtSignal(str, str)  # song_title, output_filepath
    error_signal = pyqtSignal(str, str)     # song_title, error_message

    def __init__(self, raw_path, raw_dir, models_dir, karaoke_dir):
        super().__init__()
        self.raw_path = raw_path
        self.raw_dir = raw_dir
        self.models_dir = models_dir
        self.karaoke_dir = karaoke_dir

    def run(self):
        try:
            from ..core.pipeline import KaraokePipeline
            pipeline = KaraokePipeline(
                raw_dir=self.raw_dir,
                models_dir=self.models_dir,
                karaoke_dir=self.karaoke_dir
            )

            output_file = pipeline.process_song(
                self.raw_path,
                progress_callback=lambda msg: self.progress_signal.emit(msg)
            )

            import os
            title = os.path.splitext(os.path.basename(self.raw_path))[0]
            self.finished_signal.emit(title, output_file)

        except Exception as e:
            import os
            title = os.path.splitext(os.path.basename(self.raw_path))[0]
            self.error_signal.emit(title, str(e))