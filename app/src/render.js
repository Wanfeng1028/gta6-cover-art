// Sunset Cover Studio — the cover renderer.
//
// Draws a multi-panel GTA-style poster on a 2D canvas: a Vice City sunset sky
// (gradient, sun, skyline, palms), four photo panels with per-panel crop and
// colour grade, and bold outlined title lettering. Pure canvas, no network,
// no library. Every drawing here is original: no Rockstar logo, artwork or
// font is used anywhere.

export const SIZES = {
  square: { w: 1080, h: 1080, label: "1080 × 1080 · Square post" },
  portrait: { w: 1080, h: 1350, label: "1080 × 1350 · Portrait post" },
  wide: { w: 1920, h: 1080, label: "1920 × 1080 · Wide post" },
};

export const GRADES = ["sunset", "neon", "gold", "none"];

// Panel rectangles as fractions of the cover (x, y, w, h, rotation in degrees).
// Two layouts per size: "poster" is hero-led, "grid" is even panels.
export const LAYOUTS = {
  square: {
    poster: [
      { x: 0.04, y: 0.21, w: 0.56, h: 0.47, rot: -1.2 },
      { x: 0.63, y: 0.21, w: 0.33, h: 0.225, rot: 1.0 },
      { x: 0.63, y: 0.455, w: 0.33, h: 0.225, rot: -0.6 },
      { x: 0.04, y: 0.7, w: 0.92, h: 0.19, rot: 0.6 },
    ],
    grid: [
      { x: 0.04, y: 0.21, w: 0.45, h: 0.315, rot: -0.8 },
      { x: 0.51, y: 0.21, w: 0.45, h: 0.315, rot: 0.8 },
      { x: 0.04, y: 0.545, w: 0.45, h: 0.315, rot: 0.6 },
      { x: 0.51, y: 0.545, w: 0.45, h: 0.315, rot: -0.6 },
    ],
  },
  portrait: {
    poster: [
      { x: 0.05, y: 0.21, w: 0.9, h: 0.33, rot: -0.8 },
      { x: 0.05, y: 0.56, w: 0.435, h: 0.175, rot: 0.7 },
      { x: 0.515, y: 0.56, w: 0.435, h: 0.175, rot: -0.7 },
      { x: 0.05, y: 0.755, w: 0.9, h: 0.15, rot: 0.5 },
    ],
    grid: [
      { x: 0.05, y: 0.21, w: 0.435, h: 0.28, rot: -0.7 },
      { x: 0.515, y: 0.21, w: 0.435, h: 0.28, rot: 0.7 },
      { x: 0.05, y: 0.51, w: 0.435, h: 0.28, rot: 0.6 },
      { x: 0.515, y: 0.51, w: 0.435, h: 0.28, rot: -0.6 },
      { x: 0.05, y: 0.81, w: 0.9, h: 0.11, rot: 0.4 },
    ],
  },
  wide: {
    poster: [
      { x: 0.03, y: 0.21, w: 0.5, h: 0.565, rot: -1.0 },
      { x: 0.56, y: 0.21, w: 0.41, h: 0.27, rot: 0.8 },
      { x: 0.56, y: 0.5, w: 0.41, h: 0.275, rot: -0.6 },
      { x: 0.03, y: 0.8, w: 0.94, h: 0.105, rot: 0.4 },
    ],
    grid: [
      { x: 0.03, y: 0.21, w: 0.3, h: 0.565, rot: -0.8 },
      { x: 0.35, y: 0.21, w: 0.3, h: 0.565, rot: 0.6 },
      { x: 0.67, y: 0.21, w: 0.3, h: 0.565, rot: -0.5 },
      { x: 0.03, y: 0.8, w: 0.94, h: 0.105, rot: 0.4 },
    ],
  },
};

// A tiny deterministic PRNG so the skyline is the same on every render.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawSunsetSky(ctx, W, H) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.0, "#1b1035");
  sky.addColorStop(0.35, "#5b1b6e");
  sky.addColorStop(0.62, "#c62b7e");
  sky.addColorStop(0.82, "#ff7a3d");
  sky.addColorStop(1.0, "#ffb347");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Low sun with a warm glow, top right of the title band.
  const sunX = W * 0.86;
  const sunY = H * 0.085;
  const sunR = Math.min(W, H) * 0.062;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.2);
  glow.addColorStop(0, "rgba(255, 214, 102, 0.55)");
  glow.addColorStop(1, "rgba(255, 214, 102, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 3.2, sunY - sunR * 3.2, sunR * 6.4, sunR * 6.4);
  const disc = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
  disc.addColorStop(0, "#ffe9a8");
  disc.addColorStop(1, "#ff7a3d");
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
}

