import os
import logging
from audio_separator.separator import Separator

logger = logging.getLogger("KaraokeStudio.Separator")

class AudioStemSeparator:
    def __init__(self, raw_dir: str, models_dir: str, model_filename: str = "UVR-MDX-NET-Inst_HQ_3.onnx"):
        self.raw_dir = raw_dir
        self.models_dir = models_dir
        self.model_filename = model_filename
        os.makedirs(self.raw_dir, exist_ok=True)
        os.makedirs(self.models_dir, exist_ok=True)

        logger.info(f"Initializing Separator with model dir: {models_dir}")
        self.separator = Separator(output_dir=self.raw_dir, model_file_dir=self.models_dir)
        self.separator.load_model(model_filename=self.model_filename)

    def separate_stems(self, input_file: str) -> tuple[str, str]:
        """
        Splits input audio/video file into instrumental and vocal WAV stems.
        Returns tuple: (instrumental_filepath, vocal_filepath)
        """
        logger.info(f"Starting vocal separation on: {input_file}")
        base_title = os.path.splitext(os.path.basename(input_file))[0]
        output_files = self.separator.separate(input_file)

        if isinstance(output_files, list) and len(output_files) >= 2:
            inst_path = os.path.join(self.raw_dir, output_files[0])
            vocal_path = os.path.join(self.raw_dir, output_files[1])
        else:
            inst_path = os.path.join(self.raw_dir, f"{base_title}_(Instrumental).wav")
            vocal_path = os.path.join(self.raw_dir, f"{file_title}_(Vocals).wav")

        if not os.path.exists(inst_path) or not os.path.exists(vocal_path):
            raise FileNotFoundError(f"Separation failed to generate stems for {base_title}")

        logger.info(f"Stems generated successfully:\n  Inst: {inst_path}\n  Vocal: {vocal_path}")
        return inst_path, vocal_path