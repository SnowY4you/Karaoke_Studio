// Menu bar - lyrics_viewer: app_icon - Home
// Menu bar - Console: app_icon - Home - View - Settings - Help
// Home -> go to home screen
// View/Console -> Console to easy add songs to queue from a desktop
// View/Cast -> Cast Karaoke app on full screen to TV (while Console stays available on desktop)
// Settings/Create Playlist
// Help/About -> app name, app version, autor name

import { Home, Cast, Mic2, Music2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { THEMES } from "@/lib/settings";

const navBtn = "rounded-md px-5 py-2 text-[17px] font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white";

export default function TopBar({ onHome, onSettings, onHelp, onStage, onFullscreen, settings, updateSettings, focus, setFocus }) {
  return (
    <header data-testid="top-bar" className="flex h-16 shrink-0 items-center gap-2 bg-[#0f3a55] px-3 shadow-[0_2px_20px_rgba(0,0,0,0.35)]">
      <div data-testid="app-logo" className="relative mr-1 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2a6f93] to-[#163f5c] shadow-[0_0_18px_rgba(94,231,255,0.35)]">
        <Mic2 className="h-7 w-7 text-[#ff4fd8]" />
        <Music2 className="absolute bottom-1 right-1 h-3.5 w-3.5 text-[#5ee7ff]" />
      </div>
      <button data-testid="nav-home-btn" onClick={onHome} className="rounded-md p-2 text-[#22b8d6] transition-colors hover:bg-white/10" title="Home / Library">
        <Home className="h-8 w-8" fill="currentColor" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="nav-view-btn" className={navBtn}>View</DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 border-[#1e4d6b] bg-[#0d2338] text-white">
          <DropdownMenuLabel>Background layer</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={settings.theme} onValueChange={(v) => updateSettings({ theme: v })}>
            {THEMES.map((t) => (
              <DropdownMenuRadioItem data-testid={`view-theme-${t.id}`} key={t.id} value={t.id}>{t.name}</DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuCheckboxItem data-testid="view-focus-toggle" checked={focus} onCheckedChange={setFocus}>Focus stage (hide panels)</DropdownMenuCheckboxItem>
          <DropdownMenuItem data-testid="view-fullscreen-btn" onClick={onFullscreen}>Full-screen stage</DropdownMenuItem>
          <DropdownMenuItem data-testid="view-stage-window-btn" onClick={onStage}>Open stage window (2nd display)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button data-testid="nav-settings-btn" onClick={onSettings} className={navBtn}>Settings</button>
      <button data-testid="nav-help-btn" onClick={onHelp} className={navBtn}>Help</button>
      <div className="flex-1" />
      <button data-testid="cast-stage-btn" onClick={onStage} title="Stage mode: project to TV / projector" className="rounded-md p-2 text-[#22b8d6] transition-colors hover:bg-white/10">
        <Cast className="h-9 w-9" />
      </button>
    </header>
  );
}
