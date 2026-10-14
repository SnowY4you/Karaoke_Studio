import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { engine } from "@/lib/engine";
import { useSettings } from "@/lib/settings";
import { StudioContext } from "@/lib/studio-context";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import Stage from "@/components/Stage";
import PlayerBar from "@/components/PlayerBar";
import QueuePanel from "@/components/QueuePanel";
import RightPanel from "@/components/RightPanel";
import SettingsDialog from "@/components/SettingsDialog";
import HelpDialog from "@/components/HelpDialog";

const getTime = () => engine.getTime();

export default function StudioPage() {
  const [settings, updateSettings, resetSettings] = useSettings();
  const [view, setView] = useState("search");
  const [song, setSong] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [guideOn, setGuideOn] = useState(true);
  const [queue, setQueue] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [focus, setFocus] = useState(false);
  const [dlg, setDlg] = useState(null);
  const stageRef = useRef(null);
  const live = useRef({});
  const booted = useRef(false);
  live.current = { song, settings, queue, guideOn };

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  useEffect(() => { api.playlists().then(setPlaylists); }, [refreshKey]);

  const loadSong = useCallback(async (id, autoplay) => {
    const full = await api.song(id);
    const tid = full.has_audio ? toast.loading(`Loading “${full.title}” audio…`) : null;
    try { await engine.load(full, api.mediaUrl); } catch (e) { toast.error("Could not load audio for this song"); }
    if (tid) toast.dismiss(tid);
    setSong(full);
    setPlaying(false);
    if (autoplay) {
      await engine.play();
      engine.setGuide(live.current.guideOn, live.current.settings.guideVolume);
      setPlaying(true);
      await api.registerPlay(id);
      refresh();
    }
  }, [refresh]);

  const next = useCallback(async () => {
    const r = await api.popQueue();
    setQueue(r.queue);
    if (r.song_id) await loadSong(r.song_id, true);
    else { engine.pause(); setPlaying(false); toast("Queue finished — add more songs!"); }
  }, [loadSong]);

  useEffect(() => {
    engine.onEnded = () => { setPlaying(false); next(); };
  }, [next]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    api.queue().then(setQueue);
    Promise.all([api.history(), api.songs({ sort: "title" })]).then(([h, s]) => {
      const first = h[0]?.id || s[0]?.id;
      if (first) loadSong(first, false);
    });
  }, [loadSong]);

  useEffect(() => { engine.setGuide(guideOn, settings.guideVolume); }, [guideOn, settings.guideVolume]);

  useEffect(() => {
    const ch = new BroadcastChannel("karaoke-stage");
    const id = setInterval(() => {
      ch.postMessage({ song: live.current.song, settings: live.current.settings, time: engine.getTime(), playing: engine.playing, ts: Date.now() });
    }, 100);
    return () => { clearInterval(id); ch.close(); };
  }, []);

  const play = async () => { await engine.play(); engine.setGuide(guideOn, settings.guideVolume); setPlaying(true); };
  const pause = () => { engine.pause(); setPlaying(false); };
  const stop = () => { engine.pause(); engine.seek(0); setPlaying(false); };
  const toggleGuide = () => setGuideOn((g) => !g);
  const fullscreen = () => stageRef.current?.requestFullscreen?.();
  const openStage = () => {
    window.open("/stage", "karaoke-stage", "width=1280,height=720");
    toast.success("Stage window opened — drag it to your TV / projector and press F");
  };

  const ctx = {
    queue, playlists, refreshKey, refresh, currentSong: song,
    playSong: (id) => loadSong(id, true),
    enqueue: async (id) => { setQueue(await api.enqueue(id)); toast.success("Added to queue"); },
    setQueueIds: async (ids) => setQueue(await api.setQueue(ids)),
    setQueueFromServer: setQueue,
    removeQueueAt: async (i) => setQueue(await api.dequeue(i)),
    playFromQueue: async (i) => { const id = queue[i].id; setQueue(await api.dequeue(i)); loadSong(id, true); },
    toggleFavorite: async (id) => {
      const r = await api.toggleFavorite(id);
      if (live.current.song?.id === id) setSong((s) => ({ ...s, favorite: r.favorite }));
      refresh();
    },
    addToPlaylist: async (pid, sid) => { await api.addToPlaylist(pid, sid); refresh(); toast.success("Added to playlist"); },
  };

  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (!live.current.song) return;
      if (e.code === "Space") { e.preventDefault(); engine.playing ? pause() : play(); }
      else if (e.key === "g" || e.key === "G") toggleGuide();
      else if (e.key === "n" || e.key === "N") next();
      else if (e.key === "f" || e.key === "F") fullscreen();
      else if (e.key === "ArrowRight") engine.seek(engine.getTime() + 5);
      else if (e.key === "ArrowLeft") engine.seek(engine.getTime() - 5);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <StudioContext.Provider value={ctx}>
      <div data-testid="studio-page" className="flex h-screen flex-col overflow-hidden bg-[#071526] text-white">
        <TopBar
          onHome={() => { setFocus(false); setView("home"); }}
          onSettings={() => setDlg("settings")}
          onHelp={() => setDlg("help")}
          onStage={openStage}
          onFullscreen={fullscreen}
          settings={settings}
          updateSettings={updateSettings}
          focus={focus}
          setFocus={setFocus}
        />
        <div className="flex min-h-0 flex-1">
          {!focus && <Sidebar view={view} setView={setView} />}
          <main className="flex min-w-0 flex-1 flex-col bg-[#071526] px-2 pt-3">
            <div ref={stageRef} className={`${focus ? "flex-1" : "aspect-[16/8.3] max-h-[54vh]"} w-full bg-black`}>
              <Stage song={song} getTime={getTime} settings={settings} className="h-full w-full" />
            </div>
            <PlayerBar song={song} playing={playing} onPlay={play} onPause={pause} onStop={stop} onNext={next} onFavorite={() => song && ctx.toggleFavorite(song.id)} guideOn={guideOn} onToggleGuide={toggleGuide} />
            {!focus && <div className="min-h-0 flex-1 overflow-y-auto bg-[#04121f]"><QueuePanel /></div>}
          </main>
          {!focus && <RightPanel view={view} />}
        </div>
        <SettingsDialog open={dlg === "settings"} onOpenChange={(o) => setDlg(o ? "settings" : null)} settings={settings} update={updateSettings} reset={resetSettings} />
        <HelpDialog open={dlg === "help"} onOpenChange={(o) => setDlg(o ? "help" : null)} />
      </div>
    </StudioContext.Provider>
  );
}
