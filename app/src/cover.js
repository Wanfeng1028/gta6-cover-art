// Neon Dusk Cover Maker — cover drawing engine.
// Everything here is drawn from scratch on a canvas: gradient sky, sun,
// a procedurally built skyline, photo panels, and bold outlined lettering.
// No image is fetched from the network; photos come from the user's machine
// or from the bundled samples under app/samples/.

export const GRADES = {
  sunset: {
    skyTop: '#2b1055', skyMid: '#ff5e78', skyLow: '#ff9a3c',
    sun: '#ffd166', sunGlow: 'rgba(255, 170, 60, 0.55)',
    skyline: '#1c0b2b', titleStroke: '#1c0b2b', accent: '#ffb35c',
    photoTint: 'rgba(255, 110, 60, 0.16)', panelBorder: '#ffe9d6',
  },
  neon: {
    skyTop: '#070a2e', skyMid: '#c62bff', skyLow: '#00e5ff',
    sun: '#ff5ce1', sunGlow: 'rgba(255, 92, 225, 0.5)',
    skyline: '#0a0620', titleStroke: '#0a0620', accent: '#00e5ff',
    photoTint: 'rgba(190, 60, 255, 0.16)', panelBorder: '#dffaff',
  },
  dusk: {
    skyTop: '#12082e', skyMid: '#6a3df0', skyLow: '#e064a8',
    sun: '#ffb35c', sunGlow: 'rgba(255, 150, 90, 0.45)',
    skyline: '#160a30', titleStroke: '#160a30', accent: '#c9a8ff',
    photoTint: 'rgba(120, 70, 240, 0.14)', panelBorder: '#eadfff',
  },
  original: {
    skyTop: '#101827', skyMid: '#334155', skyLow: '#94a3b8',
    sun: '#f8fafc', sunGlow: 'rgba(248, 250, 252, 0.35)',
    skyline: '#0f172a', titleStroke: '#0f172a', accent: '#f8fafc',
    photoTint: 'rgba(0, 0, 0, 0)', panelBorder: '#ffffff',
  },
};

// Panel rectangles as fractions of the cover [x, y, w, h, tilt-degrees].
export const LAYOUTS = {
  split: [
    [0.055, 0.07, 0.52, 0.60, -1.2],
    [0.605, 0.07, 0.34, 0.285, 1.0],
    [0.605, 0.385, 0.34, 0.285, -0.8],
  ],
  triptych: [
    [0.045, 0.07, 0.29, 0.60, -1.0],
    [0.355, 0.07, 0.29, 0.60, 0.6],
    [0.665, 0.07, 0.29, 0.60, -0.6],
  ],
  grid: [
    [0.055, 0.07, 0.435, 0.30, -0.8],
    [0.51, 0.07, 0.435, 0.30, 0.8],
    [0.055, 0.39, 0.435, 0.30, 0.7],
    [0.51, 0.39, 0.435, 0.30, -0.7],
  ],
  hero: [
    [0.055, 0.06, 0.89, 0.52, 0],
    [0.055, 0.61, 0.435, 0.20, -0.8],
    [0.51, 0.61, 0.435, 0.20, 0.8],
  ],
};

export function panelCount(layout) {
  return (LAYOUTS[layout] || LAYOUTS.split).length;
}

export function blankPanels(layout) {
  const n = panelCount(layout);
  const panels = [];
  for (let i = 0; i < n; i++) {
    panels.push({ img: null, name: '', zoom: 1, ox: 0, oy: 0 });
  }
  return panels;
}

// Deterministic skyline: same seed always builds the same city.
function skylineBuildings(seed, count) {
  let s = seed;
  const next = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      w: 0.028 + next() * 0.05,
      h: 0.06 + next() * 0.16,
      antenna: next() > 0.72,
    });
  }
  return out;
}

function drawSky(ctx, W, H, g) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, g.skyTop);
  sky.addColorStop(0.55, g.skyMid);
  sky.addColorStop(1, g.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sun with a soft halo, sitting low over the skyline.
  const sx = W * 0.68;
  const sy = H * 0.34;
  const sr = H * 0.13;
  const glow = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 2.6);
  glow.addColorStop(0, g.sunGlow);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - sr * 2.6, sy - sr * 2.6, sr * 5.2, sr * 5.2);
  ctx.fillStyle = g.sun;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();

  // Three tiny birds in the sky: two short strokes each, a classic
  // sunset detail that needs no borrowed artwork.
  ctx.strokeStyle = g.skyline;
  ctx.lineWidth = Math.max(2, H * 0.004);
  ctx.lineCap = 'round';
  const birds = [[0.16, 0.16, 1], [0.24, 0.11, 0.8], [0.31, 0.19, 0.65]];
  for (const [bx, by, bs] of birds) {
    const cx = bx * W;
    const cy = by * H;
    const s = bs * H * 0.016;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy);
    ctx.quadraticCurveTo(cx - s * 0.4, cy - s * 0.7, cx, cy);
    ctx.quadraticCurveTo(cx + s * 0.4, cy - s * 0.7, cx + s, cy);
    ctx.stroke();
  }
}