// A low skyline strip along the very bottom edge, below the panels: dark
// towers with a few lit windows, so it reads as a city and never as noise
// peeking out from behind a panel.
function drawSkyline(ctx, W, H) {
  const rand = mulberry32(20261119);
  const base = H;
  const top = H * 0.9;
  ctx.fillStyle = "#160826";
  let x = -W * 0.02;
  while (x < W * 1.02) {
    const bw = W * (0.03 + rand() * 0.06);
    const bh = (base - top) * (0.3 + rand() * 0.7);
    const by = base - bh;
    ctx.fillRect(x, by, bw, bh);
    // A rooftop antenna on some towers.
    if (rand() > 0.6) ctx.fillRect(x + bw / 2 - 1, by - H * 0.02, 2, H * 0.02);
    // A few lit windows.
    ctx.fillStyle = "rgba(255, 214, 102, 0.85)";
    const rows = Math.max(1, Math.floor(bh / (H * 0.03)));
    const cols = Math.max(1, Math.floor(bw / (W * 0.018)));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rand() > 0.7) {
          ctx.fillRect(x + W * 0.006 + c * (W * 0.018), by + H * 0.01 + r * (H * 0.03), W * 0.007, H * 0.012);
        }
      }
    }
    ctx.fillStyle = "#160826";
    x += bw + W * 0.008;
  }
}

