// Sunset Cover Studio — the editor.
//
// Wires the controls to the renderer (./render.js): photos in, panels cropped,
// title typed, cover exported. Photos are read on this machine only and are
// never uploaded. A `?shot=` query sets up a fixed scene for a screenshot
// (./shots.js) instead of the empty editor.

import { SIZES, LAYOUTS, renderCover, exportCoverPng } from "./render.js";
import { applyShotQuery } from "./shots.js";

const SAMPLES = {
  pier: { name: "Pier at dusk", url: "./samples/pier.jpg" },
  boulevard: { name: "Boulevard", url: "./samples/boulevard.jpg" },
};

const PANEL_NAMES = ["Panel 1", "Panel 2", "Panel 3", "Panel 4", "Panel 5"];

const state = {
  size: "wide",
  layout: "poster",
  title: "SUNSET HEIST",
  subtitle: "NEON NIGHTS · 2026",
  selected: 0,
  panels: [
    { photoId: null, zoom: 1, panX: 0, panY: 0, grade: "sunset" },
    { photoId: null, zoom: 1, panX: 0, panY: 0, grade: "sunset" },
    { photoId: null, zoom: 1, panX: 0, panY: 0, grade: "sunset" },
    { photoId: null, zoom: 1, panX: 0, panY: 0, grade: "sunset" },
    { photoId: null, zoom: 1, panX: 0, panY: 0, grade: "sunset" },
  ],
};

// id -> { id, name, img } for every photo the user added or sampled.
const photos = new Map();
let pickedPhotoId = null;
let photoCounter = 0;

const canvas = document.getElementById("preview");
const statusEl = document.getElementById("status");
const photoTray = document.getElementById("photoTray");
const panelPicker = document.getElementById("panelPicker");
const sizePicker = document.getElementById("sizePicker");
const layoutPicker = document.getElementById("layoutPicker");
const zoomInput = document.getElementById("zoom");
const panXInput = document.getElementById("panX");
const panYInput = document.getElementById("panY");
const gradeSelect = document.getElementById("grade");
const titleInput = document.getElementById("titleInput");
const subtitleInput = document.getElementById("subtitleInput");

function selectedPanel() {
  return state.panels[state.selected];
}

function layoutPanels() {
  return (LAYOUTS[state.size] || LAYOUTS.square)[state.layout] ||
    (LAYOUTS[state.size] || LAYOUTS.square).poster;
}

function renderPreview() {
  renderCover(canvas, state, new Map([...photos].map(([id, p]) => [id, p.img])));
}

// Loads an image from a URL, resolving to the image once it can be drawn.
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function addPhoto(img, name) {
  const id = `photo-${++photoCounter}`;
  photos.set(id, { id, name, img });
  return id;
}

function refreshTray() {
  photoTray.innerHTML = "";
  if (photos.size === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No photos yet — add one above, or try a sample.";
    photoTray.appendChild(empty);
    return;
  }
  for (const photo of photos.values()) {
    const thumb = document.createElement("img");
    thumb.src = photo.img.src;
    thumb.alt = photo.name;
    thumb.title = photo.name;
    if (photo.id === pickedPhotoId) thumb.classList.add("picked");
    thumb.addEventListener("click", () => {
      pickedPhotoId = photo.id;
      selectedPanel().photoId = photo.id;
      refreshTray();
      renderPreview();
    });
    photoTray.appendChild(thumb);
  }
}

function refreshPanelPicker() {
  panelPicker.innerHTML = "";
  layoutPanels().forEach((panel, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = PANEL_NAMES[i];
    if (i === state.selected) button.classList.add("active");
    button.addEventListener("click", () => {
      state.selected = i;
      syncPanelControls();
      refreshPanelPicker();
    });
    panelPicker.appendChild(button);
  });
}

function refreshSizePicker() {
  sizePicker.innerHTML = "";
  for (const [key, size] of Object.entries(SIZES)) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = size.label;
    if (key === state.size) button.classList.add("active");
    button.addEventListener("click", () => {
      state.size = key;
      state.selected = Math.min(state.selected, layoutPanels().length - 1);
      syncPanelControls();
      refreshSizePicker();
      refreshPanelPicker();
      renderPreview();
    });
    sizePicker.appendChild(button);
  }
}

