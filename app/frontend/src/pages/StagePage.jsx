import { useEffect, useRef, useState } from "react";
import { Maximize } from "lucide-react";
import Stage from "@/components/Stage";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export default function StagePage() {
  const [song, setSong] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const clock = useRef({ time: 0, playing: false, ts: Date.now() });
  const songId = useRef(null);

  useEffect(() => {
    const ch = new BroadcastChannel("karaoke-stage");
    ch.onmessage = ({ data }) => {
      clock.current = { time: data.time, playing: data.playing, ts: data.ts };
      if (data.song?.id !== songId.current) { songId.current = data.song?.id; setSong(data.song); }
      setSettings((s) => (JSON.stringify(s) === JSON.stringify(data.settings) ? s : data.settings));
    };
    return () => ch.close();
  }, []);

  const getTime = () => {
    const c = clock.current;
    return c.playing ? c.time + (Date.now() - c.ts) / 1000 : c.time;
  };

  return (
    <div data-testid="stage-page" className="group relative h-screen w-screen bg-black" onDoubleClick={() => document.documentElement.requestFullscreen?.()}>
      <Stage song={song} getTime={getTime} settings={settings} className="h-full w-full" />
      <button data-testid="stage-fullscreen-btn" onClick={() => document.documentElement.requestFullscreen?.()} className="absolute right-4 top-4 rounded-full bg-black/40 p-3 text-white opacity-0 transition-opacity group-hover:opacity-100">
        <Maximize className="h-5 w-5" />
      </button>
      {!song && <p data-testid="stage-waiting" className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/60">Waiting for the host control panel…</p>}
    </div>
  );
}
