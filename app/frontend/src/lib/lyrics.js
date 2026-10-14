const ease = {
  linear: (p) => p,
  easeInOut: (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
  sine: (p) => 0.5 - Math.cos(Math.PI * p) / 2,
};

export function lyricState(lines, t) {
  let i = -1;
  for (let k = 0; k < lines.length; k++) if (lines[k].start <= t) i = k;
  if (i >= 0 && t <= lines[i].end + 0.5) return { active: i, upcoming: i + 1, inGap: false };
  return { active: -1, upcoming: i + 1, inGap: true };
}

function layout(ctx, line, W, size) {
  ctx.font = `800 ${size}px "Baloo 2", "Rubik", sans-serif`;
  const space = ctx.measureText(" ").width;
  const widths = line.words.map((w) => ctx.measureText(w.w).width);
  const total = widths.reduce((a, b) => a + b, 0) + space * (widths.length - 1);
  if (total > W * 0.92) return layout(ctx, line, W, size * ((W * 0.92) / total));
  let x = (W - total) / 2;
  const boxes = widths.map((w) => {
    const b = { x, w };
    x += w + space;
    return b;
  });
  return { size, boxes, x0: boxes[0]?.x || 0, total };
}

function sweepX(line, lay, t) {
  const ws = line.words;
  if (t < ws[0].s) return lay.x0;
  for (let k = 0; k < ws.length; k++) {
    const w = ws[k];
    const b = lay.boxes[k];
    if (t < w.s) return b.x;
    if (t <= w.e) return b.x + b.w * ((t - w.s) / Math.max(0.01, w.e - w.s));
  }
  return lay.x0 + lay.total + 4;
}

function drawLine(ctx, line, lay, y, t, s, highlight, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `800 ${lay.size}px "Baloo 2", "Rubik", sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, lay.size * 0.12);
  const paint = (stroke, fill) => {
    line.words.forEach((w, k) => {
      ctx.strokeStyle = stroke;
      ctx.strokeText(w.w, lay.boxes[k].x, y);
      ctx.fillStyle = fill;
      ctx.fillText(w.w, lay.boxes[k].x, y);
    });
  };
  paint("rgba(10,26,48,0.9)", "#ffffff");
  if (highlight) {
    const px = sweepX(line, lay, t);
    ctx.beginPath();
    ctx.rect(lay.x0 - 10, y - lay.size * 1.2, px - lay.x0 + 10, lay.size * 1.7);
    ctx.clip();
    const g = ctx.createLinearGradient(0, y - lay.size, 0, y);
    g.addColorStop(0, s.highlightColor);
    g.addColorStop(1, s.highlightColor2);
    paint("#ffffff", g);
  }
  ctx.restore();
}

function drawBall(ctx, line, lay, y, t, s) {
  const ws = line.words;
  const lead = 0.6;
  if (t < ws[0].s - lead || t > line.end + 0.4) return;
  const r = lay.size * 0.16 * s.ballSize;
  const baseY = y - lay.size * 0.95 - r;
  const cx = (k) => lay.boxes[k].x + lay.boxes[k].w / 2;
  const h = lay.size * s.bounceHeight;
  let p0, p1, p;
  if (t < ws[0].s) {
    p0 = lay.x0 - lay.size;
    p1 = cx(0);
    p = (t - (ws[0].s - lead)) / lead;
  } else {
    let k = ws.length - 1;
    for (let j = 0; j < ws.length - 1; j++) if (t >= ws[j].s && t < ws[j + 1].s) k = j;
    if (k === ws.length - 1) {
      p0 = p1 = cx(k);
      p = Math.min(1, (t - ws[k].s) / Math.max(0.2, ws[k].e - ws[k].s));
    } else {
      p0 = cx(k);
      p1 = cx(k + 1);
      p = (t - ws[k].s) / (ws[k + 1].s - ws[k].s);
    }
  }
  const e = (ease[s.ballMotion] || ease.easeInOut)(Math.max(0, Math.min(1, p)));
  const bez = (q) => {
    const c = (p0 + p1) / 2;
    const x = (1 - q) * (1 - q) * p0 + 2 * (1 - q) * q * c + q * q * p1;
    const yy = (1 - q) * (1 - q) * baseY + 2 * (1 - q) * q * (baseY - h * 2) + q * q * baseY;
    return [x, p0 === p1 ? baseY - h * 0.25 * Math.sin(Math.PI * q) : yy];
  };
  ctx.save();
  for (let g = 3; g >= 1; g--) {
    const [gx, gy] = bez(Math.max(0, e - g * 0.07));
    ctx.globalAlpha = 0.12 * (4 - g);
    ctx.fillStyle = s.ballColor;
    ctx.beginPath();
    ctx.arc(gx, gy, r * (1 - g * 0.15), 0, Math.PI * 2);
    ctx.fill();
  }
  const [bx, by] = bez(e);
  const squash = e > 0.92 || e < 0.08 ? 0.82 : 1;
  ctx.globalAlpha = 1;
  ctx.shadowColor = s.ballColor;
  ctx.shadowBlur = 30 * s.glow;
  const grad = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, r * 0.1, bx, by, r);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.35, s.ballColor);
  grad.addColorStop(1, s.ballColor);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(bx, by + r * (1 - squash), r / squash, r * squash, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCountdown(ctx, W, y, remaining, label, s) {
  const n = Math.ceil(remaining);
  const r = Math.min(W / 60, 14);
  const gap = r * 3.2;
  const startX = W / 2 - gap * 2;
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const lit = i < n;
    ctx.beginPath();
    ctx.arc(startX + i * gap, y, r, 0, Math.PI * 2);
    ctx.fillStyle = lit ? s.ballColor : "rgba(255,255,255,0.18)";
    ctx.shadowColor = s.ballColor;
    ctx.shadowBlur = lit ? 20 * s.glow : 0;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.font = `700 ${r * 1.6}px "Rubik", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.strokeStyle = "rgba(10,26,48,0.7)";
  ctx.lineWidth = 4;
  ctx.strokeText(`${label}  ${n}`, W / 2, y - r * 2.4);
  ctx.fillText(`${label}  ${n}`, W / 2, y - r * 2.4);
  ctx.restore();
}

function drawCenterLabel(ctx, W, y, text, size, alpha = 0.9) {
  ctx.save();
  ctx.font = `700 ${size}px "Rubik", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.strokeStyle = "rgba(10,26,48,0.75)";
  ctx.lineWidth = 5;
  ctx.strokeText(text, W / 2, y);
  ctx.fillText(text, W / 2, y);
  ctx.restore();
}

export function drawLyrics(ctx, W, H, song, t, s) {
  ctx.clearRect(0, 0, W, H);
  if (!song?.lines?.length) {
    drawCenterLabel(ctx, W, H / 2, song ? "No lyrics available" : "Pick a song to start singing", Math.max(16, W / 34), 0.75);
    return;
  }
  const lines = song.lines;
  const base = Math.max(18, Math.min(W / 17, 72)) * s.fontScale;
  const y1 = H * 0.48;
  const y2 = y1 + base * 1.45;
  const st = lyricState(lines, t);
  const topIdx = st.inGap ? st.upcoming : st.active;
  const top = lines[topIdx];
  const next = lines[topIdx + 1];
  if (top) {
    const lay = layout(ctx, top, W, base);
    drawLine(ctx, top, lay, y1, t, s, !st.inGap, 1);
    if (!st.inGap || top.start - t < 1.2) drawBall(ctx, top, lay, y1, t, s);
  }
  if (next) drawLine(ctx, next, layout(ctx, next, W, base * 0.82), y2, t, s, false, 0.7);
  if (st.inGap && top) {
    const gapStart = st.upcoming > 0 ? lines[st.upcoming - 1].end : 0;
    const remaining = top.start - t;
    const longGap = top.start - gapStart >= 5;
    const label = st.upcoming === 0 ? "Get ready" : "Back in";
    if (s.countdown && longGap && remaining > 0 && remaining <= 5) {
      drawCountdown(ctx, W, y1 - base * 1.6, remaining, label, s);
    } else if (longGap && remaining > 5) {
      const txt = st.upcoming === 0 ? `${song.title} — ${song.artist}` : "♪  Instrumental break  ♪";
      drawCenterLabel(ctx, W, y1 - base * 1.5, txt, Math.max(14, base * 0.5));
    }
  }
  if (!top && t > 0) drawCenterLabel(ctx, W, y1, "♪  Thanks for singing!  ♪", base * 0.7);
}
