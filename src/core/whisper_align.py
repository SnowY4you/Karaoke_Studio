import torch
import whisperx
import logging

logger = logging.getLogger("KaraokeStudio.LyricAligner")


class LyricAligner:
    def __init__(self, model_size: str = "base", device: str = None, compute_type: str = "float16"):
        self.device = device if device else ("cuda" if torch.cuda.is_available() else "cpu")
        self.compute_type = compute_type if self.device == "cuda" else "int8"
        self.model_size = model_size

        logger.info(f"Loading Whisper model ({self.model_size}) on device: {self.device}")
        self.whisper_model = whisperx.load_model(
            self.model_size, self.device, compute_type=self.compute_type
        )
        self.align_cache = {}

    def transcribe_and_align(self, vocal_audio_path: str) -> dict:
        """
        Transcribes vocal audio and performs forced word-level timestamp alignment.
        """
        logger.info(f"Transcribing vocal audio: {vocal_audio_path}")
        audio = whisperx.load_audio(vocal_audio_path)
        result = self.whisper_model.transcribe(audio, batch_size=16)
        detected_lang = result.get("language", "en")

        logger.info(f"Language detected: '{detected_lang}'. Aligning phonemes...")

        if detected_lang not in self.align_cache:
            align_model, metadata = whisperx.load_align_model(
                language_code=detected_lang, device=self.device
            )
            self.align_cache[detected_lang] = (align_model, metadata)
        else:
            align_model, metadata = self.align_cache[detected_lang]

        aligned_result = whisperx.align(
            result["segments"],
            align_model,
            metadata,
            audio,
            self.device,
            return_char_alignments=False
        )

        logger.info("Lyric alignment completed successfully.")
        return aligned_result