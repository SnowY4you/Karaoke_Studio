# Karaoke Studio 🎤

## 📊 Overview

An AI-powered Windows Desktop Karaoke application featuring automated vocal stem isolation, WhisperX timestamp synchronization, bouncing ball lyric trajectories, and comprehensive song queue management.

---

## Version

---

## 🎯 Objectives & Key Features

### 1. Automated Vocal Separation

Isolate background instrumentals from lead vocals using state-of-the-art deep learning architectures.

- **AI Audio Isolation:** Leverages models like Demucs or BS-Roformer to split full stereo mixes into clean instrumental backings and isolated vocal stems.
- **Stem Storage & Caching:** Automatically exports and caches separated audio stems locally (instrumental.mp3 and vocals.mp3) in the storage directory for rapid offline reuse.

### 2. Phoneme-Level Lyric Alignment

Generate hyper-accurate, word-by-word timestamps for seamless synchronization during performance.

- **WhisperX Forced Alignment:** Employs forced alignment powered by Wav2Vec2 phoneme models to align lyrics down to millisecond precision.
- **Automated Fallback:** Automatically falls back to online synced LRC fetching via LRCLIB or manual text parsing when AI forced alignment is unavailable.

### 3. Progressive Color-Shifting Lyrics

Provide high-visibility, line-by-line highlighted lyric displays tailored for live performance environments.

- **Dynamic Line Highlighting:** Sweeps custom fill gradients across text lines in real time based on active word audio timestamps.
- **Dual-Line Rendering:** Displays the active singing line alongside a preview of the upcoming line to give performers clear contextual lead-time.

### 4. Dynamic Bouncing Ball Overlay

Render smooth, physics-guided visual trajectories overlaid on active lyric text.

- **Arc Trajectory Rendering:** Animates a bouncing ball along parabolic Bézier arcs between adjacent word coordinates based on phoneme start and end timings.
- **Customizable Visuals:** Features configurable ball speeds, glow effects, and visual themes layered directly over the background video.

### 5. 5-Second Lead-In Countdown

Ensure smooth song transitions and timing cues.

- **Intro Cue Indicator:** Displays a 5-second countdown timer or visual beat indicators prior to the entry of the first vocal line.
- **Instrumental Bridge Cues:** Automatically triggers countdown indicators during long instrumental breaks so singers never miss a verse re-entry.

### 6. Comprehensive Library & Queue Management

Organize and control track playback via a robust local data layer.

- **SQLite Database:** Indexed metadata store tracking titles, artists, genres, durations, release years, and play counts.
- **Smart Queue & Playlists:** Supports drag-and-drop song queuing, favorite tagging, genre filtering, and instant search across thousands of tracks.

### 7. Hardware-Accelerated Playback Engine

Deliver low-latency, high-performance audio and video rendering.

- **libVLC Media Engine:** Built-in hardware-accelerated playback driving dynamic MP4 background videos and multi-track audio without frame drops or stutter.
- **Layered Architecture:** Decouples video backgrounds, audio stems, and lyric canvas overlays into independent real-time rendering layers.

### 8. Optional Guide Vocals

Provide an on-demand reference track to assist singers with pitch, melody, and confidence.

**On-Demand Toggle:** Instantly toggle reference vocals on or off via a single UI button during active playback.

- **Assistance vs. Solo Mode:** When enabled, the isolated vocal stem plays softly at reduced volume (30%) alongside the instrumental; when disabled, vocals drop out completely for a true solo performance.
- **Smooth Audio Crossfading:** Uses non-destructive gain ramping over 100ms to switch guide volume levels cleanly without audible clicks or pops.

### 9. Multi-Display & Stage View Support

Optimize output distribution for home karaoke setups, stages, and dual-monitor environments.

- **Full-Screen Stage Mode:** Projects background video, lyrics, and bouncing ball overlays to an external TV or projector.
- **Kiosk Control Panel:** Keeps library search, queue management, and playback controls on the primary monitor for smooth host operation.

---

## 🛠️ Technical Implementation & Architecture