function refreshLayoutPicker() {
  layoutPicker.innerHTML = "";
  for (const key of ["poster", "grid"]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = key === "poster" ? "Poster layout" : "Grid layout";
    if (key === state.layout) button.classList.add("active");
    button.addEventListener("click", () => {
      state.layout = key;
      state.selected = Math.min(state.selected, layoutPanels().length - 1);
      syncPanelControls();
      refreshLayoutPicker();
      refreshPanelPicker();
      renderPreview();
    });
    layoutPicker.appendChild(button);
  }
}

function syncPanelControls() {
  const panel = selectedPanel();
  zoomInput.value = String(panel.zoom);
  panXInput.value = String(panel.panX);
  panYInput.value = String(panel.panY);
  gradeSelect.value = panel.grade;
  document.getElementById("zoomOut").textContent = `${panel.zoom.toFixed(2)}×`;
  document.getElementById("panXOut").textContent = String(panel.panX.toFixed(2));
  document.getElementById("panYOut").textContent = String(panel.panY.toFixed(2));
}

function setStatus(text) {
  statusEl.textContent = text;
}

async function loadSamplePhoto(name) {
  const sample = SAMPLES[name];
  if (!sample) throw new Error(`unknown sample ${name}`);
  const img = await loadImage(sample.url);
  const id = addPhoto(img, sample.name);
  pickedPhotoId = id;
  return id;
}

function fillAllPanels(photoId) {
  for (const panel of state.panels) panel.photoId = photoId;
  renderPreview();
}

document.getElementById("photoInput").addEventListener("change", async (event) => {
  const files = [...event.target.files];
  if (files.length === 0) return;
  let firstId = null;
  for (const file of files) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      const id = addPhoto(img, file.name);
      if (firstId === null) firstId = id;
    } catch {
      setStatus(`Could not read ${file.name} — try another image.`);
    }
  }
  if (firstId !== null) {
    pickedPhotoId = firstId;
    if (!selectedPanel().photoId) selectedPanel().photoId = firstId;
  }
  refreshTray();
  renderPreview();
  setStatus(`${files.length} photo${files.length > 1 ? "s" : ""} added. Click a thumbnail to put it in the selected panel.`);
  event.target.value = "";
});

document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      const id = await loadSamplePhoto(button.dataset.sample);
      if (!selectedPanel().photoId) selectedPanel().photoId = id;
      refreshTray();
      renderPreview();
      setStatus(`Sample photo “${SAMPLES[button.dataset.sample].name}” loaded.`);
    } catch {
      setStatus("Could not load the sample photo.");
    }
  });
});

document.getElementById("fillAll").addEventListener("click", () => {
  if (!pickedPhotoId) {
    setStatus("Add a photo first, then fill every panel with it.");
    return;
  }
  fillAllPanels(pickedPhotoId);
  setStatus("Every panel now shows the selected photo.");
});

zoomInput.addEventListener("input", () => {
  selectedPanel().zoom = Number(zoomInput.value);
  syncPanelControls();
  renderPreview();
});
panXInput.addEventListener("input", () => {
  selectedPanel().panX = Number(panXInput.value);
  syncPanelControls();
  renderPreview();
});
panYInput.addEventListener("input", () => {
  selectedPanel().panY = Number(panYInput.value);
  syncPanelControls();
  renderPreview();
});
gradeSelect.addEventListener("change", () => {
  selectedPanel().grade = gradeSelect.value;
  renderPreview();
});
titleInput.addEventListener("input", () => {
  state.title = titleInput.value;
  renderPreview();
});
subtitleInput.addEventListener("input", () => {
  state.subtitle = subtitleInput.value;
  renderPreview();
});

