import { useEffect, useRef, useState } from "react";
import { UploadCloud, Loader2, Check, X, Minus, Play, Plus, RefreshCw, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, fmt } from "@/lib/api";
import { useStudio } from "@/lib/studio-context";

const GENRES = ["Pop", "Rock", "Country", "Jazz", "Synthwave", "Soul"];
const field = "w-full rounded border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#22b8d6] focus:outline-none";

function guessMeta(name) {
  const base = name.replace(/\.mp3$/i, "").replace(/_/g, " ");
  const [a, ...t] = base.split(" - ");
  return t.length ? { artist: a.trim(), title: t.join(" - ").trim() } : { artist: "", title: base.trim() };
}

function ImportForm({ onDone }) {
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({ title: "", artist: "", genre: "Pop", year: "", lyrics_mode: "auto" });
  const [stems, setStems] = useState({ on: false, instrumental: null, vocals: null });
  const [progress, setProgress] = useState(null);
  const [drag, setDrag] = useState(false);
  const input = useRef(null);

  const pick = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".mp3")) return toast.error("Please choose an .mp3 file");
    if (f.size > 25 * 1024 * 1024) return toast.error("File exceeds 25 MB");
    setFile(f);
    setMeta((m) => ({ ...m, ...guessMeta(f.name) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file || !meta.title.trim() || !meta.artist.trim()) return toast.error("MP3, title and artist are required");
    if (stems.on && (!stems.instrumental || !stems.vocals)) return toast.error("Choose both stem files or untick stems");
    const fd = new FormData();
    fd.append("file", file);
    Object.entries(meta).forEach(([k, v]) => v !== "" && fd.append(k, v));
    if (stems.on) { fd.append("instrumental", stems.instrumental); fd.append("vocals", stems.vocals); }
    setProgress(0);
    try {
      const song = await api.importSong(fd, setProgress);
      toast.success(`“${song.title}” uploaded — processing started`);
      setFile(null);
      setMeta((m) => ({ ...m, title: "", artist: "", year: "" }));
      setStems({ on: false, instrumental: null, vocals: null });
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    }
    setProgress(null);
  };

  return (
    <form data-testid="import-form" onSubmit={submit} className="space-y-3">
      <div
        data-testid="import-dropzone"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${drag ? "border-[#5ee7ff] bg-[#22b8d6]/10" : "border-white/20 hover:border-[#22b8d6]"}`}
      >
        <UploadCloud className="h-9 w-9 text-[#22b8d6]" />
        <p className="text-sm font-semibold text-white">{file ? file.name : "Drop an MP3 here or click to browse"}</p>
        <p className="text-xs text-white/40">{file ? `${(file.size / 1048576).toFixed(1)} MB` : "Max 25 MB · “Artist - Title.mp3” auto-fills"}</p>
        <input data-testid="import-file-input" ref={input} type="file" accept=".mp3,audio/mpeg" className="hidden" onChange={(e) => pick(e.target.files[0])} />
      </div>
      <input data-testid="import-title-input" className={field} placeholder="Title" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
      <input data-testid="import-artist-input" className={field} placeholder="Artist" value={meta.artist} onChange={(e) => setMeta({ ...meta, artist: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <select data-testid="import-genre-select" className={field} value={meta.genre} onChange={(e) => setMeta({ ...meta, genre: e.target.value })}>
          {GENRES.map((g) => <option key={g} className="bg-[#0d2338]">{g}</option>)}
        </select>
        <input data-testid="import-year-input" className={field} placeholder="Year" type="number" value={meta.year} onChange={(e) => setMeta({ ...meta, year: e.target.value })} />
      </div>
      <select data-testid="import-lyrics-mode" className={field} value={meta.lyrics_mode} onChange={(e) => setMeta({ ...meta, lyrics_mode: e.target.value })}>
        <option value="auto" className="bg-[#0d2338]">Lyrics: LRCLIB first, then Whisper</option>
        <option value="lrclib" className="bg-[#0d2338]">Lyrics: LRCLIB only</option>
        <option value="whisper" className="bg-[#0d2338]">Lyrics: Whisper only</option>
      </select>
      <label className="flex items-center gap-2 text-sm text-white/80">
        <input data-testid="import-stems-toggle" type="checkbox" checked={stems.on} onChange={(e) => setStems({ ...stems, on: e.target.checked })} className="accent-[#22b8d6]" />
        I already have separated stems
      </label>
      {stems.on && (
        <div className="space-y-2 rounded border border-white/10 p-2 text-xs text-white/70">
          <label className="block">Instrumental.mp3 <input data-testid="import-instrumental-input" type="file" accept=".mp3" onChange={(e) => setStems({ ...stems, instrumental: e.target.files[0] })} className="mt-1 block w-full" /></label>
          <label className="block">Vocals.mp3 <input data-testid="import-vocals-input" type="file" accept=".mp3" onChange={(e) => setStems({ ...stems, vocals: e.target.files[0] })} className="mt-1 block w-full" /></label>
        </div>
      )}
      <button data-testid="import-submit-btn" disabled={progress !== null} className="relative w-full overflow-hidden rounded-full bg-[#22b8d6] py-2.5 font-semibold text-[#06202e] transition-colors hover:bg-[#5ee7ff] disabled:opacity-80">
        {progress !== null && <span className="absolute inset-y-0 left-0 bg-[#5ee7ff]" style={{ width: `${progress * 100}%` }} />}
        <span className="relative">{progress !== null ? `Uploading ${Math.round(progress * 100)}%` : "Import & process"}</span>
      </button>
    </form>
  );
}

const ICON = { done: Check, failed: X, skipped: Minus, running: Loader2 };

function Step({ label, step, testid }) {
  const st = step?.status || "pending";
  const Icon = ICON[st];
  const color = { done: "text-emerald-300", failed: "text-red-300", skipped: "text-amber-300", running: "text-[#5ee7ff]" }[st] || "text-white/40";
  return (
    <div data-testid={testid} className="flex items-start gap-2 text-xs">
      <span className={`mt-0.5 ${color}`}>{Icon ? <Icon className={`h-3.5 w-3.5 ${st === "running" ? "animate-spin" : ""}`} /> : <span className="block h-3.5 w-3.5 rounded-full border border-white/30" />}</span>
      <span className="font-semibold text-white/80">{label}</span>
      <span className="min-w-0 flex-1 break-words text-white/45">{step?.message || st}</span>
    </div>
  );
}

function ImportCard({ song, reload }) {
  const { playSong, enqueue, refresh } = useStudio();
  const stemsRef = useRef(null);
  const state = song.processing?.state;
  const busy = state === "queued" || state === "processing";
  const redo = async (mode, separate = false) => { await api.reprocess(song.id, mode, separate); toast("Reprocessing started"); reload(); };
  const onStems = async (e) => {
    const files = [...e.target.files];
    const inst = files.find((f) => /inst/i.test(f.name));
    const voc = files.find((f) => /voc/i.test(f.name));
    if (!inst || !voc) return toast.error("Select two files named like instrumental.mp3 and vocals.mp3");
    const fd = new FormData();
    fd.append("instrumental", inst);
    fd.append("vocals", voc);
    try { await api.uploadStems(song.id, fd); toast.success("Stems attached — vocal guide enabled"); reload(); } catch (err) { toast.error(err.response?.data?.detail || "Upload failed"); }
  };
  return (
    <div data-testid={`import-card-${song.id}`} className="fade-up rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{song.title}</p>
          <p className="truncate text-xs text-white/45">{song.artist} · {fmt(song.duration)} · {song.genre}</p>
        </div>
        <span data-testid={`import-state-${song.id}`} className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${state === "ready" ? "bg-emerald-400/15 text-emerald-300" : busy ? "bg-[#22b8d6]/15 text-[#5ee7ff]" : "bg-red-400/15 text-red-300"}`}>{(state || "").replace("_", " ")}</span>
      </div>
      <div className="mt-2 space-y-1">
        <Step label="Upload" step={{ status: "done", message: "storage/songs/" + song.folder }} testid={`import-step-upload-${song.id}`} />
        <Step label="Separation" step={song.processing?.separation} testid={`import-step-separation-${song.id}`} />
        <Step label="Lyrics" step={song.processing?.lyrics} testid={`import-step-lyrics-${song.id}`} />
      </div>
      <div className="mt-2 flex items-center gap-1">
        <button data-testid={`import-play-${song.id}`} disabled={state !== "ready"} onClick={() => playSong(song.id)} className="rounded p-1.5 text-[#22b8d6] hover:bg-white/10 disabled:opacity-30" title="Play now"><Play className="h-4 w-4" fill="currentColor" /></button>
        <button data-testid={`import-enqueue-${song.id}`} disabled={state !== "ready"} onClick={() => enqueue(song.id)} className="rounded p-1.5 text-white/70 hover:bg-white/10 disabled:opacity-30" title="Add to queue"><Plus className="h-4 w-4" /></button>
        <button data-testid={`import-stems-${song.id}`} onClick={() => stemsRef.current?.click()} className="rounded p-1.5 text-white/70 hover:bg-white/10" title="Attach stems (instrumental.mp3 + vocals.mp3)"><Layers className="h-4 w-4" /></button>
        <input ref={stemsRef} type="file" accept=".mp3" multiple className="hidden" onChange={onStems} />
        <DropdownMenu>
          <DropdownMenuTrigger data-testid={`import-redo-${song.id}`} disabled={busy} className="rounded p-1.5 text-white/70 hover:bg-white/10 disabled:opacity-30" title="Reprocess"><RefreshCw className="h-4 w-4" /></DropdownMenuTrigger>
          <DropdownMenuContent className="border-[#1e4d6b] bg-[#0d2338] text-white">
            <DropdownMenuItem data-testid={`redo-separate-${song.id}`} onClick={() => redo("auto", true)}>Run separation script + sync</DropdownMenuItem>
            <DropdownMenuItem data-testid={`redo-lrclib-${song.id}`} onClick={() => redo("lrclib")}>Re-sync lyrics from LRCLIB</DropdownMenuItem>
            <DropdownMenuItem data-testid={`redo-whisper-${song.id}`} onClick={() => redo("whisper")}>Re-sync lyrics with Whisper</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1" />
        <button data-testid={`import-delete-${song.id}`} onClick={async () => { await api.deleteSong(song.id); reload(); refresh(); }} className="rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-red-300" title="Delete"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export default function ImportView() {
  const { refreshKey, refresh } = useStudio();
  const [items, setItems] = useState(null);
  const load = () => api.imports().then(setItems);
  useEffect(() => { load(); }, [refreshKey]);
  const busy = items?.some((s) => ["queued", "processing"].includes(s.processing?.state));
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(async () => {
      const next = await api.imports();
      setItems(next);
      if (!next.some((s) => ["queued", "processing"].includes(s.processing?.state))) refresh();
    }, 2500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  return (
    <div>
      <h2 data-testid="right-panel-title" className="mb-3 text-[26px] font-bold text-white">Import songs</h2>
      <ImportForm onDone={load} />
      <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-[#5ee7ff]">Your imports</h3>
      {!items && <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#22b8d6]" />}
      {items?.length === 0 && <p data-testid="imports-empty" className="text-sm text-white/45">No imported songs yet.</p>}
      <div className="space-y-2">{items?.map((s) => <ImportCard key={s.id} song={s} reload={load} />)}</div>
    </div>
  );
}