function drawPalm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  // Curved trunk.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -70, 34, -128);
  ctx.stroke();
  // Fronds fanning from the crown.
  ctx.lineWidth = 5;
  const crownX = 34;
  const crownY = -128;
  for (let i = 0; i < 7; i++) {
    const angle = Math.PI * (0.08 + (i / 6) * 0.84);
    const len = 62 - Math.abs(i - 3) * 7;
    const tipX = crownX + Math.cos(angle) * len;
    const tipY = crownY - Math.sin(angle) * len * 0.55 - 14;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(
      crownX + Math.cos(angle) * len * 0.55,
      crownY - Math.sin(angle) * len * 0.9 - 10,
      tipX,
      tipY,
    );
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(crownX - 6, crownY + 6, 5, 0, Math.PI * 2);
  ctx.arc(crownX + 6, crownY + 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Cover-fit the photo into the panel, zoomed and panned: a positive panY
// slides the photo down, so the panel shows the photo's top (a face), and a
// negative panY shows its bottom.
function drawPhotoInto(ctx, img, rect, zoom, panX, panY) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + panX * Math.max(0, (dw - rect.w) / 2);
  const dy = rect.y + (rect.h - dh) / 2 + panY * Math.max(0, (dh - rect.h) / 2);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function applyGrade(ctx, rect, grade) {
  if (grade === "none") {
    vignette(ctx, rect, 0.18);
    return;
  }
  let tint;
  if (grade === "sunset") {
    tint = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    tint.addColorStop(0, "rgba(255, 122, 61, 0.20)");
    tint.addColorStop(1, "rgba(255, 46, 136, 0.30)");
  } else if (grade === "neon") {
    tint = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    tint.addColorStop(0, "rgba(255, 46, 136, 0.26)");
    tint.addColorStop(1, "rgba(34, 211, 238, 0.26)");
  } else {
    // gold
    tint = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    tint.addColorStop(0, "rgba(255, 214, 102, 0.16)");
    tint.addColorStop(1, "rgba(255, 140, 40, 0.26)");
  }
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  vignette(ctx, rect, 0.22);
}

function vignette(ctx, rect, strength) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const r = Math.max(rect.w, rect.h) * 0.75;
  const grad = ctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r);
  grad.addColorStop(0, "rgba(10, 4, 26, 0)");
  grad.addColorStop(1, `rgba(10, 4, 26, ${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

function drawEmptyPanel(ctx, rect, W) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, "#3a1c5e");
  grad.addColorStop(1, "#1b1035");
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = "rgba(245, 239, 230, 0.75)";
  ctx.font = `700 ${Math.max(14, W * 0.016)}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ADD A PHOTO", rect.x + rect.w / 2, rect.y + rect.h / 2);
}

function drawOnePanel(ctx, panel, img, W, H) {
  const rect = {
    x: panel.x * W,
    y: panel.y * H,
    w: panel.w * W,
    h: panel.h * H,
  };
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const rad = (panel.rot * Math.PI) / 180;
  const border = Math.max(3, W * 0.004);
  const radius = Math.max(4, W * 0.008);

  // Drop shadow, offset down-right.
  ctx.save();
  ctx.translate(cx + W * 0.006, cy + H * 0.008);
  ctx.rotate(rad);
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  roundedRectPath(ctx, -rect.w / 2, -rect.h / 2, rect.w, rect.h, radius);
  ctx.fill();
  ctx.restore();

  // Photo, clipped to the rounded panel.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rad);
  ctx.translate(-cx, -cy);
  roundedRectPath(ctx, rect.x, rect.y, rect.w, rect.h, radius);
  ctx.clip();
  if (img) {
    drawPhotoInto(ctx, img, rect, panel.zoom, panel.panX, panel.panY);
    applyGrade(ctx, rect, panel.grade);
  } else {
    drawEmptyPanel(ctx, rect, W);
  }
  ctx.restore();

  // Crisp white frame.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rad);
  ctx.translate(-cx, -cy);
  ctx.lineWidth = border;
  ctx.strokeStyle = "#ffffff";
  roundedRectPath(ctx, rect.x, rect.y, rect.w, rect.h, radius);
  ctx.stroke();
  ctx.restore();
}

function wrapTitleLines(ctx, title, maxWidth) {
  const words = title.toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
    if (lines.length === 1 && line === word && lines.length >= 1) {
      // Keep at most two lines; the second line may overflow slightly and is
      // shrunk by the caller instead.
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function drawTitleBlock(ctx, W, H, title, subtitle) {
  const pad = W * 0.04;
  const maxWidth = W * 0.92;
  // Sized so title + subtitle fit the band above the panels (panels start
  // at 0.21 of the height).
  let size = Math.min(H * 0.078, W * 0.115);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  // Shrink until the longest line fits.
  for (;;) {
    ctx.font = `${size}px Anton, sans-serif`;
    const lines = wrapTitleLines(ctx, title, maxWidth);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= maxWidth || size <= 20) break;
    size *= 0.94;
  }
  const lines = wrapTitleLines(ctx, title, maxWidth);
  const lineHeight = size * 0.98;
  const top = H * 0.02 + size;

  ctx.save();
  // A slight forward lean, poster style.
  ctx.transform(1, 0, -0.045, 1, H * 0.004, 0);
  lines.forEach((line, i) => {
    const y = top + i * lineHeight;
    // Magenta echo behind the letters.
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.fillStyle = "#ff2e88";
    ctx.fillText(line, pad + size * 0.045, y + size * 0.045);
    // Black outline, then white fill.
    ctx.lineWidth = Math.max(4, size * 0.085);
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#14082a";
    ctx.strokeText(line, pad, y);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(line, pad, y);
  });
  ctx.restore();

  // Subtitle: small tracked caps under the title.
  if (subtitle.trim()) {
    const subSize = Math.max(13, H * 0.02);
    ctx.font = `800 ${subSize}px Inter, sans-serif`;
    try {
      ctx.letterSpacing = `${Math.max(2, Math.round(H * 0.004))}px`;
    } catch {
      // Older canvas builds ignore letterSpacing; the text still draws.
    }
    ctx.fillStyle = "#ffd166";
    ctx.textAlign = "left";
    const subY = top + lines.length * lineHeight + subSize * 1.1;
    ctx.fillText(subtitle.toUpperCase(), pad, subY);
    try {
      ctx.letterSpacing = "0px";
    } catch {
      // ignore
    }
  }
}

function drawFooter(ctx, W, H) {
  const size = Math.max(11, H * 0.013);
  ctx.font = `600 ${size}px Inter, sans-serif`;
  const text = "MADE WITH SUNSET COVER STUDIO";
  const tw = ctx.measureText(text).width;
  const y = H - H * 0.012;
  // A dark pill keeps the line readable over the lit windows.
  ctx.fillStyle = "rgba(20, 8, 42, 0.65)";
  roundedRectPath(ctx, W / 2 - tw / 2 - 14, y - size - 8, tw + 28, size + 16, (size + 16) / 2);
  ctx.fill();
  ctx.fillStyle = "rgba(245, 239, 230, 0.85)";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, W / 2, y);
}

// The one entry point: draw the whole cover onto `canvas` at export size.
// `state` is { size, layout, title, subtitle, panels } and `photosById`
// maps a photo id to a loaded HTMLImageElement (or a canvas).
export function renderCover(canvas, state, photosById) {
  const size = SIZES[state.size] || SIZES.square;
  const W = size.w;
  const H = size.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d canvas unavailable");

  drawSunsetSky(ctx, W, H);
  // One palm leaning in from the top-right corner, its fronds over the sun.
  const palmScale = (Math.min(W, H) / 1080) * 1.7;
  drawPalm(ctx, W * 0.97, H * 0.32, palmScale, -0.28, "#14082a");
  drawSkyline(ctx, W, H);

  const layout = (LAYOUTS[state.size] || LAYOUTS.square)[state.layout] ||
    (LAYOUTS[state.size] || LAYOUTS.square).poster;
  const panels = state.panels.slice(0, layout.length);
  layout.forEach((panelDef, i) => {
    const panel = panels[i] || { zoom: 1, panX: 0, panY: 0, grade: "sunset" };
    const img = panel.photoId ? photosById.get(panel.photoId) || null : null;
    drawOnePanel(ctx, { ...panelDef, ...panel }, img, W, H);
  });

  drawTitleBlock(ctx, W, H, state.title, state.subtitle);
  drawFooter(ctx, W, H);
  return canvas;
}

// Render the cover off-screen at full export size and hand back a PNG blob.
export function exportCoverPng(state, photosById) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    try {
      renderCover(canvas, state, photosById);
    } catch (err) {
      reject(err);
      return;
    }
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG export failed"));
    }, "image/png");
  });
}
