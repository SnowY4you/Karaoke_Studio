import { Search, ListMusic, Music4, Star, History, ListOrdered, Library, Upload } from "lucide-react";

const ITEMS = [
  { id: "search", label: "Search", icon: Search },
  { id: "home", label: "Library", icon: Library },
  { id: "playlists", label: "Playlists", icon: ListMusic },
  { id: "genres", label: "Genres", icon: Music4 },
  { id: "favorites", label: "Favorites", icon: Star, fill: true },
  { id: "history", label: "History", icon: History },
  { id: "queue", label: "Queue", icon: ListOrdered },
  { id: "import", label: "Import", icon: Upload },
];

export default function Sidebar({ view, setView }) {
  return (
    <nav data-testid="sidebar" className="flex w-[250px] shrink-0 flex-col gap-1 bg-[#0a1c2e] px-3 py-4">
      {ITEMS.map(({ id, label, icon: Icon, fill }, i) => {
        const active = view === id;
        return (
          <button
            key={id}
            data-testid={`sidebar-${id}-btn`}
            onClick={() => setView(id)}
            style={{ animationDelay: `${i * 50}ms` }}
            className={`fade-up group flex items-center justify-between rounded-md border-2 px-4 py-3 text-left text-[22px] font-bold text-white transition-colors ${
              active ? "border-[#22b8d6] bg-[#22b8d6]/10" : "border-transparent hover:bg-white/5"
            }`}
          >
            <span>{label}</span>
            <Icon className="h-8 w-8 text-[#22b8d6] transition-transform group-hover:scale-110" fill={fill ? "currentColor" : "none"} strokeWidth={2.2} />
          </button>
        );
      })}
      <div className="flex-1" />
      <p className="px-4 text-xs leading-relaxed text-white/35">Karaoke Studio · demo library<br />Space play/pause · G guide · N next</p>
    </nav>
  );
}
