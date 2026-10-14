import { useEffect, useState } from "react";

export const DEFAULT_SETTINGS = {
  ballColor: "#ff4fd8",
  highlightColor: "#5ee7ff",
  highlightColor2: "#1f6fe0",
  ballSize: 1,
  bounceHeight: 0.6,
  glow: 0.8,
  ballMotion: "easeInOut",
  guideVolume: 0.25,
  countdown: true,
  fontScale: 1,
  theme: "lavender",
  videoUrl: "",
};

const KEY = "karaoke-studio-settings";

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(settings)), [settings]);
  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));
  return [settings, update, () => setSettings(DEFAULT_SETTINGS)];
}

export const THEMES = [
  { id: "lavender", name: "Lavender Haze" },
  { id: "aurora", name: "Deep Aurora" },
  { id: "neon", name: "Neon Grid" },
  { id: "genre", name: "Genre Photo" },
];
