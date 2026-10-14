import { useEffect, useState } from "react";
import { Play, Pause, Star, SkipForward, Mic, MicOff, Square } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { engine } from "@/lib/engine";
import { fmt } from "@/lib/api";

const SOURCE = { lrclib: "LRCLIB synced", whisper: "Whisper aligned", whisperx: "WhisperX aligned" };

export default function PlayerBar({ song, playing, onPlay, onPause, onStop, onNext, onFavorite, guideOn, onToggleGuide }) {
  const [t, setT] = useState(0);
  const [drag, setDrag] = useState(null);
  useEffect(() => {
    const id = setInterval(() => setT(engine.getTime()), 200);
    return () => clearInterval(id);
  }, []);
  const dur = song?.duration || 0;
  const shown = drag ?? t;
  const circ = "flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#22b8d6] text-[#22b8d6] transition-transform hover:scale-110 active:scale-95 disabled:opacity-40";

  return (
    <div data-testid="player-bar" className="border-b-[3px] border-[#22b8d6] bg-[#0a1c2e] px-6 pb-3 pt-2">
      <div className="flex items-center justify-between">
        <p data-testid="now-playing-title" className="truncate text-[22px] font-semibold text-white">
          {song ? `${song.title}, ${song.artist}` : "No song loaded"}
          {song && (
            <span data-testid="now-playing-source" className="ml-3 align-middle rounded-full bg-[#22b8d6]/15 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[#5ee7ff]">
              {SOURCE[song.alignment_source] || "No lyrics yet"} · stems {song.stems?.status}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            data-testid="vocal-guide-toggle"
            onClick={onToggleGuide}
            disabled={!song || !engine.hasGuide}
            title={song && !engine.hasGuide ? "No vocal stem for this song — upload stems in Import" : "Lead vocal guide"}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              guideOn ? "bg-[#ff4fd8] text-[#1a0620] shadow-[0_0_16px_rgba(255,79,216,0.5)]" : "border border-white/25 text-white/80 hover:bg-white/10"
            }`}
          >
            {guideOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            {guideOn ? "Guide vocals ON" : "Solo mode"}
          </button>
          <button data-testid="player-favorite-btn" onClick={onFavorite} disabled={!song} className="p-1 text-[#22b8d6] transition-transform hover:scale-110">
            <Star className="h-9 w-9" fill={song?.favorite ? "currentColor" : "none"} strokeWidth={2.2} />
          </button>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <button data-testid="player-play-btn" onClick={onPlay} disabled={!song || playing} className={circ}><Play className="ml-0.5 h-5 w-5" /></button>
        <button data-testid="player-pause-btn" onClick={onPause} disabled={!song || !playing} className={circ}><Pause className="h-5 w-5" /></button>
        <button data-testid="player-stop-btn" onClick={onStop} disabled={!song} className={circ}><Square className="h-4 w-4" /></button>
        <span data-testid="player-elapsed" className="w-16 text-center text-[26px] font-semibold tabular-nums text-white">{fmt(shown)}</span>
        <Slider
          data-testid="player-seek-slider"
          className="karaoke-slider flex-1"
          min={0}
          max={dur || 1}
          step={0.1}
          value={[shown]}
          disabled={!song}
          onValueChange={([v]) => setDrag(v)}
          onValueCommit={([v]) => { engine.seek(v); setDrag(null); setT(v); }}
        />
        <span data-testid="player-remaining" className="w-20 text-right text-[26px] font-semibold tabular-nums text-white">-{fmt(Math.max(0, dur - shown))}</span>
        <button data-testid="player-next-btn" onClick={onNext} className="p-1 text-[#22b8d6] transition-transform hover:scale-110" title="Next in queue">
          <SkipForward className="h-7 w-7" fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
