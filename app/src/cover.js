// Neon Dusk cover engine: draws a multi-panel GTA-style poster on a 2D canvas.
// Every panel shows one photo, cover-fitted with its own zoom and pan, under a
// sunset or neon colour grade, with a big Anton title block on top.

export const LAYOUTS = {
  split: {
    label: "Split screen",
    panels: [
      [0, 0, 0.58, 1],
      [0.58, 0, 0.42, 1],
    ],
  },
  triptych: {
    label: "Triptych",
    panels: [
      [0, 0, 0.34, 1],
      [0.34, 0, 0.32, 1],
      [0.66, 0, 0.34, 1],
    ],
  },
  hero: {
    label: "Hero",
    panels: [
      [0, 0, 1, 0.68],
      [0, 0.68, 1, 0.32],
    ],
  },
};

export const GRADES = {
  sunset: {
    label: "Sunset",
    wash: ["rgba(255,122,26,0.20)", "rgba(255,46,136,0.22)"],
    warm: 0.5,
  },
  neon: {
    label: "Neon night",
    wash: ["rgba(255,46,136,0.26)", "rgba(46,230,255,0.20)"],
    warm: 0.1,
  },
  teal: {
    label: "Teal dusk",
    wash: ["rgba(20,180,190,0.22)", "rgba(10,40,90,0.28)"],
    warm: 0,
  },
  mono: {
    label: "Mono noir",
    wash: ["rgba(0,0,0,0.10)", "rgba(0,0,0,0.30)"],
    warm: 0,
  },
};

export const SIZES = {
  square: { label: "Square 1080 x 1080", width: 1080, height: 1080 },
  portrait: { label: "Portrait 1080 x 1350", width: 1080, height: 1350 },
  wide: { label: "Wide 1920 x 1080", width: 1920, height: 1080 },
};

export function createCoverState() {
  return {
    layout: "split",
    grade: "sunset",
    size: "square",
    title: "NEON DUSK",
    subtitle: "VICE CITY NIGHTS",
    neon: true,
    activePanel: 0,
    photos: [
      { image: null, zoom: 1, panX: 0, panY: 0 },
      { image: null, zoom: 1, panX: 0, panY: 0 },
      { image: null, zoom: 1, panX: 0, panY: 0 },
    ],
  };
}

export function panelRects(layoutName, width, height) {
  const layout = LAYOUTS[layoutName] || LAYOUTS.split;
  return layout.panels.map(function (p) {
    return {
      x: Math.round(p[0] * width),
      y: Math.round(p[1] * height),
      w: Math.round(p[2] * width),
      h: Math.round(p[3] * height),
    };
  });
}

export function hitPanel(layoutName, width, height, px, py) {
  const rects = panelRects(layoutName, width, height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return i;
  }
  return 0;
}

// Work out which slice of the photo fills a panel, cover-style, with zoom and pan.
export function coverSourceRect(imgW, imgH, rect, zoom, panX, panY) {
  const destRatio = rect.w / rect.h;
  const imgRatio = imgW / imgH;
  let sw;
  let sh;
  if (imgRatio > destRatio) {
    sh = imgH;
    sw = imgH * destRatio;
  } else {
    sw = imgW;
    sh = imgW / destRatio;
  }
  sw /= zoom;
  sh /= zoom;
  const maxX = imgW - sw;
  const maxY = imgH - sh;
  const sx = Math.max(0, Math.min(maxX, (maxX / 2) + panX * maxX));
  const sy = Math.max(0, Math.min(maxY, (maxY / 2) + panY * maxY));
  return { sx: sx, sy: sy, sw: sw, sh: sh };
}

