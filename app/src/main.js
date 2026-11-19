// Neon Dusk Cover Maker — editor wiring.
// Owns the app state, the live preview canvas, panel dragging/zooming,
// the controls, PNG export, and the ?shot= staged scenes for screenshots.
import { GRADES, LAYOUTS, blankPanels, drawCover, panelCount } from './cover.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');

const state = {
  layout: 'split',
  grade: 'sunset',
  title: 'NEON SUNSET',
  subtitle: 'ONE LAST RIDE',
  size: '1080x1080',
  panels: blankPanels('split'),
};

let selected = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;

const $ = (id) => document.getElementById(id);

function previewSize() {
  // The preview canvas is always square in the editor; the export canvas
  // takes the real aspect ratio at export time.
  return { w: 1080, h: 1080 };
}

function render() {
  const { w, h } = previewSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(ctx, w, h, state, document.body.classList.contains('shot-cover') ? -1 : selected);
  $('panel-label').textContent = String(selected + 1);
  $('panel-count').textContent = String(state.panels.length);
  const p = state.panels[selected];
  if (p) {
    $('zoom').value = String(p.zoom);
    $('zoom-value').textContent = p.zoom.toFixed(2) + '×';
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load image'));
    img.src = src;
  });
}

async function loadSample(name) {
  const img = await loadImage('samples/' + name + '.jpg');
  return img;
}

function setPanelPhoto(img, name) {
  const p = state.panels[selected];
  p.img = img;
  p.name = name;
  p.zoom = 1;
  p.ox = 0;
  p.oy = 0;
  render();
}

$('file-input').addEventListener('change', (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const img = await loadImage(String(reader.result));
      setPanelPhoto(img, file.name);
    } catch (err) {
      $('export-status').textContent = 'That file could not be read as a photo.';
    }
  };
  reader.readAsDataURL(file);
  event.target.value = '';
});

$('sample-pier').addEventListener('click', async () => {
  setPanelPhoto(await loadSample('pier'), 'pier.jpg');
});
$('sample-boulevard').addEventListener('click', async () => {
  setPanelPhoto(await loadSample('boulevard'), 'boulevard.jpg');
});

$('apply-all').addEventListener('click', () => {
  const src = state.panels[selected];
  if (!src.img) return;
  state.panels.forEach((p) => {
    p.img = src.img;
    p.name = src.name;
    p.zoom = src.zoom;
    p.ox = src.ox;
    p.oy = src.oy;
  });
  render();
});

$('clear-photo').addEventListener('click', () => {
  const p = state.panels[selected];
  p.img = null;
  p.name = '';
  p.zoom = 1;
  p.ox = 0;
  p.oy = 0;
  render();
});

$('layout-row').addEventListener('click', (event) => {
  const btn = event.target.closest('[data-layout]');
  if (!btn) return;
  const layout = btn.dataset.layout;
  const keep = state.panels.map((p) => ({ ...p }));
  state.layout = layout;
  state.panels = blankPanels(layout);
  state.panels.forEach((p, i) => {
    if (keep[i]) Object.assign(p, keep[i]);
  });
  selected = 0;
  document.querySelectorAll('#layout-row button').forEach((b) => {
    b.classList.toggle('active', b === btn);
  });
  render();
});

$('grade-row').addEventListener('click', (event) => {
  const btn = event.target.closest('[data-grade]');
  if (!btn) return;
  state.grade = btn.dataset.grade;
  document.querySelectorAll('#grade-row button').forEach((b) => {
    b.classList.toggle('active', b === btn);
  });
  render();
});

$('zoom').addEventListener('input', (event) => {
  state.panels[selected].zoom = Number(event.target.value);
  render();
});
$('zoom-in').addEventListener('click', () => {
  const p = state.panels[selected];
  p.zoom = Math.min(3, p.zoom + 0.1);
  render();
});
$('zoom-out').addEventListener('click', () => {
  const p = state.panels[selected];
  p.zoom = Math.max(1, p.zoom - 0.1);
  render();
});
$('reset-pan').addEventListener('click', () => {
  const p = state.panels[selected];
  p.zoom = 1;
  p.ox = 0;
  p.oy = 0;
  render();
});

