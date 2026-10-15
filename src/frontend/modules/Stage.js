// Right Sidebar
// Searching - Viewing: Playlists, Genres
// *Name of selected playlist / song = list all songs with: Title, Artist, Duration, Last Played
// VIEWS = search: SearchView, home: LibraryView, genres: GenresView, favorites: FavoritesView, history: HistoryView, playlists: PlaylistsView

// Right Sidebar Table View (Title, Artist, Duration, Last Played)
// HeaderLabels(["Title", "Artist", "Duration", "Last Played"])

const GENRE_ICON = {
    "Pop": "icons/genre_pop.png",
    "Hip-Hop": "icons/genre_hiphop.png",
    "Rap": "icons/genre_rap.png",
    "R&B": "icons/genre_rb.png",
    "Soul": "icons/genre_soul.png",
    "Rock": "icons/genre_rock.png",
    "Dance": "icons/genre_dance.png",
    "Country": "icons/genre_country.png",
    "Reggae": "icons/genre_reggae.png",
    "Svensk": "icons/genre_svensk.png",
    "Metal": "icons/genre_metal.png",
    "Alternative": "icons/genre_alternative.png",
    "World": "icons/genre_world.png",
    "Holiday": "icons/genre_holiday.png",
    "Schlager": "icons/genre_schlager.png",
    "Dansband": "icons/genre_dansband.png",
    "Jazz & Blues": "icons/genre_jazz_blues.png",
    "Latin": "icons/genre_latin.png"
};

const GROUPING_ICON = {
    // --- Epoker & Nostalgi ---
    "60s Classics": "icons/60s.png",
    "70s Classics": "icons/70s.png",
    "80s Anthems": "icons/80s.png",
    "90s Nostalgia": "icons/90s.png",
    "Y2K (00s)": "icons/y2k.png",
    "Modern Chart": "icons/modern.png",

    // --- Svenskt & Lokalt ---
    "Svenska Klassiker": "icons/svenska_klassiker.png",
    "Melodifestivalen & Eurovision": "icons/mello.png",
    "Allsång & Afterski": "icons/afterski.png",
    "Visa & Akustiskt": "icons/acoustic.png",

    // --- Karaoke-vibbar ---
    "Party Hits": "icons/party.png",
    "Duets & Group Songs": "icons/duets.png",
    "Power Ballads": "icons/ballad.png",
    "One-Hit Wonders": "icons/one_hit.png",
    "Guilty Pleasures": "icons/guilty.png",
    "Cheesy / Comedy": "icons/comedy.png",
    "Enkla Låtar (Easy Mode)": "icons/easy.png",

    // --- Teman & Nischar ---
    "Disney": "icons/disney.png",
    "Movie Soundtracks & Musicals": "icons/soundtrack.png",
    "Boybands & Girlgroups": "icons/boyband.png",
    "Road Trip Classics": "icons/roadtrip.png",
    "Covers & Remakes": "icons/cover.png",
    "Christmas Classics": "icons/christmas.png",

    // --- Genrefilter (för snabbval) ---
    "Metal & Hard Rock": "icons/metal.png",
    "Hip-Hop & Rap": "icons/hiphop_rap.png",
    "R&B & Soul": "icons/rb_soul.png",
    "Rock & Alternative": "icons/rock_alt.png",
    "Pop & Top 40": "icons/pop_top40.png",
    "Latin & Reggaeton Beats": "icons/latin.png",
    "Electronic & Dance": "icons/electronic.png",
    "Eurodance": "icons/eurodance.png"
};

function BackgroundLayer({ theme, song, videoUrl }) {
  if (videoUrl) {
    return (
      <video
        data-testid="stage-bg-video"
        className="absolute inset-0 h-full w-full object-cover"
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }
  if (theme === "genre") {
    const img = GENRE_ICON[song?.genre] || GENRE_ICON.Pop;
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="bg-kenburns absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${img})` }}
        />
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

// Function to create the Genre tiles
function GenreTiles({ onPick }) {
  const { refreshKey } = useStudio();
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    api.genres().then(setGenres);
  }, [refreshKey]);

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
          <img
            src={g.image || GENRE_ICON[g.name]}
            alt={g.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/20" />
          <span className="relative text-[26px] font-bold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.7)]">
            {g.name}
          </span>
          <span className="absolute bottom-1.5 right-2 text-xs font-semibold text-white/80">
            {g.count} {g.count === 1 ? "song" : "songs"}
          </span>
        </button>
      ))}
    </div>
  );
}

// Function to create the Grouping tiles
function GroupingTiles({ onPick }) {
  const { refreshKey } = useStudio();
  const [groupings, setGroupings] = useState([]);

  useEffect(() => {
    api.groupings().then(setGroupings);
  }, [refreshKey]);

  return (
    <div className="grid grid-cols-2 gap-4">
      {groupings.map((g, i) => (
        <button
          key={g.name}
          data-testid={`grouping-tile-${g.name.toLowerCase()}`}
          onClick={() => onPick(g.name)}
          style={{ animationDelay: `${i * 60}ms` }}
          className="fade-up group relative aspect-[5/4] overflow-hidden rounded-md shadow-lg"
        >
          <img
            src={g.image || GROUPING_ICON[g.name]}
            alt={g.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/20" />
          <span className="relative text-[26px] font-bold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.7)]">
            {g.name}
          </span>
          <span className="absolute bottom-1.5 right-2 text-xs font-semibold text-white/80">
            {g.count} {g.count === 1 ? "song" : "songs"}
          </span>
        </button>
      ))}
    </div>
  );
}

// Search function
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

function GroupingView() {
  const [grouping, setGrouping] = useState("");
  const songs = useSongs({ genre });
  if (!grouping) return (<div><Header>Genres</Header><GenreTiles onPick={setGrouping} /></div>);
  return (
    <div>
      <button data-testid="grouping-back-btn" onClick={() => setGrouping("")} className="mb-2 flex items-center gap-1 text-sm text-[#5ee7ff]"><ArrowLeft className="h-4 w-4" /> All categories</button>
      <Header>{grouping}</Header>
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
