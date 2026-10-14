import { Fragment } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const KEYS = [["Space", "Play / pause"], ["G", "Toggle lead vocal guide"], ["N", "Next song in queue"], ["F", "Full-screen stage"], ["← / →", "Seek 5 seconds"]];
const LAYERS = [
  ["4 · Ball & sweep", "Canvas overlay: bouncing ball on Bézier arcs + gradient fill sweep"],
  ["3 · Lyrics", "LRC / word-timestamp parser and dual-line text renderer"],
  ["2 · Background", "Looped MP4 or animated shader themes, swappable per song"],
  ["1 · Audio", "Instrumental + vocal stems with 100ms guide gain ramps"],
];

export default function HelpDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="help-dialog" className="border-[#1e4d6b] bg-[#0d2338] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Help</DialogTitle>
          <DialogDescription className="text-white/50">Drag songs into the queue, double-click to sing now, or cast to a second screen.</DialogDescription>
        </DialogHeader>
        <h4 className="text-xs font-bold uppercase tracking-widest text-[#5ee7ff]">Shortcuts</h4>
        <div className="grid grid-cols-[90px_1fr] gap-y-1.5 text-sm">
          {KEYS.map(([k, d]) => (<Fragment key={k}><kbd className="w-fit rounded bg-white/10 px-2 py-0.5 font-mono text-xs">{k}</kbd><span className="text-white/75">{d}</span></Fragment>))}
        </div>
        <h4 className="mt-2 text-xs font-bold uppercase tracking-widest text-[#5ee7ff]">Render layers</h4>
        <div className="space-y-1.5 text-sm">
          {LAYERS.map(([k, d]) => (<p key={k}><span className="font-semibold text-white">{k}</span> <span className="text-white/60">— {d}</span></p>))}
        </div>
        <p className="mt-2 rounded bg-[#ff4fd8]/10 p-2 text-xs text-[#ffb3ee]">Preview build: demo songs use synthesized backing & guide tracks. Demucs stem separation and WhisperX alignment run in the desktop (Flet) build.</p>
      </DialogContent>
    </Dialog>
  );
}
