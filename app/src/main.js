// Neon Dusk Cover Maker: wires the editor controls to the cover engine and
// handles photos, panel picking, drag-to-pan, wheel zoom and PNG export.

import {
  createCoverState,
  drawCover,
  exportCoverPNG,
  hitPanel,
  panelRects,
  LAYOUTS,
  SIZES,
} from "./cover.js";

const state = createCoverState();
const canvas = document.getElementById("coverCanvas");
const statusText = document.getElementById("statusText");
const downloadLink = document.getElementById("downloadLink");
const panelCount = document.getElementById("panelCount");
const zoomRange = document.getElementById("zoomRange");

let redrawQueued = false;

function redraw() {
  if (redrawQueued) return;
  redrawQueued = true;
  requestAnimationFrame(function () {
    redrawQueued = false;
    drawCover(canvas, state);
    const rects = panelRects(state.layout, canvas.width, canvas.height);
    panelCount.textContent = String(rects.length);
  });
}

function setStatus(message) {
  statusText.textContent = message;
}

function activeSlot() {
  return state.photos[state.activePanel] || state.photos[0];
}

function loadImage(url) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () {
      resolve(img);
    };
    img.onerror = function () {
      reject(new Error("Could not load image: " + url));
    };
    img.src = url;
  });
}

function putPhotoInPanel(image, index) {
  const slot = state.photos[index];
  slot.image = image;
  slot.zoom = 1;
  slot.panX = 0;
  slot.panY = 0;
  zoomRange.value = "1";
}

async function loadSample(url, index) {
  setStatus("Loading sample photo…");
  try {
    const img = await loadImage(url);
    putPhotoInPanel(img, index);
    state.activePanel = index;
    redraw();
    setStatus("Sample photo loaded into panel " + (index + 1) + ".");
  } catch (err) {
    setStatus("Sample photo failed to load.");
  }
}

function readUpload(file) {
  const reader = new FileReader();
  reader.onload = function () {
    loadImage(String(reader.result))
      .then(function (img) {
        putPhotoInPanel(img, state.activePanel);
        redraw();
        setStatus("Your photo is in panel " + (state.activePanel + 1) + ".");
      })
      .catch(function () {
        setStatus("That file could not be read as a photo.");
      });
  };
  reader.onerror = function () {
    setStatus("That file could not be read.");
  };
  reader.readAsDataURL(file);
}

function applySize() {
  const size = SIZES[state.size] || SIZES.square;
  canvas.width = size.width;
  canvas.height = size.height;
  redraw();
}

function bindLayoutButtons() {
  const row = document.getElementById("layoutRow");
  row.querySelectorAll("button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.layout = btn.getAttribute("data-layout");
      state.activePanel = 0;
      row.querySelectorAll("button").forEach(function (other) {
        other.setAttribute("aria-pressed", other === btn ? "true" : "false");
      });
      zoomRange.value = String(activeSlot().zoom);
      redraw();
      setStatus("Layout: " + (LAYOUTS[state.layout] || {}).label + ".");
    });
  });
}

function bindCaption() {
  document.getElementById("titleText").addEventListener("input", function (event) {
    state.title = event.target.value;
    redraw();
  });
  document.getElementById("subtitleText").addEventListener("input", function (event) {
    state.subtitle = event.target.value;
    redraw();
  });
  document.getElementById("neonToggle").addEventListener("change", function (event) {
    state.neon = event.target.checked;
    redraw();
  });
  document.getElementById("gradeSelect").addEventListener("change", function (event) {
    state.grade = event.target.value;
    redraw();
    setStatus("Grade: " + event.target.selectedOptions[0].textContent + ".");
  });
  document.getElementById("sizeSelect").addEventListener("change", function (event) {
    state.size = event.target.value;
    applySize();
    setStatus("Export size: " + (SIZES[state.size] || {}).label + ".");
  });
  zoomRange.addEventListener("input", function (event) {
    activeSlot().zoom = Number(event.target.value);
    redraw();
  });
}

function bindPhotos() {
  document.getElementById("photoFile").addEventListener("change", function (event) {
    const file = event.target.files && event.target.files[0];
    if (file) readUpload(file);
  });
  document.getElementById("samplePier").addEventListener("click", function () {
    loadSample("samples/pier.jpg", state.activePanel);
  });
  document.getElementById("sampleBlvd").addEventListener("click", function () {
    loadSample("samples/boulevard.jpg", state.activePanel);
  });
  document.getElementById("fillAll").addEventListener("click", function () {
    const source = activeSlot().image;
    if (!source) {
      setStatus("Load a photo first, then fill every panel with it.");
      return;
    }
    state.photos.forEach(function (slot) {
      slot.image = source;
      slot.zoom = 1;
      slot.panX = 0;
      slot.panY = 0;
    });
    redraw();
    setStatus("One photo now fills every panel.");
  });
}

function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) / box.width) * canvas.width,
    y: ((event.clientY - box.top) / box.height) * canvas.height,
  };
}

function bindCanvas() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener("pointerdown", function (event) {
    const point = canvasPoint(event);
    state.activePanel = hitPanel(state.layout, canvas.width, canvas.height, point.x, point.y);
    zoomRange.value = String(activeSlot().zoom);
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    redraw();
  });

  canvas.addEventListener("pointermove", function (event) {
    if (!dragging) return;
    const box = canvas.getBoundingClientRect();
    const slot = activeSlot();
    slot.panX += ((event.clientX - lastX) / box.width) * 0.9;
    slot.panY += ((event.clientY - lastY) / box.height) * 0.9;
    slot.panX = Math.max(-0.5, Math.min(0.5, slot.panX));
    slot.panY = Math.max(-0.5, Math.min(0.5, slot.panY));
    lastX = event.clientX;
    lastY = event.clientY;
    redraw();
  });

  function endDrag() {
    dragging = false;
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  canvas.addEventListener("wheel", function (event) {
    event.preventDefault();
    const slot = activeSlot();
    const next = slot.zoom * (event.deltaY < 0 ? 1.08 : 0.93);
    slot.zoom = Math.max(1, Math.min(2.5, next));
    zoomRange.value = String(slot.zoom);
    redraw();
  }, { passive: false });
}

function bindExport() {
  document.getElementById("exportBtn").addEventListener("click", function () {
    const size = SIZES[state.size] || SIZES.square;
    const dataUrl = exportCoverPNG(state, size.width, size.height);
    downloadLink.href = dataUrl;
    downloadLink.download = "neon-dusk-" + size.width + "x" + size.height + ".png";
    const bytes = Math.round((dataUrl.length * 3) / 4);
    setStatus("Exported " + size.width + " x " + size.height + " PNG (" + bytes.toLocaleString("en-US") + " bytes). Click the download link to save it.");
  });
}

async function start() {
  bindLayoutButtons();
  bindCaption();
  bindPhotos();
  bindCanvas();
  bindExport();
  applySize();
  await document.fonts.ready;
  redraw();
  await Promise.all([
    loadSample("samples/pier.jpg", 0),
    loadSample("samples/boulevard.jpg", 1),
  ]);
  state.photos[2].image = state.photos[0].image;
  state.photos[2].zoom = 1;
  state.photos[2].panX = 0;
  state.photos[2].panY = 0;
  redraw();
  setStatus("Ready — pick a layout, edit the caption, export your cover.");
}

// Handle for automated checks: state, export and redraw without touching the DOM.
window.__neonDusk = {
  state: state,
  redraw: redraw,
  exportPNG: function (width, height) {
    return exportCoverPNG(state, width, height);
  },
  loadSample: loadSample,
};

start();
