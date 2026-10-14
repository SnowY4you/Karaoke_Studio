import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const get = (u, params) => axios.get(`${API}${u}`, { params }).then((r) => r.data);
const post = (u, body) => axios.post(`${API}${u}`, body).then((r) => r.data);
const put = (u, body) => axios.put(`${API}${u}`, body).then((r) => r.data);
const del = (u) => axios.delete(`${API}${u}`).then((r) => r.data);

export const api = {
  songs: (params) => get("/songs", params),
  song: (id) => get(`/songs/${id}`),
  toggleFavorite: (id) => post(`/songs/${id}/favorite`),
  registerPlay: (id) => post(`/songs/${id}/play`),
  deleteSong: (id) => del(`/songs/${id}`),
  genres: () => get("/genres"),
  queue: () => get("/queue"),
  enqueue: (song_id) => post("/queue", { song_id }),
  setQueue: (song_ids) => put("/queue", { song_ids }),
  dequeue: (index) => del(`/queue/${index}`),
  popQueue: () => post("/queue/pop"),
  history: () => get("/history"),
  clearHistory: () => del("/history"),
  playlists: () => get("/playlists"),
  playlist: (id) => get(`/playlists/${id}`),
  createPlaylist: (name) => post("/playlists", { name }),
  deletePlaylist: (id) => del(`/playlists/${id}`),
  addToPlaylist: (id, song_id) => post(`/playlists/${id}/songs`, { song_id }),
  removeFromPlaylist: (id, songId) => del(`/playlists/${id}/songs/${songId}`),
  enqueuePlaylist: (id) => post(`/playlists/${id}/enqueue`),
  lrcSearch: (q) => get("/lrclib/search", { q }),
  importSong: (form, onProgress) =>
    axios.post(`${API}/import`, form, { onUploadProgress: (e) => onProgress?.(e.total ? e.loaded / e.total : 0) }).then((r) => r.data),
  imports: () => get("/imports"),
  reprocess: (id, lyrics_mode, separate = false) => post(`/songs/${id}/reprocess`, { lyrics_mode, separate }),
  uploadStems: (id, form) => axios.post(`${API}/songs/${id}/stems`, form).then((r) => r.data),
  mediaUrl: (id, kind) => `${API}/media/${id}/${kind}`,
  lrcImport: (lrclib_id, genre) => post("/lrclib/import", { lrclib_id, genre }),
};

export const fmt = (s) => {
  if (s == null || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};