function drawSkyline(ctx, W, H, g) {
  const base = H * 0.86;
  // Solid ground band first, so the gaps between buildings never stripe
  // the bottom of the cover.
  ctx.fillStyle = g.skyline;
  ctx.fillRect(0, base, W, H - base);
  const buildings = skylineBuildings(20261119, 26);
  ctx.fillStyle = g.skyline;
  let x = -W * 0.01;
  for (const b of buildings) {
    const bw = b.w * W;
    const bh = b.h * H;
    ctx.fillRect(x, base - bh, bw, bh + H * 0.14);
    if (b.antenna) {
      ctx.fillRect(x + bw / 2 - 1, base - bh - H * 0.03, 2, H * 0.03);
    }
    x += bw + W * 0.004;
  }
  // A thin neon horizon line.
  ctx.fillStyle = g.accent;
  ctx.fillRect(0, base, W, Math.max(2, H * 0.004));
}

function drawPhotoCover(ctx, img, px, py, pw, ph, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = px + (pw - dw) / 2 + ox * pw;
  let dy = py + (ph - dh) / 2 + oy * ph;
  // When a panel is far wider than the photo, centring cuts the top of the
  // picture off, where faces usually are; lean toward the top so the face
  // stays in frame. The shift is computed at draw time, so it stays right
  // at every export size.
  if (dh > ph * 1.4) dy += 0.7 * (dh - ph) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPanels(ctx, W, H, state, g, selected) {
  const rects = LAYOUTS[state.layout];
  const r = Math.max(4, W * 0.012);
  state.panels.forEach((p, i) => {
    const [fx, fy, fw, fh, tilt] = rects[i];
    const x = fx * W;
    const y = fy * H;
    const w = fw * W;
    const h = fh * H;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.translate(-w / 2, -h / 2);
    roundRectPath(ctx, 0, 0, w, h, r);
    ctx.save();
    ctx.clip();
    if (p.img) {
      drawPhotoCover(ctx, p.img, 0, 0, w, h, p.zoom, p.ox, p.oy);
      if (g.photoTint !== 'rgba(0, 0, 0, 0)') {
        ctx.fillStyle = g.photoTint;
        ctx.fillRect(0, 0, w, h);
      }
    } else {
      const ph = ctx.createLinearGradient(0, 0, w, h);
      ph.addColorStop(0, 'rgba(255,255,255,0.16)');
      ph.addColorStop(1, 'rgba(255,255,255,0.03)');
      ctx.fillStyle = ph;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `600 ${Math.max(14, W * 0.016)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('＋ Add photo', w / 2, h / 2);
    }
    ctx.restore();
    ctx.lineWidth = i === selected ? Math.max(4, W * 0.008) : Math.max(3, W * 0.005);
    ctx.strokeStyle = i === selected ? '#ffffff' : g.panelBorder;
    ctx.stroke();
    if (i === selected) {
      ctx.lineWidth = Math.max(2, W * 0.003);
      ctx.strokeStyle = g.accent;
      roundRectPath(ctx, -W * 0.008, -W * 0.008, w + W * 0.016, h + W * 0.016, r + W * 0.008);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function wrapTitle(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function drawLettering(ctx, W, H, state, g) {
  const pad = W * 0.055;
  const titleSize = Math.min(W * 0.115, H * 0.115);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${titleSize}px Anton, sans-serif`;
  const maxW = W - pad * 2;
  const lines = wrapTitle(ctx, (state.title || 'UNTITLED').toUpperCase(), maxW);
  const lineH = titleSize * 1.02;
  const blockH = lines.length * lineH;
  let ty = H - H * 0.075 - blockH + titleSize;
  if (state.subtitle) ty -= H * 0.028;
  lines.forEach((line) => {
    ctx.save();
    ctx.translate(W * 0.012, H * 0.012);
    ctx.fillStyle = g.accent;
    ctx.fillText(line, pad, ty);
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.lineWidth = titleSize * 0.14;
    ctx.strokeStyle = g.titleStroke;
    ctx.strokeText(line, pad, ty);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, pad, ty);
    ty += lineH;
  });

  if (state.subtitle) {
    const subSize = Math.max(13, W * 0.021);
    ctx.font = `700 ${subSize}px Inter, sans-serif`;
    ctx.fillStyle = g.accent;
    const subY = H - H * 0.055;
    ctx.fillText(state.subtitle.toUpperCase(), pad, subY);
    const sw = ctx.measureText(state.subtitle.toUpperCase()).width;
    ctx.fillRect(pad, subY + subSize * 0.45, Math.min(sw, maxW), Math.max(2, H * 0.003));
  }
}

// Draw the whole cover into ctx at pixel size W x H.
// selected: index of the highlighted panel, or -1 for a clean export.
export function drawCover(ctx, W, H, state, selected = -1) {
  const g = GRADES[state.grade] || GRADES.sunset;
  ctx.clearRect(0, 0, W, H);
  drawSky(ctx, W, H, g);
  drawSkyline(ctx, W, H, g);
  drawPanels(ctx, W, H, state, g, selected);
  drawLettering(ctx, W, H, state, g);
}