```plaintext
┌───────────────────────────────────────────────────────────────────────────────────┐
│  4. UI / Bouncing Ball Layer / Color-Shifting Text (Canvas / Overlay / WebGL)     │ <-- Top Layer
├───────────────────────────────────────────────────────────────────────────────────┤
│  3. Lyrics / Typography Layer (LRC Parser & Text Renderer)                        │
├───────────────────────────────────────────────────────────────────────────────────┤
│  2. Video Background Layer (HTML5 Video / MP4 / GPU Shaders)                      │ <-- Middle Layer
├───────────────────────────────────────────────────────────────────────────────────┤
│  1. Audio Layer (Vocals / Instrumental Stems)                                     │ <-- Base Engine
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Audio Layer (Base Engine):

Manages playback of the instrumental track (`.mp3`, `.flac`, `.wav`) alongside the parallel guide vocal track. Handles non-destructive gain control for real-time volume adjustments and crossfading.

#### 2. Video Background Layer (Visuals):

A dedicated video player element running at the base of the visual stack (looped MP4 clips, dynamic shaders, or visualizer effects). Because it is decoupled from the audio engine, backgrounds can be swapped, randomized, or themed dynamically without impacting audio sync or lyric rendering.

#### 3. Lyrics & Typography Layer (LRC Parser & Text Renderer):

Parses synced `LRC `or `YAML `datasets (e.g., <span style="color:cyan">[00:14.50] Don't stop believin'</span>). It matches real-time playback positioning against timestamps to render active text lines and apply progressive gradient sweeps across characters.

#### 4. UI & Bouncing Ball Layer (Widget Canvas):

A high-performance graphic renderer (utilizing `HTML5 Canvas`, `WebGL`, or `Pygame`) acting as the topmost overlay.

- **Clock Synchronization:** Continuously polls the current playback time from the audio engine (e.g., <span style="color:cyan">currentTime = 14.52s</span>)).
- **Bouncing Ball Widget:** Mathematically animates the ball using interpolation curves (<span style="color:cyan">linear</span> or <span style="color:cyan">ease-in-out</span>) mapped across word coordinate boundaries derived from phoneme start and end timestamps.

---

## 🚀 Key Strengths & Skills Demonstrated

---

## 📁 Project Structure

```
Karaoke_Studio/
├── .github
│   └── workflows
│       └── pytest_coverage.yml
├── README.md
├── assets															# 
│   └── icons														# Icons for the UI
│       ├── add.favorite.svg
│       ├── add.song.svg
│       ├── back.svg
│       ├── backwards.svg
│       ├── cast.svg
│       ├── forward.svg
│       ├── genres.svg
│       ├── history.svg
│       ├── home.svg
│       ├── karaoke_studio.svg
│       ├── microphone.svg
│       ├── pause.svg
│       ├── queue.svg
│       ├── search.svg
│       ├── settings.svg
│       ├── start.svg
│       ├── stop.svg
│       └── window.svg
├── config															# Configuration files
│   ├── config.py													# Directory configuration 
│   ├── package.json												# 
│   └── settings.json												# 
├── main.py
├── requirements.txt
├── src
│   ├── __init__.py
│   ├── core
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── pipeline.py
│   │   ├── renderer.py
│   │   ├── separator.py
│   │   └── whisper_align.py
│   ├── gui
│   │   ├── __init__.py
│   │   ├── cast_window.py
│   │   ├── library_widget.py
│   │   ├── main_window.py
│   │   ├── player_widget.py
│   │   └── worker.py
│   └── utils
│       ├── .cache
│       ├── __init__.py
│       ├── classifier.py
│       ├── downloader.py
│       ├── get_song_info.py
│       ├── logger.py
│       ├── metadata.py
│       └── sound_video_processing.py
└── storage
    ├── cache
    │   └── .gitkeep
    ├── logs
    │   └── .gitkeep
    ├── lyrics_background
    │   ├── lyrics_background_1.mp4
    │   ├── lyrics_background_2.mp4
    │   ├── lyrics_background_3.mp4
    │   ├── lyrics_background_4.mp4
    │   ├── lyrics_background_5.mp4
    │   └── lyrics_background_6.mp4
    ├── models
    │   ├── .gitkeep
    │   └── UVR-MDX-NET-Inst_HQ_3.onnx
    ├── song_data
    │   └── .gitkeep
    ├── song_lyrics
    ├── songs
    └── temp_storage
        ├── lyrics
        ├── processed_songs
        └── raw_songs
            ├── 4 Non Blondes - What's Up_ (SpotId-HhZEm).lrc
            ├── 4 Non Blondes - What's Up_ (SpotId-HhZEm).mp3
            ├── 4 Non Blondes - What's Up_.lrc
            ├── 4 Non Blondes - What's Up_.mp3
            ├── 50 Cent - In Da Club (SpotId-LOLZ8).lrc
            ├── 50 Cent - In Da Club (SpotId-LOLZ8).mp3
```

---

## ⚠️ Disclaimer

---

## 🦡 Getting Started

<mark>~~This text needs to be rewritten to fit~~</mark>

### Prerequisites

1. **Windows 10 / 11 (64-bit)**
2. **NVIDIA GPU** with CUDA drivers installed.
3. **64-bit VLC Media Player** installed on your system (required for `python-vlc`).
4. **Python 3.10 to 3.12*

---

### Installation & Setup

```bash
# 1. Clone the repository
git clone [https://github.com/SnowY4you/Karaoke_Studio.git](https://github.com/SnowY4you/Karaoke_Studio.git)
cd Karaoke_Studio

# 2. Create and activate Python virtual environment
python -m venv .venv
.venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Launch Application
python main.py
```

---

## 🦄 Author

Sandra van Buggenum

- **GitHub:** SnowY4you
- **LinkedIn:** Sandra van Buggenum

---

## Changelog