document.getElementById("exportBtn").addEventListener("click", async () => {
  setStatus("Exporting…");
  try {
    const blob = await exportCoverPng(state, new Map([...photos].map(([id, p]) => [id, p.img])));
    const size = SIZES[state.size];
    const filename = `sunset-cover-${size.w}x${size.h}.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setStatus(`Saved ${filename} (${(blob.size / 1048576).toFixed(2)} MB).`);
  } catch {
    setStatus("Export failed — try again.");
  }
});

// Click a panel on the cover to select it; drag on it to pan the photo.
let drag = null;
function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
    rect,
  };
}
function hitPanel(point) {
  const W = canvas.width;
  const H = canvas.height;
  const panels = layoutPanels();
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (point.x >= p.x * W && point.x <= (p.x + p.w) * W &&
        point.y >= p.y * H && point.y <= (p.y + p.h) * H) {
      return i;
    }
  }
  return -1;
}
canvas.addEventListener("pointerdown", (event) => {
  const point = canvasPoint(event);
  const index = hitPanel(point);
  if (index === -1) return;
  state.selected = index;
  syncPanelControls();
  refreshPanelPicker();
  const panel = selectedPanel();
  drag = { startX: point.x, startY: point.y, panX: panel.panX, panY: panel.panY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const point = canvasPoint(event);
  const W = canvas.width;
  const H = canvas.height;
  const panel = selectedPanel();
  const def = layoutPanels()[state.selected];
  const dx = (point.x - drag.startX) / (def.w * W);
  const dy = (point.y - drag.startY) / (def.h * H);
  panel.panX = Math.max(-1, Math.min(1, drag.panX + dx * 2));
  panel.panY = Math.max(-1, Math.min(1, drag.panY + dy * 2));
  syncPanelControls();
  renderPreview();
});
canvas.addEventListener("pointerup", () => { drag = null; });
canvas.addEventListener("pointercancel", () => { drag = null; });

// Hooks the screenshot scenes (./shots.js) and the verification harness use.
const shotApi = {
  loadSamplePhoto,
  fillAllPanels,
  setTitle(text) {
    state.title = text;
    titleInput.value = text;
  },
  setSubtitle(text) {
    state.subtitle = text;
    subtitleInput.value = text;
  },
  setSize(key) {
    if (SIZES[key]) state.size = key;
  },
  setLayout(key) {
    if (key === "poster" || key === "grid") state.layout = key;
  },
  setGrade(grade) {
    for (const panel of state.panels) panel.grade = grade;
  },
  // Give the panels different crops of the same photo, so a one-photo cover
  // reads like a designed collage instead of four copies of one frame: the
  // hero keeps the face, the strip zooms into the top of the frame.
  varyCrops() {
    const crops = [
      { zoom: 1, panX: 0, panY: 0.5 },
      { zoom: 1.2, panX: 0, panY: 0.5 },
      { zoom: 1.3, panX: 0, panY: 0.5 },
      { zoom: 1, panX: 0, panY: 0.45 },
      { zoom: 1, panX: 0, panY: 0.45 },
    ];
    state.panels.forEach((panel, i) => Object.assign(panel, crops[i] || crops[0]));
  },
  coverOnly() {
    document.body.classList.add("shot-cover");
  },
  refresh() {
    refreshTray();
    refreshPanelPicker();
    refreshSizePicker();
    refreshLayoutPicker();
    syncPanelControls();
    renderPreview();
  },
  markReady() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__shotReady = true;
    }));
  },
};

window.__cover = {
  state,
  photos,
  render: renderPreview,
  exportDataUrl() {
    return exportCoverPng(state, new Map([...photos].map(([id, p]) => [id, p.img])))
      .then((blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("could not read exported PNG"));
        reader.readAsDataURL(blob);
      }));
  },
};

// Boot: load the display fonts first so the canvas lettering is exact,
// then paint once, then apply any fixed screenshot scene.
async function boot() {
  try {
    await Promise.all([
      document.fonts.load('100px "Anton"'),
      document.fonts.load('800 20px "Inter"'),
      document.fonts.load('600 12px "Inter"'),
    ]);
    await document.fonts.ready;
  } catch {
    // The canvas still draws with the fallback fonts.
  }
  refreshTray();
  refreshPanelPicker();
  refreshSizePicker();
  refreshLayoutPicker();
  syncPanelControls();
  renderPreview();
  const query = new URLSearchParams(location.search);
  if (query.get("shot")) {
    await applyShotQuery(query, shotApi);
  }
}

boot();
