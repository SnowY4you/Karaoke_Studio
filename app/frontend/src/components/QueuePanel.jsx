import { useState } from "react";
import { GripVertical, X, Play } from "lucide-react";
import { fmt } from "@/lib/api";
import { useStudio } from "@/lib/studio-context";

export default function QueuePanel({ compact = false }) {
  const { queue, setQueueIds, removeQueueAt, playFromQueue } = useStudio();
  const [over, setOver] = useState(null);

  const onDrop = (e, idx) => {
    e.preventDefault();
    setOver(null);
    const ids = queue.map((s) => s.id);
    const from = e.dataTransfer.getData("queue-index");
    const songId = e.dataTransfer.getData("song-id");
    if (from !== "") {
      const [moved] = ids.splice(Number(from), 1);
      ids.splice(idx > Number(from) ? idx - 1 : idx, 0, moved);
    } else if (songId) {
      ids.splice(idx, 0, songId);
    } else return;
    setQueueIds(ids);
  };

  return (
    <div
      data-testid="queue-panel"
      className={`${compact ? "" : "px-10 py-5"}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, queue.length)}
    >
      {!compact && <h3 className="text-[26px] font-semibold text-white">Queue</h3>}
      <div className="mt-2 grid grid-cols-[50px_28px_1fr_1fr_70px_70px] items-center px-2 pb-2 text-[20px] font-semibold text-white">
        <span>#</span><span /><span>Title</span><span>Artist</span><span className="text-right text-sm text-white/50">Time</span><span />
      </div>
      {queue.length === 0 && (
        <div data-testid="queue-empty" className="rounded-lg border-2 border-dashed border-white/15 px-4 py-6 text-center text-white/45">
          Queue is empty — drag songs here or press + on any song
        </div>
      )}
      {queue.map((s, i) => (
        <div
          key={`${s.id}-${i}`}
          data-testid={`queue-row-${i}`}
          draggable
          onDragStart={(e) => e.dataTransfer.setData("queue-index", String(i))}
          onDragOver={(e) => { e.preventDefault(); setOver(i); }}
          onDragLeave={() => setOver(null)}
          onDrop={(e) => { e.stopPropagation(); onDrop(e, i); }}
          className={`group grid cursor-grab grid-cols-[50px_28px_1fr_1fr_70px_70px] items-center rounded-md px-2 py-2.5 text-[19px] text-white transition-colors hover:bg-white/5 ${
            over === i ? "border-t-2 border-[#5ee7ff]" : "border-t-2 border-transparent"
          }`}
        >
          <span className="text-[22px] font-bold">{i + 1}</span>
          <GripVertical className="h-4 w-4 text-white/30" />
          <span className="truncate pr-3">{s.title}</span>
          <span className="truncate pr-3 text-white/75">{s.artist}</span>
          <span className="text-right text-sm tabular-nums text-white/50">{fmt(s.duration)}</span>
          <span className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button data-testid={`queue-play-${i}`} onClick={() => playFromQueue(i)} className="rounded p-1 text-[#22b8d6] hover:bg-white/10"><Play className="h-4 w-4" /></button>
            <button data-testid={`queue-remove-${i}`} onClick={() => removeQueueAt(i)} className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
          </span>
        </div>
      ))}
    </div>
  );
}
