import os
import logging
import numpy as np
from moviepy.editor import (
    ColorClip, AudioFileClip, TextClip, CompositeVideoClip, VideoFileClip, VideoClip
)

logger = logging.getLogger("KaraokeStudio.Renderer")


class KaraokeVideoRenderer:
    def __init__(self, resolution=(1920, 1080), fps=24, countdown_seconds=5):
        self.width, self.height = resolution
        self.fps = fps
        self.countdown_seconds = countdown_seconds

    def render(self, raw_input_file: str, instrumental_path: str, alignment_data: dict, output_filename: str):
        logger.info(f"Rendering video overlay to: {output_filename}")

        bg_audio = AudioFileClip(instrumental_path)
        raw_duration = bg_audio.duration
        total_duration = raw_duration + self.countdown_seconds

        # Offset instrumental audio by countdown lead-in duration
        bg_audio = bg_audio.set_start(self.countdown_seconds)

        # 1. Base Video Canvas Creation
        if raw_input_file.lower().endswith('.mp4'):
            base_canvas = (
                VideoFileClip(raw_input_file)
                .subclip(0, raw_duration)
                .set_start(self.countdown_seconds)
            )
            lead_in_canvas = ColorClip(size=(self.width, self.height), color=(10, 20, 40),
                                       duration=self.countdown_seconds)
            video_canvas = CompositeVideoClip([lead_in_canvas, base_canvas]).set_duration(total_duration)
        else:
            video_canvas = ColorClip(size=(self.width, self.height), color=(10, 20, 40), duration=total_duration)

        video_canvas = video_canvas.set_audio(bg_audio)
        clips = [video_canvas]

        # 2. Add Countdown Bar & Number (KaraFun style from timer_to_start_sing.png)
        bar_w, bar_h = 600, 40
        bar_x = (self.width - bar_w) // 2
        bar_y = self.height // 2 - 100

        def make_countdown_frame(t):
            frame = np.zeros((self.height, self.width, 4), dtype=np.uint8)
            if t >= self.countdown_seconds:
                return frame

            # Outer border / Dark background bar
            frame[bar_y:bar_y + bar_h, bar_x:bar_x + bar_w] = [30, 30, 30, 255]

            # Progress fill (Blue)
            progress = min(max(t / self.countdown_seconds, 0.0), 1.0)
            fill_w = int(bar_w * (1.0 - progress))
            if fill_w > 0:
                frame[bar_y + 4:bar_y + bar_h - 4, bar_x + 4:bar_x + fill_w] = [0, 162, 255, 255]

            return frame

        countdown_bar_clip = (
            VideoClip(make_countdown_frame, ismask=False, duration=self.countdown_seconds)
            .set_start(0)
            .set_position((0, 0))
        )
        clips.append(countdown_bar_clip)

        # Numbers counting down 5 to 1 centered over the bar
        for num in range(self.countdown_seconds, 0, -1):
            countdown_time = self.countdown_seconds - num
            count_text = (
                TextClip(
                    str(num),
                    fontsize=50,
                    color='white',
                    font='Arial-Bold',
                    method='label'
                )
                .set_start(countdown_time)
                .set_duration(1.0)
                .set_position((self.width // 2 - 15, bar_y - 8))
            )
            clips.append(count_text)

        # 3. Lyrics Lines, Word Highlighting, and Bouncing Ball
        padding_x = 200
        line_w = self.width - padding_x
        segments = alignment_data.get("segments", [])

        for segment in segments:
            orig_start = segment.get("start")
            orig_end = segment.get("end")
            line_text = segment.get("text", "").strip()

            if not line_text or "words" not in segment or orig_start is None or orig_end is None:
                continue

            start_line = orig_start + self.countdown_seconds
            end_line = orig_end + self.countdown_seconds

            # Render Inactive Base Lyric Line
            lyric_clip = (
                TextClip(
                    line_text,
                    fontsize=52,
                    color='white',
                    font='Arial-Bold',
                    method='caption',
                    size=(line_w, None)
                )
                .set_start(start_line)
                .set_end(end_line)
                .set_position(('center', self.height - 240))
            )
            clips.append(lyric_clip)

            valid_words = [w for w in segment["words"] if "start" in w and "end" in w]
            num_words = len(valid_words)
            if num_words == 0:
                continue

            word_x_positions = np.linspace(padding_x // 2 + 60, self.width - (padding_x // 2) - 60, num_words)

            # Draw word highlights & bouncing ball trajectory
            for i, word in enumerate(valid_words):
                w_start = word["start"] + self.countdown_seconds
                w_end = word["end"] + self.countdown_seconds
                w_dur = max(w_end - w_start, 0.05)

                sx = word_x_positions[i - 1] if i > 0 else word_x_positions[0] - 60
                ex = word_x_positions[i]

                # Highlight active word text in cyan
                word_highlight = (
                    TextClip(
                        word["word"],
                        fontsize=52,
                        color='cyan',
                        font='Arial-Bold',
                        method='label'
                    )
                    .set_start(w_start)
                    .set_end(w_end)
                    .set_position((ex - 30, self.height - 240))
                )
                clips.append(word_highlight)

                # Bouncing Pink Ball
                def make_bounce_frame(t, start_x=sx, end_x=ex, dur=w_dur):
                    progress = min(max(t / dur, 0.0), 1.0)
                    curr_x = int(start_x + (end_x - start_x) * progress)
                    arc_y = int(50 * 4 * progress * (1.0 - progress))
                    curr_y = int(self.height - 270 - arc_y)

                    frame = np.zeros((self.height, self.width, 4), dtype=np.uint8)
                    r = 14
                    y_idx, x_idx = np.ogrid[:self.height, :self.width]
                    dist_sq = (x_idx - curr_x) ** 2 + (y_idx - curr_y) ** 2
                    mask = dist_sq <= r ** 2

                    frame[mask] = [255, 0, 128, 255]
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
            fps=self.fps,
            codec="libx264",
            audio_codec="aac",
            threads=4,
            logger=None
        )

        bg_audio.close()
        video_canvas.close()
        logger.info("Video rendering completed successfully.")