$('title').addEventListener('input', (event) => {
  state.title = event.target.value;
  render();
});
$('subtitle').addEventListener('input', (event) => {
  state.subtitle = event.target.value;
  render();
});
$('size').addEventListener('change', (event) => {
  state.size = event.target.value;
});

function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const rects = LAYOUTS[state.layout];
  for (let i = rects.length - 1; i >= 0; i--) {
    const [fx, fy, fw, fh] = rects[i];
    if (x >= fx * canvas.width && x <= (fx + fw) * canvas.width &&
        y >= fy * canvas.height && y <= (fy + fh) * canvas.height) {
      return { index: i, x, y, rect: [fx * canvas.width, fy * canvas.height, fw * canvas.width, fh * canvas.height] };
    }
  }
  return null;
}

canvas.addEventListener('pointerdown', (event) => {
  const hit = panelAt(event.clientX, event.clientY);
  if (!hit) return;
  selected = hit.index;
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
  render();
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const p = state.panels[selected];
  const [, , pw, ph] = panelAt(lastX, lastY)?.rect || [0, 0, 1, 1];
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  p.ox += ((event.clientX - lastX) * scaleX) / pw;
  p.oy += ((event.clientY - lastY) * scaleY) / ph;
  p.ox = Math.max(-1, Math.min(1, p.ox));
  p.oy = Math.max(-1, Math.min(1, p.oy));
  lastX = event.clientX;
  lastY = event.clientY;
  render();
});

canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointercancel', () => { dragging = false; });

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const hit = panelAt(event.clientX, event.clientY);
  if (!hit) return;
  selected = hit.index;
  const p = state.panels[selected];
  p.zoom = Math.max(1, Math.min(3, p.zoom - event.deltaY * 0.0015));
  render();
}, { passive: false });

// Render one cover at real export size and return a PNG data URL.
export function exportCover(size) {
  const [w, h] = size.split('x').map(Number);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d');
  drawCover(octx, w, h, state, -1);
  return off.toDataURL('image/png');
}

$('export').addEventListener('click', () => {
  const url = exportCover(state.size);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'neon-dusk-cover-' + state.size + '.png';
  a.click();
  $('export-status').textContent = 'Exported ' + state.size + ' PNG.';
});

// Test and screenshot hooks: the staged scenes call these.
window.__app = {
  state,
  render,
  exportCover,
  loadSample,
  setPanelPhoto,
  setSelected(i) { selected = i; render(); },
  setLayout(layout) {
    state.layout = layout;
    state.panels = blankPanels(layout);
    selected = 0;
    render();
  },
  setGrade(grade) { state.grade = grade; render(); },
  setTitle(t) { state.title = t; $('title').value = t; render(); },
  setSubtitle(t) { state.subtitle = t; $('subtitle').value = t; render(); },
};

// Staged scenes (?shot=editor or ?shot=cover) for screenshots.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const photoName = params.get('photo') || 'pier';
const caption = params.get('caption');

async function stageShot() {
  if (!shot) return;
  document.body.classList.add('shot-' + shot);
  if (caption) {
    state.title = caption;
    $('title').value = caption;
  }
  const sub = params.get('subtitle');
  if (sub) {
    state.subtitle = sub;
    $('subtitle').value = sub;
  }
  const layout = params.get('layout');
  if (layout && LAYOUTS[layout]) {
    state.layout = layout;
    state.panels = blankPanels(layout);
    document.querySelectorAll('#layout-row button').forEach((b) => {
      b.classList.toggle('active', b.dataset.layout === layout);
    });
  }
  const grade = params.get('grade');
  if (grade && GRADES[grade]) {
    state.grade = grade;
    document.querySelectorAll('#grade-row button').forEach((b) => {
      b.classList.toggle('active', b.dataset.grade === grade);
    });
  }
  try {
    const img = await loadSample(photoName);
    state.panels.forEach((p) => {
      p.img = img;
      p.name = photoName + '.jpg';
    });
  } catch (err) {
    // A staged scene without a photo still renders the skyline + lettering.
  }
  // Wait for the display fonts before the first staged draw.
  try { await document.fonts.ready; } catch (err) { /* fall back to system fonts */ }
  render();
  window.__ready = true;
}

if (shot) {
  stageShot();
} else {
  document.fonts.ready.then(render).catch(render);
  render();
}
