import os
import requests
import logging
from PyQt6.QtWidgets import QProgressDialog
from PyQt6.QtCore import Qt

logger = logging.getLogger("KaraokeStudio.Downloader")

REQUIRED_MODELS = {
    "UVR-MDX-NET-Inst_HQ_3.onnx": "https://github.com/TRM-O/audio-separator-models/releases/download/v1.0.0/UVR-MDX-NET-Inst_HQ_3.onnx"
}


def ensure_model_weights(models_dir: str, parent_widget=None):
    os.makedirs(models_dir, exist_ok=True)

    for filename, url in REQUIRED_MODELS.items():
        filepath = os.path.join(models_dir, filename)
        if not os.path.exists(filepath):
            logger.info(f"Model missing: {filename}. Starting download...")

            progress = QProgressDialog(f"Downloading required AI model ({filename})...", "Cancel", 0, 100,
                                       parent_widget)
            progress.setWindowModality(Qt.WindowModality.WindowModal)
            progress.show()

            response = requests.get(url, stream=True)
            total_length = response.headers.get('content-length')

            if total_length is None:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
            else:
                dl = 0
                total_length = int(total_length)
                with open(filepath, 'wb') as f:
                    for data in response.iter_content(chunk_size=4096):
                        dl += len(data)
                        f.write(data)
                        done = int(100 * dl / total_length)
                        progress.setValue(done)
                        if progress.wasCanceled():
                            break
            progress.close()