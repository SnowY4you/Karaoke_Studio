import { useEffect, useRef } from "react";
import { drawLyrics } from "@/lib/lyrics";

const GENRE_IMG = {
  Country: "https://images.unsplash.com/photo-1520167112707-56e25f2d7d6e?crop=entropy&cs=srgb&fm=jpg&q=80&w=1600",
  Rock: "https://images.unsplash.com/photo-1473691955023-da1c49c95c78?crop=entropy&cs=srgb&fm=jpg&q=80&w=1600",
  Pop: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?crop=entropy&cs=srgb&fm=jpg&q=80&w=1600",
  Jazz: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?crop=entropy&cs=srgb&fm=jpg&q=80&w=1600",
  Synthwave: "https://images.unsplash.com/photo-1706466615917-e44750d177d7?crop=entropy&cs=srgb&fm=jpg&q=80&w=1600",
  Soul: "https://images.unsplash.com/photo-1624913763354-1a6feee6858d?crop=entropy&cs=srgb&fm=jpg&q=80&w=1600",
};

function BackgroundLayer({ theme, song, videoUrl }) {
  if (videoUrl) {
    return <video data-testid="stage-bg-video" className="absolute inset-0 h-full w-full object-cover" src={videoUrl} autoPlay loop muted playsInline />;
  }
  if (theme === "genre") {
    const img = GENRE_IMG[song?.genre] || GENRE_IMG.Pop;
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="bg-kenburns absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
        <div className="absolute inset-0 bg-[#071526]/55" />
      </div>
    );
  }
  return (
    <div className={`absolute inset-0 overflow-hidden bg-theme-${theme}`}>
      <div className="blob blob-a" />
      <div className="blob blob-b" />
      <div className="blob blob-c" />
      {theme === "neon" && <div className="neon-grid" />}
    </div>
  );
}

function LyricsCanvas({ song, getTime, settings }) {
  const ref = useRef(null);
  const live = useRef({ song, settings, getTime });
  live.current = { song, settings, getTime };

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let raf;
    const loop = () => {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { song: s, settings: st, getTime: gt } = live.current;
      drawLyrics(ctx, W, H, s, gt(), st);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} data-testid="lyrics-canvas" className="absolute inset-0 h-full w-full" />;
}

export default function Stage({ song, getTime, settings, className = "", children }) {
  return (
    <div data-testid="stage-view" className={`relative overflow-hidden ${className}`}>
      <BackgroundLayer theme={settings.theme} song={song} videoUrl={settings.videoUrl} />
      <div className="noise-overlay" />
      <LyricsCanvas song={song} getTime={getTime} settings={settings} />
      {children}
    </div>
  );
}