function paintGrade(ctx, width, height, gradeName) {
  const grade = GRADES[gradeName] || GRADES.sunset;
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(1, grade.wash[1]);
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  if (grade.warm > 0) {
    const warm = ctx.createLinearGradient(0, height, 0, 0);
    warm.addColorStop(0, "rgba(255,120,30," + grade.warm * 0.28 + ")");
    warm.addColorStop(0.55, "rgba(255,120,30,0)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, width, height);
  }
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, "rgba(5,2,16,0.10)");
  shade.addColorStop(0.62, "rgba(5,2,16,0)");
  shade.addColorStop(1, "rgba(5,2,16,0.55)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function paintVignette(ctx, width, height) {
  const glow = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.35,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  glow.addColorStop(0, "rgba(0,0,0,0)");
  glow.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function paintTitleBlock(ctx, width, height, state) {
  const pad = Math.round(width * 0.045);
  const widthBased = Math.round(width * (state.layout === "hero" ? 0.105 : 0.085));
  // Keep the whole title block inside the lower third on wide hero covers,
  // where the width-based size would spill over the panel seam.
  const titleSize = Math.min(widthBased, Math.round(height * 0.16));
  const subSize = Math.max(18, Math.round(width * 0.026));
  const titleY = height - pad - subSize - Math.round(height * 0.02);
  const subY = height - pad;
  const title = (state.title || "NEON DUSK").toUpperCase();
  const subtitle = (state.subtitle || "").toUpperCase();

  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.font = titleSize + "px Anton, sans-serif";
  if (state.neon) {
    ctx.shadowColor = "#ff2e88";
    ctx.shadowBlur = Math.round(width * 0.028);
    ctx.fillStyle = "#ff5ea8";
    ctx.fillText(title, pad + 3, titleY + 3);
    ctx.shadowColor = "#2ee6ff";
    ctx.shadowBlur = Math.round(width * 0.012);
  } else {
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = Math.round(width * 0.008);
    ctx.shadowOffsetY = Math.round(width * 0.004);
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillText(title, pad, titleY);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "#ffc53d";
  ctx.fillRect(pad, titleY + Math.round(height * 0.022), Math.round(width * 0.16), Math.max(3, Math.round(height * 0.004)));
  ctx.restore();

  if (subtitle) {
    ctx.save();
    ctx.font = "700 " + subSize + "px Inter, sans-serif";
    try {
      ctx.letterSpacing = Math.round(subSize * 0.32) + "px";
    } catch (err) {
      // Older canvas builds ignore letterSpacing; the subtitle still draws.
    }
    ctx.fillStyle = "#f4eefc";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = Math.round(width * 0.006);
    ctx.fillText(subtitle, pad, subY);
    ctx.restore();
  }

  ctx.save();
  ctx.font = "700 " + Math.max(14, Math.round(width * 0.016)) + "px Inter, sans-serif";
  ctx.fillStyle = "rgba(244,238,252,0.85)";
  ctx.textAlign = "right";
  ctx.fillText("NEON DUSK COVER MAKER", width - pad, pad + Math.round(width * 0.016));
  ctx.restore();
}

function paintPlaceholder(ctx, rect) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, "#3b2a63");
  grad.addColorStop(1, "#14102a");
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.save();
  ctx.strokeStyle = "rgba(244,238,252,0.5)";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(rect.x + 14, rect.y + 14, rect.w - 28, rect.h - 28);
  ctx.fillStyle = "rgba(244,238,252,0.75)";
  ctx.font = "700 " + Math.max(16, Math.round(rect.w * 0.05)) + "px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ADD A PHOTO", rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.restore();
}

export function drawCover(canvas, state) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const rects = panelRects(state.layout, width, height);
  const gutter = Math.max(3, Math.round(width * 0.006));

  ctx.save();
  ctx.fillStyle = "#0c0916";
  ctx.fillRect(0, 0, width, height);

  rects.forEach(function (rect, i) {
    const slot = state.photos[i] || state.photos[0];
    const inner = {
      x: rect.x + (i === 0 ? 0 : gutter / 2),
      y: rect.y + (i === 0 ? 0 : gutter / 2),
      w: rect.w - (i === 0 ? gutter / 2 : gutter),
      h: rect.h - (i === 0 ? gutter / 2 : gutter),
    };
    if (rects.length > 1 && i === rects.length - 1) {
      inner.w = rect.x + rect.w - inner.x;
      inner.h = rect.y + rect.h - inner.y;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(inner.x, inner.y, inner.w, inner.h);
    ctx.clip();
    if (slot && slot.image) {
      if (state.grade === "mono") ctx.filter = "grayscale(1) contrast(1.08)";
      const src = coverSourceRect(slot.image.naturalWidth || slot.image.width, slot.image.naturalHeight || slot.image.height, inner, slot.zoom, slot.panX, slot.panY);
      ctx.drawImage(slot.image, src.sx, src.sy, src.sw, src.sh, inner.x, inner.y, inner.w, inner.h);
      ctx.filter = "none";
    } else {
      paintPlaceholder(ctx, inner);
    }
    ctx.restore();
  });

  paintGrade(ctx, width, height, state.grade);
  paintVignette(ctx, width, height);
  paintTitleBlock(ctx, width, height, state);
  ctx.restore();
  return canvas;
}

export function exportCoverPNG(state, width, height) {
  const off = document.createElement("canvas");
  off.width = width;
  off.height = height;
  drawCover(off, state);
  return off.toDataURL("image/png");
}
