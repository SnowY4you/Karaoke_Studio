// Queue & table row renderer

import { Play, Plus, Star, ListPlus } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fmt } from "@/lib/api";
import { useStudio } from "@/lib/studio-context";

export default function SongRow({ song, index, extra, onRemove }) {
  const { playSong, enqueue, toggleFavorite, playlists, addToPlaylist, currentSong } = useStudio();
  const active = currentSong?.id === song.id;
  return (
    <div
      data-testid={`song-row-${song.id}`}
      draggable
      onDragStart={(e) => e.dataTransfer.setData("song-id", song.id)}
      onDoubleClick={() => playSong(song.id)}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      className={`fade-up group grid cursor-grab grid-cols-[1fr_1fr_auto] items-center gap-2 rounded-md px-3 py-2.5 transition-colors hover:bg-white/5 ${active ? "bg-[#22b8d6]/10" : ""}`}
    >
      <div className="min-w-0">
        <p className={`truncate text-[17px] font-semibold ${active ? "text-[#5ee7ff]" : "text-white"}`}>{song.title}</p>
        <p className="truncate text-xs text-white/40">{song.genre} · {song.year || "—"} · {fmt(song.duration)}{extra ? ` · ${extra}` : ""}</p>
      </div>
      <p className="truncate text-[16px] text-white/80">{song.artist}</p>
      <div className="flex items-center gap-0.5">
        <button data-testid={`song-play-${song.id}`} onClick={() => playSong(song.id)} title="Play now" className="rounded p-1.5 text-[#22b8d6] opacity-60 transition hover:bg-white/10 group-hover:opacity-100"><Play className="h-4 w-4" fill="currentColor" /></button>
        <button data-testid={`song-enqueue-${song.id}`} onClick={() => enqueue(song.id)} title="Add to queue" className="rounded p-1.5 text-white/70 opacity-60 transition hover:bg-white/10 group-hover:opacity-100"><Plus className="h-4 w-4" /></button>
        <button data-testid={`song-fav-${song.id}`} onClick={() => toggleFavorite(song.id)} title="Favorite" className="rounded p-1.5 text-[#22b8d6] transition hover:bg-white/10">
          <Star className="h-4 w-4" fill={song.favorite ? "currentColor" : "none"} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger data-testid={`song-playlist-menu-${song.id}`} className="rounded p-1.5 text-white/70 opacity-60 transition hover:bg-white/10 group-hover:opacity-100"><ListPlus className="h-4 w-4" /></DropdownMenuTrigger>
          <DropdownMenuContent className="border-[#1e4d6b] bg-[#0d2338] text-white">
            <DropdownMenuLabel>Add to playlist</DropdownMenuLabel>
            {playlists.map((p) => (
              <DropdownMenuItem data-testid={`add-to-playlist-${p.id}`} key={p.id} onClick={() => addToPlaylist(p.id, song.id)}>{p.name}</DropdownMenuItem>
            ))}
            {onRemove && <DropdownMenuItem data-testid={`remove-from-list-${song.id}`} onClick={onRemove} className="text-red-300">Remove from this playlist</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
