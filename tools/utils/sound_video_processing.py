import os
import sys
import glob
import re
import random
import torch
import whisperx
import numpy as np
from audio_separator.separator import Separator
from moviepy.editor import (
    VideoFileClip, AudioFileClip, TextClip, CompositeVideoClip, VideoClip, concatenate_videoclips, ColorClip
)

# ----------------------------------------------------
# DIRECTORY PATH CONFIGURATIONS
# ----------------------------------------------------
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../src", "../.."))

RAW_DIR = os.path.join(BASE_DIR, "storage", "temp_storage", "raw_songs")
PROCESSED_DIR = os.path.join(BASE_DIR, "storage", "temp_storage", "processed_songs")
SONGS_STEM_DIR = os.path.join(BASE_DIR, "storage", "songs")
BG_DIR = os.path.join(BASE_DIR, "storage", "lyrics_background")
MODELS_DIR = os.path.join(BASE_DIR, "storage", "models")

for d in [RAW_DIR, PROCESSED_DIR, SONGS_STEM_DIR, BG_DIR, MODELS_DIR]:
    os.makedirs(d, exist_ok=True)


# ----------------------------------------------------
# ADVANCED FILENAME SANITIZER & CLEANER
# ----------------------------------------------------
def sanitize_filename(file_path):
    """
    Cleans metadata noise while keeping stylized names (P!nk, SNAP!) intact.
    Outputs clean 'Artist - Title.ext'.
    """
    if not os.path.exists(file_path):
        return file_path

    directory = os.path.dirname(file_path)
    base_name = os.path.basename(file_path)
    name, ext = os.path.splitext(base_name)

    # 1. Strip Spotify IDs (SpotId-xxx)
    clean_name = re.sub(r'\(SpotId-[^\)]+\)', '', name, flags=re.IGNORECASE)

    # 2. Strip Movie / Soundtrack suffixes
    clean_name = re.sub(r'-\s*From\s+_[^_]+_\s*Soundtrack', '', clean_name, flags=re.IGNORECASE)
    clean_name = re.sub(r'-\s*From\s+["\'][^"\']+["\']\s*Soundtrack', '', clean_name, flags=re.IGNORECASE)

    # 3. Strip Edit / Remix / Version tags (e.g. - 7_ Edit, - Radio Edit)
    clean_name = re.sub(r'-\s*\d+_\s*Edit', '', clean_name, flags=re.IGNORECASE)
    clean_name = re.sub(r'-\s*Radio\s+Edit', '', clean_name, flags=re.IGNORECASE)

    # 4. Strip Bracketed Official World Cup / Event Tags
    clean_name = re.sub(r'\[[^\]]*Official[^\]]*\]', '', clean_name, flags=re.IGNORECASE)
    clean_name = re.sub(r'\[[^\]]*FIFA[^\]]*\]', '', clean_name, flags=re.IGNORECASE)

    # Clean whitespace and underscores
    clean_name = re.sub(r'\s+', ' ', clean_name).strip()
    clean_name = re.sub(r'_\s*', ' ', clean_name).strip()

    new_file_path = os.path.join(directory, f"{clean_name}{ext.lower()}")

    if file_path != new_file_path:
        if os.path.exists(new_file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
            return new_file_path
        try:
            os.rename(file_path, new_file_path)
            print(f"--> [CLEANED FILENAME] {base_name}  -->  {os.path.basename(new_file_path)}")
        except Exception as e:
            print(f"Warning: Could not rename {file_path}: {e}")
            return file_path
        return new_file_path

    return file_path


# ----------------------------------------------------
# DYNAMIC BACKGROUND SHUFFLER
# ----------------------------------------------------
def get_shuffled_background(total_duration, resolution=(1920, 1080)):
    bg_files = glob.glob(os.path.join(BG_DIR, "*.mp4"))

    if not bg_files:
        print("--> [WARNING] No MP4 files found in storage/lyrics_background. Falling back to dark canvas.")
        return ColorClip(size=resolution, color=(10, 20, 40), duration=total_duration)

    random.shuffle(bg_files)
    clips = []
    accumulated_time = 0.0

    while accumulated_time < total_duration:
        for f in bg_files:
            clip = VideoFileClip(f).resize(newsize=resolution)
            clips.append(clip)
            accumulated_time += clip.duration
            if accumulated_time >= total_duration:
                break

    combined = concatenate_videoclips(clips)
    return combined.subclip(0, total_duration)


# ----------------------------------------------------
# SINGLE SONG PIPELINE
# ----------------------------------------------------
def process_single_song(input_file, separator, whisper_model, align_model_cache):
    # Step 1: Clean Filename
    input_file = sanitize_filename(input_file)
    file_title = os.path.splitext(os.path.basename(input_file))[0]

    # Processed output filename (No '_karaoke' suffix)
    output_filename = os.path.join(PROCESSED_DIR, f"{file_title}.mp4")

    if os.path.exists(output_filename):
        print(f"--> [SKIPPING] Already processed: {file_title}")
        return

    print(f"\n==================================================")
    print(f" PROCESSING: {file_title}")
    print(f"==================================================")

    # ----------------------------------------------------
    # STEP 1: AI VOCAL & INSTRUMENTAL SEPARATION
    # ----------------------------------------------------
    print("[1/4] Splitting vocals from instrumentals...")
    output_files = separator.separate(input_file)

    if isinstance(output_files, list) and len(output_files) >= 2:
        temp_inst = os.path.join(RAW_DIR, output_files[0])
        temp_vocal = os.path.join(RAW_DIR, output_files[1])
    else:
        temp_inst = os.path.join(RAW_DIR, f"{file_title}_(Instrumental).wav")
        temp_vocal = os.path.join(RAW_DIR, f"{file_title}_(Vocals).wav")

    # Stems persistent filenames
    final_inst_path = os.path.join(SONGS_STEM_DIR, f"{file_title}_inst.mp3")
    final_vocal_path = os.path.join(SONGS_STEM_DIR, f"{file_title}_vocals.mp3")

    # Export stems to storage/songs/
    AudioFileClip(temp_inst).write_audiofile(final_inst_path, logger=None)
    AudioFileClip(temp_vocal).write_audiofile(final_vocal_path, logger=None)

    print(f"--> Stems Saved:\n  Inst:  {final_inst_path}\n  Vocal: {final_vocal_path}")

    # ----------------------------------------------------
    # STEP 2: MULTI-LANGUAGE LYRIC ALIGNMENT VIA WHISPERX
    # ----------------------------------------------------
    print("[2/4] Extracting precise timestamps from vocals...")
    audio = whisperx.load_audio(temp_vocal)
    result = whisper_model.transcribe(audio, batch_size=16)

    # Language auto-detection (Swedish, Spanish, German, English, etc.)
    lang = result.get("language", "en")
    print(f"--> Detected Language: '{lang}'")

    if lang not in align_model_cache:
        model_a, metadata = whisperx.load_align_model(language_code=lang, device="cuda")
        align_model_cache[lang] = (model_a, metadata)
    else:
        model_a, metadata = align_model_cache[lang]

    aligned_result = whisperx.align(
        result["segments"],
        model_a,
        metadata,
        audio,
        "cuda",
        return_char_alignments=False
    )

    # ----------------------------------------------------
    # STEP 3: DYNAMIC VIDEO BACKGROUND COMPOSITING
    # ----------------------------------------------------
    print("[3/4] Compositing video background loops...")
    bg_audio = AudioFileClip(final_inst_path)
    raw_duration = bg_audio.duration
    countdown_seconds = 5
    total_duration = raw_duration + countdown_seconds

    bg_audio = bg_audio.set_start(countdown_seconds)
    video_canvas = get_shuffled_background(total_duration, resolution=(1920, 1080))
    video_canvas = video_canvas.set_audio(bg_audio)

    clips = [video_canvas]

    # ----------------------------------------------------
    # STEP 4: WIDGET RENDERING (COUNTDOWN, TEXT, BOUNCING BALL)
    # ----------------------------------------------------
    print("[4/4] Rendering 5s Countdown, Sync Highlights, and Bouncing Ball...")

    # KaraFun-style 5-to-1 Countdown Progress Bar
    bar_w, bar_h = 600, 36
    bar_x = (1920 - bar_w) // 2
    bar_y = 1080 // 2 - 80

    def make_countdown_frame(t):
        frame = np.zeros((1080, 1920, 4), dtype=np.uint8)
        if t >= countdown_seconds:
            return frame

        # Outer border / Dark background bar
        frame[bar_y:bar_y + bar_h, bar_x:bar_x + bar_w] = [21, 47, 79, 255]

        # Blue progress fill ([39, 183, 245])
        progress = min(max(t / countdown_seconds, 0.0), 1.0)
        fill_w = int(bar_w * (1.0 - progress))
        if fill_w > 0:
            frame[bar_y + 3:bar_y + bar_h - 3, bar_x + 3:bar_x + fill_w] = [39, 183, 245, 255]

        return frame

    countdown_bar = (
        VideoClip(make_countdown_frame, ismask=False, duration=countdown_seconds)
        .set_start(0)
        .set_position((0, 0))
    )
    clips.append(countdown_bar)

    for num in range(countdown_seconds, 0, -1):
        c_time = countdown_seconds - num
        count_digit = (
            TextClip(
                str(num),
                fontsize=46,
                color='white',
                font='Arial-Bold',
                method='label'
            )
            .set_start(c_time)
            .set_duration(1.0)
            .set_position((1920 // 2 - 12, bar_y - 6))
        )
        clips.append(count_digit)

    # Lyrics lines, highlighting, and bouncing ball
    padding_x = 200
    line_w = 1920 - padding_x

    for segment in aligned_result["segments"]:
        orig_start = segment.get("start")
        orig_end = segment.get("end")
        line_text = segment.get("text", "").strip()

        if not line_text or "words" not in segment or orig_start is None or orig_end is None:
            continue

        start_line = orig_start + countdown_seconds
        end_line = orig_end + countdown_seconds

        # Inactive Base Line (#FAFAFA text fill with #152F4F stroke)
        base_line = (
            TextClip(
                line_text,
                fontsize=52,
                color='#FAFAFA',
                font='Arial-Bold',
                stroke_color='#152F4F',
                stroke_width=3,
                method='caption',
                size=(line_w, None)
            )
            .set_start(start_line)
            .set_end(end_line)
            .set_position(('center', 1080 - 240))
        )
        clips.append(base_line)

        valid_words = [w for w in segment["words"] if "start" in w and "end" in w]
        num_words = len(valid_words)
        if num_words == 0:
            continue

        word_x_positions = np.linspace(padding_x // 2 + 60, 1920 - (padding_x // 2) - 60, num_words)

        for i, word in enumerate(valid_words):
            w_start = word["start"] + countdown_seconds
            w_end = word["end"] + countdown_seconds
            w_dur = max(w_end - w_start, 0.05)

            sx = word_x_positions[i - 1] if i > 0 else word_x_positions[0] - 60
            ex = word_x_positions[i]

            # Active Word Highlight (#27B7F5 fill with #152F4F stroke)
            word_highlight = (
                TextClip(
                    word["word"],
                    fontsize=52,
                    color='#27B7F5',
                    font='Arial-Bold',
                    stroke_color='#152F4F',
                    stroke_width=3,
                    method='label'
                )
                .set_start(w_start)
                .set_end(w_end)
                .set_position((ex - 30, 1080 - 240))
            )
            clips.append(word_highlight)

            # Blue Bouncing Ball Arc ([39, 183, 245])
            def make_bounce_frame(t, start_x=sx, end_x=ex, dur=w_dur):
                progress = min(max(t / dur, 0.0), 1.0)
                curr_x = int(start_x + (end_x - start_x) * progress)
                arc_y = int(50 * 4 * progress * (1.0 - progress))
                curr_y = int(1080 - 270 - arc_y)

                frame = np.zeros((1080, 1920, 4), dtype=np.uint8)
                r = 14
                y_idx, x_idx = np.ogrid[:1080, :1920]
                dist_sq = (x_idx - curr_x) ** 2 + (y_idx - curr_y) ** 2
                mask = dist_sq <= r ** 2

                frame[mask] = [39, 183, 245, 255]
                return frame

            bounce_dot = (
                VideoClip(make_bounce_frame, ismask=False, duration=w_dur)
                .set_start(w_start)
                .set_end(w_end)
                .set_position((0, 0))
            )
            clips.append(bounce_dot)

    final_video = CompositeVideoClip(clips)
    final_video.write_videofile(
        output_filename,
        fps=24,
        codec="libx264",
        audio_codec="aac",
        threads=4,
        logger=None
    )

    bg_audio.close()
    video_canvas.close()

    # Cleanup temporary WAV stems from temp folder
    for temp_stem in [temp_inst, temp_vocal]:
        if os.path.exists(temp_stem):
            try:
                os.remove(temp_stem)
            except Exception as e:
                print(f"Warning: Clean-up skipped file {temp_stem}: {e}")

    print(f"--> [SUCCESS] Rendered track saved to: {output_filename}")


def main():
    if not torch.cuda.is_available():
        print("ERROR: NVIDIA GPU (CUDA) not accessible via PyTorch. Terminating.")
        sys.exit(1)

    extensions = ('*.mp3', '*.mp4', '*.wav', '*.m4a')
    raw_files = []
    for ext in extensions:
        raw_files.extend(glob.glob(os.path.join(RAW_DIR, ext)))

    if not raw_files:
        print(f"No valid audio/video tracks found in {RAW_DIR}.")
        return

    songs_to_process = [sanitize_filename(f) for f in raw_files]
    print(f"Found {len(songs_to_process)} track(s) waiting in queue pipeline.")

    separator = Separator(output_dir=RAW_DIR, model_file_dir=MODELS_DIR)
    separator.load_model(model_filename='UVR-MDX-NET-Inst_HQ_3.onnx')

    whisper_model = whisperx.load_model("base", "cuda", compute_type="float16")
    align_model_cache = {}

    for index, song_path in enumerate(songs_to_process, 1):
        print(f"\nProcessing Task Queue: [{index}/{len(songs_to_process)}]")
        try:
            process_single_song(song_path, separator, whisper_model, align_model_cache)
        except Exception as err:
            print(f"!! FAILED processing on track {song_path}: {err}")

    print("\nAll operations completed successfully.")


if __name__ == "__main__":
    main()