const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12];
const PROG = [
  [0, [0, 4, 7]],
  [7, [0, 4, 7]],
  [9, [0, 3, 7]],
  [5, [0, 4, 7]],
];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export class KaraokeEngine {
  constructor() {
    this.ctx = null;
    this.song = null;
    this.offset = 0;
    this.playing = false;
    this.nodes = [];
    this.guideOn = true;
    this.guideVolume = 0.25;
    this.onEnded = null;
  }

  ensure() {
    if (this.ctx) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(ctx.destination);
    this.instGain = ctx.createGain();
    this.instGain.gain.value = 0.8;
    this.instGain.connect(this.master);
    this.vocalGain = ctx.createGain();
    this.vocalGain.gain.value = this.guideOn ? this.guideVolume * 2 : 0;
    this.vocalGain.connect(this.master);
    const len = ctx.sampleRate * 0.3;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  async load(song, mediaUrl) {
    this.stopNodes();
    this.playing = false;
    clearInterval(this.timer);
    this.song = song;
    this.offset = 0;
    this.words = (song?.lines || []).flatMap((l) => l.words || []);
    this.buffers = null;
    if (!song?.has_audio) return;
    this.ensure();
    const stems = song.stems?.status === "cached";
    const fetchBuf = (kind) => fetch(mediaUrl(song.id, kind)).then((r) => r.arrayBuffer()).then((b) => this.ctx.decodeAudioData(b));
    const [inst, vocals] = await Promise.all([fetchBuf(stems ? "instrumental" : "original"), stems ? fetchBuf("vocals") : null]);
    if (this.song !== song) return;
    this.buffers = { inst, vocals };
  }

  get hasGuide() {
    return !this.song?.has_audio || !!this.buffers?.vocals;
  }

  startBuffers() {
    const t0 = this.at(this.offset);
    [["inst", this.instGain], ["vocals", this.vocalGain]].forEach(([k, dest]) => {
      const buf = this.buffers[k];
      if (!buf) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(dest);
      src.start(t0, this.offset);
      this.nodes.push(src);
    });
  }

  getTime() {
    if (!this.song) return 0;
    const t = this.playing ? this.ctx.currentTime - this.startCtx : this.offset;
    return Math.max(0, Math.min(t, this.song.duration));
  }

  async play() {
    if (!this.song || this.playing) return;
    this.ensure();
    await this.ctx.resume();
    if (this.offset >= this.song.duration - 0.05) this.offset = 0;
    this.startCtx = this.ctx.currentTime - this.offset + 0.05;
    this.scheduledUntil = this.offset;
    this.playing = true;
    if (this.buffers) this.startBuffers();
    this.timer = setInterval(() => this.tick(), 40);
    this.tick();
  }

  pause() {
    if (!this.playing) return;
    this.offset = this.getTime();
    this.playing = false;
    clearInterval(this.timer);
    this.stopNodes();
  }

  seek(t) {
    const was = this.playing;
    this.pause();
    this.offset = Math.max(0, Math.min(t, this.song?.duration || 0));
    if (was) this.play();
  }

  setGuide(on, volume = this.guideVolume) {
    this.guideOn = on;
    this.guideVolume = volume;
    if (!this.ctx) return;
    const g = this.vocalGain.gain;
    const now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    const level = this.buffers ? volume : volume * 2;
    g.linearRampToValueAtTime(on ? level : 0, now + 0.1);
  }

  stopNodes() {
    this.nodes.forEach((n) => {
      try { n.stop(0); } catch (e) { /* already stopped */ }
    });
    this.nodes = [];
  }

  tick() {
    const now = this.getTime();
    if (now >= this.song.duration - 0.01) {
      this.pause();
      this.offset = this.song.duration;
      this.onEnded && this.onEnded();
      return;
    }
    if (this.buffers) return;
    const from = this.scheduledUntil;
    const to = now + 0.3;
    const beat = 60 / (this.song.bpm || 100);
    for (let b = Math.ceil(from / beat - 1e-6); b * beat < to; b++) {
      if (b * beat >= from) this.scheduleBeat(b, b * beat, beat);
    }
    this.words.forEach((w, i) => {
      if (w.s >= from && w.s < to) this.scheduleWord(w, i);
    });
    this.scheduledUntil = to;
    if (this.nodes.length > 200) this.nodes = this.nodes.slice(-120);
  }

  at(songT) {
    return this.startCtx + songT;
  }

  tone(type, freq, start, dur, vol, dest, attack = 0.01) {
    const ctx = this.ctx;
    const t0 = Math.max(this.at(start), ctx.currentTime);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(dest);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    this.nodes.push(osc);
    return osc;
  }

  scheduleBeat(b, t, beat) {
    const ctx = this.ctx;
    const root = this.song.key_root || 57;
    const [deg, chord] = PROG[Math.floor(b / 4) % 4];
    const inBar = b % 4;
    const t0 = Math.max(this.at(t), ctx.currentTime);
    if (inBar === 0 || inBar === 2) {
      const k = ctx.createOscillator();
      const kg = ctx.createGain();
      k.frequency.setValueAtTime(140, t0);
      k.frequency.exponentialRampToValueAtTime(40, t0 + 0.15);
      kg.gain.setValueAtTime(0.9, t0);
      kg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
      k.connect(kg).connect(this.instGain);
      k.start(t0);
      k.stop(t0 + 0.3);
      this.nodes.push(k);
      this.tone("triangle", mtof(root - 12 + deg), t, beat * 1.8, 0.35, this.instGain);
    } else {
      const n = ctx.createBufferSource();
      n.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = 1800;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.25, t0);
      ng.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      n.connect(f).connect(ng).connect(this.instGain);
      n.start(t0);
      n.stop(t0 + 0.2);
      this.nodes.push(n);
    }
    if (inBar === 0) {
      chord.forEach((iv) => this.tone("sine", mtof(root + deg + iv), t, beat * 3.8, 0.07, this.instGain, 0.3));
    }
  }

  scheduleWord(w, i) {
    const root = (this.song.key_root || 57) + 12;
    const deg = MAJOR[(hash(w.w) + i) % 6];
    const dur = Math.max(0.15, w.e - w.s);
    const osc = this.tone("triangle", mtof(root + deg), w.s, dur + 0.1, 0.3, this.vocalGain, 0.04);
    const lfo = this.ctx.createOscillator();
    const lg = this.ctx.createGain();
    lfo.frequency.value = 5.5;
    lg.gain.value = 4;
    lfo.connect(lg).connect(osc.frequency);
    const t0 = Math.max(this.at(w.s), this.ctx.currentTime);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.15);
    this.nodes.push(lfo);
  }
}

export const engine = new KaraokeEngine();
