import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { THEMES } from "@/lib/settings";

const Row = ({ label, children }) => (
  <div className="grid grid-cols-[150px_1fr] items-center gap-4 py-2">
    <span className="text-sm text-white/75">{label}</span>
    <div>{children}</div>
  </div>
);

const Range = ({ id, value, min, max, step, onChange, fmt = (v) => v.toFixed(2) }) => (
  <div className="flex items-center gap-3">
    <Slider data-testid={id} className="karaoke-slider flex-1" min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    <span className="w-12 text-right text-xs tabular-nums text-white/60">{fmt(value)}</span>
  </div>
);

export default function SettingsDialog({ open, onOpenChange, settings: s, update, reset }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="settings-dialog" className="max-h-[85vh] overflow-y-auto border-[#1e4d6b] bg-[#0d2338] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Settings</DialogTitle>
          <DialogDescription className="text-white/50">Bouncing ball, lyrics and vocal guide preferences</DialogDescription>
        </DialogHeader>
        <h4 className="mt-2 text-xs font-bold uppercase tracking-widest text-[#5ee7ff]">Bouncing ball</h4>
        <Row label="Ball color"><input data-testid="setting-ball-color" type="color" value={s.ballColor} onChange={(e) => update({ ballColor: e.target.value })} className="h-8 w-16 cursor-pointer rounded bg-transparent" /></Row>
        <Row label="Ball size"><Range id="setting-ball-size" value={s.ballSize} min={0.5} max={2} step={0.05} onChange={(v) => update({ ballSize: v })} /></Row>
        <Row label="Bounce height"><Range id="setting-bounce-height" value={s.bounceHeight} min={0.2} max={1.4} step={0.05} onChange={(v) => update({ bounceHeight: v })} /></Row>
        <Row label="Glow"><Range id="setting-glow" value={s.glow} min={0} max={1.5} step={0.05} onChange={(v) => update({ glow: v })} /></Row>
        <Row label="Motion curve">
          <select data-testid="setting-ball-motion" value={s.ballMotion} onChange={(e) => update({ ballMotion: e.target.value })} className="w-full rounded bg-[#0f3a55] px-2 py-1.5 text-sm">
            <option value="easeInOut">Ease-in-out</option><option value="sine">Sine wave</option><option value="linear">Linear</option>
          </select>
        </Row>
        <h4 className="mt-3 text-xs font-bold uppercase tracking-widest text-[#5ee7ff]">Lyrics</h4>
        <Row label="Highlight top"><input data-testid="setting-highlight-color" type="color" value={s.highlightColor} onChange={(e) => update({ highlightColor: e.target.value })} className="h-8 w-16 cursor-pointer rounded bg-transparent" /></Row>
        <Row label="Highlight bottom"><input data-testid="setting-highlight-color2" type="color" value={s.highlightColor2} onChange={(e) => update({ highlightColor2: e.target.value })} className="h-8 w-16 cursor-pointer rounded bg-transparent" /></Row>
        <Row label="Text size"><Range id="setting-font-scale" value={s.fontScale} min={0.6} max={1.5} step={0.05} onChange={(v) => update({ fontScale: v })} /></Row>
        <Row label="Lead-in countdown"><Switch data-testid="setting-countdown" checked={s.countdown} onCheckedChange={(v) => update({ countdown: v })} /></Row>
        <h4 className="mt-3 text-xs font-bold uppercase tracking-widest text-[#5ee7ff]">Audio & background</h4>
        <Row label="Guide vocal level"><Range id="setting-guide-volume" value={s.guideVolume} min={0.1} max={0.4} step={0.01} onChange={(v) => update({ guideVolume: v })} fmt={(v) => `${Math.round(v * 100)}%`} /></Row>
        <Row label="Theme">
          <select data-testid="setting-theme" value={s.theme} onChange={(e) => update({ theme: e.target.value })} className="w-full rounded bg-[#0f3a55] px-2 py-1.5 text-sm">
            {THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Row>
        <Row label="Background MP4 URL"><input data-testid="setting-video-url" value={s.videoUrl} onChange={(e) => update({ videoUrl: e.target.value })} placeholder="https://…/loop.mp4 (optional)" className="w-full rounded border border-white/15 bg-white/5 px-2 py-1.5 text-sm placeholder:text-white/30 focus:outline-none" /></Row>
        <button data-testid="settings-reset-btn" onClick={reset} className="mt-3 self-start rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/70 hover:bg-white/10">Reset to defaults</button>
      </DialogContent>
    </Dialog>
  );
}
