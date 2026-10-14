import { useEffect, useState } from "react";
import { Search, ArrowLeft, Trash2, ListPlus, Globe, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { api, fmt } from "@/lib/api";
import { useStudio } from "@/lib/studio-context";
import SongRow from "@/components/SongRow";
import QueuePanel from "@/components/QueuePanel";
import ImportView from "@/components/ImportView";

const Header = ({ children, testid }) => (
  <h2 data-testid={testid || "right-panel-title"} className="mb-3 text-[26px] font-bold leading-tight text-white">{children}</h2>
);

const ColHead = () => (
  <div className="grid grid-cols-[1fr_1fr_auto] px-3 pb-2 text-[22px] font-semibold text-white">
    <span>Title</span><span>Artist</span><span className="w-[120px]" />
  </div>
);

function SongList({ songs, empty = "No songs here yet", extra, onRemove }) {
  if (!songs) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-[#22b8d6]" />;
  return (
    <>
      <ColHead />
      {songs.length === 0 && <p data-testid="song-list-empty" className="px-3 py-6 text-white/45">{empty}</p>}
      {songs.map((s, i) => (
        <SongRow key={s.id + (s.history_id || "")} song={s} index={i} extra={extra?.(s)} onRemove={onRemove ? () => onRemove(s) : undefined} />
      ))}
    </>
  );
}

function useSongs(params) {
  const { refreshKey } = useStudio();
  const [songs, setSongs] = useState(null);
  const key = JSON.stringify(params);
  useEffect(() => {
    api.songs(params).then(setSongs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refreshKey]);
  return songs;
}

function GenreTiles({ onPick }) {
  const { refreshKey } = useStudio();
  const [genres, setGenres] = useState([]);
  useEffect(() => { api.genres().then(setGenres); }, [refreshKey]);
  return (
    <div className="grid grid-cols-2 gap-4">
      {genres.map((g, i) => (
        <button
          key={g.name}
          data-testid={`genre-tile-${g.name.toLowerCase()}`}
          onClick={() => onPick(g.name)}
          style={{ animationDelay: `${i * 60}ms` }}
          className="fade-up group relative aspect-[5/4] overflow-hidden rounded-md shadow-lg"
        >
          <img src={g.image} alt={g.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/20" />
          <span className="relative text-[26px] font-bold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.7)]">{g.name}</span>
          <span className="absolute bottom-1.5 right-2 text-xs font-semibold text-white/80">{g.count} {g.count === 1 ? "song" : "songs"}</span>
        </button>
      ))}
    </div>
  );
}

function LrcLibFinder({ query }) {
  const { refresh, enqueue } = useStudio();
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(null);
  const find = async () => {
    setResults("loading");
    try { setResults(await api.lrcSearch(query)); } catch (e) { toast.error("LRCLIB is unreachable right now"); setResults(null); }
  };
  const imp = async (r) => {
    setBusy(r.lrclib_id);
    try {
      const song = await api.lrcImport(r.lrclib_id, "Pop");
      toast.success(`Imported “${song.title}” with synced lyrics`);
      refresh();
      enqueue(song.id);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Import failed");
    }
    setBusy(null);
  };
  return (
    <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <button data-testid="lrclib-search-btn" onClick={find} className="flex w-full items-center gap-2 text-left text-sm font-semibold text-[#5ee7ff] hover:underline">
        <Globe className="h-4 w-4" /> Find synced lyrics online for “{query}” (LRCLIB)
      </button>
      {results === "loading" && <Loader2 className="mx-auto mt-3 h-5 w-5 animate-spin text-[#22b8d6]" />}
      {Array.isArray(results) && results.length === 0 && <p className="mt-2 text-sm text-white/50">No online matches.</p>}
      {Array.isArray(results) && results.map((r) => (
        <div key={r.lrclib_id} data-testid={`lrclib-result-${r.lrclib_id}`} className="mt-2 flex items-center gap-2 rounded px-2 py-1.5 hover:bg-white/5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{r.title}</p>
            <p className="truncate text-xs text-white/45">{r.artist} · {fmt(r.duration)} · {r.synced ? "synced" : "plain only"}</p>
          </div>
          <button data-testid={`lrclib-import-${r.lrclib_id}`} disabled={!r.synced || busy === r.lrclib_id} onClick={() => imp(r)} className="rounded p-1.5 text-[#22b8d6] hover:bg-white/10 disabled:opacity-30" title="Import & queue">
            {busy === r.lrclib_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </button>
        </div>
      ))}
    </div>
  );
}

function SearchView() {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const songs = useSongs({ q, genre });
  return (
    <div>
      <div className="mb-4 flex items-center gap-3 rounded-sm border-2 border-[#22b8d6] bg-[#0f3a55]/60 px-3 py-2">
        <Search className="h-7 w-7 text-white" />
        <input data-testid="search-input" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="song, artist" className="w-full bg-transparent text-[22px] font-semibold text-white placeholder:text-white/80 focus:outline-none" />
      </div>
      {genre && (
        <button data-testid="search-clear-genre" onClick={() => setGenre("")} className="mb-2 rounded-full bg-[#22b8d6]/20 px-3 py-1 text-sm text-[#5ee7ff]">{genre} ✕</button>
      )}
      {!q && !genre ? <GenreTiles onPick={setGenre} /> : <SongList songs={songs} empty="No local matches" />}
      {q.trim().length > 1 && <LrcLibFinder query={q.trim()} />}
    </div>
  );
}

function LibraryView() {
  const [sort, setSort] = useState("title");
  const songs = useSongs({ sort });
  return (
    <div>
      <div className="flex items-center justify-between">
        <Header>Library</Header>
        <select data-testid="library-sort" value={sort} onChange={(e) => setSort(e.target.value)} className="rounded bg-[#0f3a55] px-2 py-1 text-sm text-white">
          <option value="title">A–Z</option><option value="plays">Most played</option><option value="year">Newest</option>
        </select>
      </div>
      <SongList songs={songs} extra={(s) => `${s.play_count} plays`} />
    </div>
  );
}

function GenresView() {
  const [genre, setGenre] = useState("");
  const songs = useSongs({ genre });
  if (!genre) return (<div><Header>Genres</Header><GenreTiles onPick={setGenre} /></div>);
  return (
    <div>
      <button data-testid="genre-back-btn" onClick={() => setGenre("")} className="mb-2 flex items-center gap-1 text-sm text-[#5ee7ff]"><ArrowLeft className="h-4 w-4" /> All genres</button>
      <Header>{genre}</Header>
      <SongList songs={songs} />
    </div>
  );
}

function FavoritesView() {
  const songs = useSongs({ favorite: true });
  return (<div><Header>Favorites</Header><SongList songs={songs} empty="Tap the star on any song to favorite it" /></div>);
}

function HistoryView() {
  const { refreshKey, refresh } = useStudio();
  const [rows, setRows] = useState(null);
  useEffect(() => { api.history().then(setRows); }, [refreshKey]);
  return (
    <div>
      <div className="flex items-center justify-between">
        <Header>History</Header>
        <button data-testid="history-clear-btn" onClick={async () => { await api.clearHistory(); refresh(); }} className="text-sm text-white/50 hover:text-white">Clear</button>
      </div>
      <SongList songs={rows} empty="Nothing sung yet" extra={(s) => new Date(s.played_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
    </div>
  );
}

function PlaylistsView() {
  const { playlists, refresh, setQueueFromServer } = useStudio();
  const [sel, setSel] = useState(null);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState(null);
  const { refreshKey } = useStudio();
  useEffect(() => { if (sel) api.playlist(sel).then(setDetail); }, [sel, refreshKey]);

  if (sel && detail) {
    return (
      <div>
        <button data-testid="playlist-back-btn" onClick={() => { setSel(null); setDetail(null); }} className="mb-2 flex items-center gap-1 text-sm text-[#5ee7ff]"><ArrowLeft className="h-4 w-4" /> Playlists</button>
        <Header>{detail.name}</Header>
        <div className="mb-3 flex gap-2">
          <button data-testid="playlist-enqueue-btn" onClick={async () => { setQueueFromServer(await api.enqueuePlaylist(sel)); toast.success("Playlist added to queue"); }} className="flex items-center gap-1 rounded-full bg-[#22b8d6] px-4 py-1.5 text-sm font-semibold text-[#06202e] hover:bg-[#5ee7ff]"><ListPlus className="h-4 w-4" /> Queue all</button>
          <button data-testid="playlist-delete-btn" onClick={async () => { await api.deletePlaylist(sel); setSel(null); setDetail(null); refresh(); }} className="flex items-center gap-1 rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/70 hover:bg-white/10"><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
        <SongList songs={detail.songs} empty="Use the playlist icon on any song to add it here" onRemove={async (s) => { await api.removeFromPlaylist(sel, s.id); refresh(); }} />
      </div>
    );
  }
  return (
    <div>
      <Header>Playlists</Header>
      <form onSubmit={async (e) => { e.preventDefault(); if (!name.trim()) return; await api.createPlaylist(name); setName(""); refresh(); }} className="mb-4 flex gap-2">
        <input data-testid="playlist-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="New playlist name" className="flex-1 rounded border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:border-[#22b8d6] focus:outline-none" />
        <button data-testid="playlist-create-btn" className="rounded bg-[#22b8d6] px-4 font-semibold text-[#06202e] hover:bg-[#5ee7ff]">Create</button>
      </form>
      {playlists.map((p, i) => (
        <button key={p.id} data-testid={`playlist-item-${p.id}`} onClick={() => setSel(p.id)} style={{ animationDelay: `${i * 40}ms` }} className="fade-up flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-[19px] font-semibold text-white hover:bg-white/5">
          <span>{p.name}</span><span className="text-sm text-white/45">{p.song_ids.length} songs</span>
        </button>
      ))}
    </div>
  );
}

const VIEWS = { search: SearchView, home: LibraryView, genres: GenresView, favorites: FavoritesView, history: HistoryView, playlists: PlaylistsView, import: ImportView };

export default function RightPanel({ view }) {
  const View = VIEWS[view];
  return (
    <aside data-testid="right-panel" className="w-[400px] shrink-0 overflow-y-auto bg-[#0a1c2e] px-5 py-4">
      {View ? <View key={view} /> : (<div><Header>Queue</Header><QueuePanel compact /></div>)}
    </aside>
  );
}
