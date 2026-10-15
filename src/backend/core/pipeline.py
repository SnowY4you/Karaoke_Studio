# End-to-end processing pipeline

import os
import logging
from .separator import AudioStemSeparator
from .whisper_align import LyricAligner
from .renderer import KaraokeVideoRenderer

logger = logging.getLogger("KaraokeStudio.Pipeline")

class KaraokePipeline:
    def __init__(self, raw_dir: str, models_dir: str, karaoke_dir: str):
        self.raw_dir = raw_dir
        self.models_dir = models_dir
        self.karaoke_dir = karaoke_dir

        self.separator = AudioStemSeparator(raw_dir=self.raw_dir, models_dir=self.models_dir)
        self.aligner = LyricAligner()
        self.renderer = KaraokeVideoRenderer()

    def process_song(self, raw_filepath: str, progress_callback=None) -> str:
        """
        Full end-to-end execution pipeline.
        """
        file_title = os.path.splitext(os.path.basename(raw_filepath))[0]
        output_filename = os.path.join(self.karaoke_dir, f"{file_title}_karaoke.mp4")

        if os.path.exists(output_filename):
            logger.info(f"Target track already exists: {output_filename}")
            return output_filename

        # Step 1: Vocal Separation
        if progress_callback: progress_callback("Splitting Vocals & Instrumentals...")
        inst_path, vocal_path = self.separator.separate_stems(raw_filepath)

        # Step 2: Lyric Alignment
        if progress_callback: progress_callback("Transcribing & Aligning Lyrics...")
        alignment_data = self.aligner.transcribe_and_align(vocal_path)

        # Step 3: Video Rendering
        if progress_callback: progress_callback("Rendering Karaoke Video...")
        self.renderer.render(
            raw_input_file=raw_filepath,
            instrumental_path=inst_path,
            alignment_data=alignment_data,
            output_filename=output_filename
        )

        # Clean intermediate WAV stems
        for stem in [inst_path, vocal_path]:
            if os.path.exists(stem):
                try: os.remove(stem)
                except Exception as e: logger.warning(f"Failed to delete stem {stem}: {e}")

        if progress_callback: progress_callback("Done!")
        return output_filename