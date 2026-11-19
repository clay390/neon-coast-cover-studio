// Wires the editor: photo slots, layout and grade chips, per-panel filters,
// caption presets, randomize, per-panel crop controls, undo/redo, live
// preview, before/after compare, keyboard shortcuts and PNG export (one size
// or all four). A `?shot=` query stages a fixed scene for a screenshot
// instead (shots.js).

import { drawCover, loadImage, SIZES } from './cover.js';
import { LAYOUTS } from './panels.js';
import { GRADES } from './grades.js';
import { FILTERS } from './filters.js';
import { CAPTIONS, randomCaption } from './captions.js';
import { runShot } from './shots.js';

const SAMPLES = ['boulevard', 'pier', 'sunset', 'neon'];
const canvas = document.getElementById('cover');
const stageLabel = document.getElementById('stageLabel');
const panelLabel = document.getElementById('panelLabel');
const status = document.getElementById('status');

const images = new Map(); // id -> HTMLImageElement
let imageSeq = 0;
let selected = 0;
let undoStack = [];
let redoStack = [];
let lastPanels = [];
let comparing = false;

function defaultState() {
  return {
    layout: 'four',
    gradeId: 'sunset',
    sizeId: 'square',
    title: 'Neon Shore',
    subtitle: 'one last ride down the coast',
    badge: 'VICE COAST • 2026',
    titleStyle: 'sunset',
    stars: 3,
    grain: true,
    halftone: true,
    frame: true,
    captionId: 'neon-shore',
    slots: [0, 1, 2, 3].map(() => ({ imageId: null, zoom: 1.15, ox: 0, oy: 0, filter: 'none' })),
  };
}

let state = defaultState();

function grade() {
  return GRADES.find((g) => g.id === state.gradeId) ?? GRADES[0];
}

function size() {
  return SIZES.find((s) => s.id === state.sizeId) ?? SIZES[0];
}

/** The live state the cover engine reads: grade object in place of its id. */
function renderState() {
  return { ...state, grade: grade() };
}

function redraw() {
  const s = size();
  if (canvas.width !== s.w || canvas.height !== s.h) {
    canvas.width = s.w;
    canvas.height = s.h;
  }
  const laid = drawCover(canvas, renderState(), images, { compare: comparing });
  lastPanels = laid.panels.map((p) => ({ ...p, scaleX: canvas.clientWidth / s.w, scaleY: canvas.clientHeight / s.h }));
  stageLabel.textContent = comparing ? `Before — raw photos, no grade (${s.w} × ${s.h})` : `Live preview — ${s.w} × ${s.h}`;
  panelLabel.textContent = `Panel ${selected + 1} selected`;
  syncSlotInputs();
}

function snapshot() {
  return JSON.stringify(state);
}

function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
}

function restore(json) {
  state = JSON.parse(json);
  syncControls();
  redraw();
}

function syncControls() {
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  document.getElementById('titleStyle').value = state.titleStyle;
  document.getElementById('stars').value = String(state.stars);
  document.getElementById('grain').checked = state.grain;
  document.getElementById('halftone').checked = state.halftone;
  document.getElementById('frame').checked = state.frame;
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.layout));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.gradeId));
  document.querySelectorAll('#sizes button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.sizeId));
  document.querySelectorAll('#filters button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.slots[selected].filter));
  document.querySelectorAll('#captions button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.captionId));
  renderSlots();
}

function syncSlotInputs() {
  const slot = state.slots[selected];
  document.getElementById('zoom').value = String(slot.zoom);
  document.getElementById('panX').value = String(slot.ox);
  document.getElementById('panY').value = String(slot.oy);
  document.querySelectorAll('#filters button').forEach((b) => b.classList.toggle('active', b.dataset.id === slot.filter));
}

function renderSlots() {
  const wrap = document.getElementById('slots');
  wrap.innerHTML = '';
  state.slots.forEach((slot, i) => {
    const div = document.createElement('div');
    div.className = 'slot' + (i === selected ? ' selected' : '');
    div.title = `Panel ${i + 1} photo — click to select, double-click to change`;
    const img = slot.imageId ? images.get(slot.imageId) : null;
    const filterLabel = slot.filter && slot.filter !== 'none'
      ? FILTERS.find((f) => f.id === slot.filter)?.label ?? '' : '';
    div.innerHTML = img
      ? `<img alt="Panel ${i + 1} photo"><span>Panel ${i + 1} ✓${filterLabel ? ` · ${filterLabel}` : ''}</span>`
      : `<span>Panel ${i + 1}<br>tap to add</span>`;
    if (img) div.querySelector('img').src = img.src;
    // Single click selects the panel; double-click (or the Change button)
    // opens the file picker. v1 opened the picker on every click, which
    // made simply selecting a panel pop a dialog.
    div.addEventListener('click', () => {
      selected = i;
      renderSlots();
      redraw();
    });
    div.addEventListener('dblclick', () => pickPhoto(i));
    wrap.appendChild(div);
  });
}

async function setSlotImage(i, fileOrUrl, name, opts = {}) {
  const img = await loadImage(typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl));
  const id = `img-${++imageSeq}`;
  images.set(id, img);
  if (!opts.silent) pushUndo();
  state.slots[i] = { imageId: id, zoom: 1.15, ox: 0, oy: 0, filter: state.slots[i]?.filter ?? 'none' };
  renderSlots();
  redraw();
  if (!opts.silent) status.textContent = `Photo ${name ?? ''} loaded into panel ${i + 1}.`;
}

function pickPhoto(i) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files[0];
    if (file) setSlotImage(i, file, file.name).catch(() => { status.textContent = 'That file could not be read as a photo.'; });
  };
  input.click();
}

function buildChips(containerId, items, current, onPick) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = '';
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.label;
    b.dataset.id = item.id;
    if (item.id === current) b.classList.add('active');
    b.addEventListener('click', () => {
      pushUndo();
      onPick(item.id);
      wrap.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
      redraw();
    });
    wrap.appendChild(b);
  }
}

function buildSamples() {
  const wrap = document.getElementById('samples');
  for (const name of SAMPLES) {
    const img = document.createElement('img');
    img.src = `samples/${name}.jpg`;
    img.alt = `Sample photo ${name}`;
    img.title = `Use sample: ${name}`;
    img.addEventListener('click', () => setSlotImage(selected, `samples/${name}.jpg`, name).catch(() => {}));
    wrap.appendChild(img);
  }
}

function buildCaptions() {
  const wrap = document.getElementById('captions');
  for (const c of CAPTIONS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = c.label;
    b.dataset.id = c.id;
    if (c.id === state.captionId) b.classList.add('active');
    b.addEventListener('click', () => {
      pushUndo();
      applyCaption(c);
      wrap.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
      syncControls();
      redraw();
      status.textContent = `Caption “${c.label}” applied.`;
    });
    wrap.appendChild(b);
  }
}

function applyCaption(c) {
  state.captionId = c.id;
  state.title = c.title;
  state.subtitle = c.subtitle;
  state.badge = c.badge;
}

function randomizeLook() {
  pushUndo();
  const layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
  const g = GRADES[Math.floor(Math.random() * GRADES.length)];
  const caption = randomCaption(state.captionId);
  state.layout = layout.id;
  state.gradeId = g.id;
  applyCaption(caption);
  // A fresh filter per panel, weighted to keep at least one raw photo.
  const pool = ['none', 'none', 'duotone', 'noir', 'warm', 'vignette', 'sticker'];
  state.slots.forEach((slot) => { slot.filter = pool[Math.floor(Math.random() * pool.length)]; });
  syncControls();
  redraw();
  status.textContent = `Shuffled: ${layout.label} · ${g.label} · “${caption.label}”.`;
}

function exportSize(s) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    off.width = s.w;
    off.height = s.h;
    drawCover(off, renderState(), images);
    off.toBlob((blob) => {
      if (!blob) { status.textContent = 'Export failed — try again.'; resolve(false); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-coast-${s.id}-${s.w}x${s.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(true);
    }, 'image/png');
  });
}

async function exportAllSizes() {
  let done = 0;
  for (const s of SIZES) {
    if (await exportSize(s)) done++;
    await new Promise((r) => setTimeout(r, 250));
  }
  status.textContent = done === SIZES.length
    ? `Saved all ${done} sizes — square, portrait, wide and poster print.`
    : `Saved ${done} of ${SIZES.length} sizes — try the missing one again.`;
}

function bindControls() {
  buildChips('layouts', LAYOUTS, state.layout, (id) => { state.layout = id; });
  buildChips('grades', GRADES, state.gradeId, (id) => { state.gradeId = id; });
  buildChips('sizes', SIZES, state.sizeId, (id) => { state.sizeId = id; });
  buildChips('filters', FILTERS, state.slots[selected].filter, (id) => { state.slots[selected].filter = id; });
  buildCaptions();
  buildSamples();
  renderSlots();

  document.getElementById('fillAll').addEventListener('click', () => {
    const first = state.slots[0].imageId;
    if (!first) { status.textContent = 'Add a photo to panel 1 first.'; return; }
    pushUndo();
    state.slots = state.slots.map((s) => ({ ...s, imageId: first }));
    renderSlots();
    redraw();
    status.textContent = 'All panels now use the panel 1 photo.';
  });
  document.getElementById('shuffleSamples').addEventListener('click', async () => {
    pushUndo();
    for (let i = 0; i < 4; i++) {
      const name = SAMPLES[(i + imageSeq) % SAMPLES.length];
      const img = await loadImage(`samples/${name}.jpg`);
      const id = `img-${++imageSeq}`;
      images.set(id, img);
      state.slots[i] = { imageId: id, zoom: 1.15, ox: 0, oy: 0, filter: state.slots[i]?.filter ?? 'none' };
    }
    renderSlots();
    redraw();
    status.textContent = 'Sample photos loaded into all four panels.';
  });
  document.getElementById('changePhoto').addEventListener('click', () => pickPhoto(selected));
  document.getElementById('randomize').addEventListener('click', randomizeLook);

  const textField = (id, key) => {
    document.getElementById(id).addEventListener('input', (e) => {
      state[key] = e.target.value;
      if (key === 'title' || key === 'subtitle' || key === 'badge') state.captionId = '';
      redraw();
    });
    document.getElementById(id).addEventListener('focus', pushUndo);
  };
  textField('title', 'title');
  textField('subtitle', 'subtitle');
  textField('badge', 'badge');
  document.getElementById('titleStyle').addEventListener('change', (e) => { pushUndo(); state.titleStyle = e.target.value; redraw(); });
  document.getElementById('stars').addEventListener('change', (e) => { pushUndo(); state.stars = Number(e.target.value); redraw(); });
  for (const [id, key] of [['grain', 'grain'], ['halftone', 'halftone'], ['frame', 'frame']]) {
    document.getElementById(id).addEventListener('change', (e) => { pushUndo(); state[key] = e.target.checked; redraw(); });
  }
  document.getElementById('zoom').addEventListener('input', (e) => { state.slots[selected].zoom = Number(e.target.value); redraw(); });
  document.getElementById('panX').addEventListener('input', (e) => { state.slots[selected].ox = Number(e.target.value); redraw(); });
  document.getElementById('panY').addEventListener('input', (e) => { state.slots[selected].oy = Number(e.target.value); redraw(); });
  for (const id of ['zoom', 'panX', 'panY']) document.getElementById(id).addEventListener('pointerdown', pushUndo);

  const doUndo = () => {
    const prev = undoStack.pop();
    if (!prev) return;
    redoStack.push(snapshot());
    restore(prev);
  };
  const doRedo = () => {
    const next = redoStack.pop();
    if (!next) return;
    undoStack.push(snapshot());
    restore(next);
  };
  document.getElementById('undo').addEventListener('click', doUndo);
  document.getElementById('redo').addEventListener('click', doRedo);
  document.getElementById('reset').addEventListener('click', () => {
    pushUndo();
    state = defaultState();
    syncControls();
    redraw();
  });

  document.getElementById('export').addEventListener('click', async () => {
    const s = size();
    if (await exportSize(s)) status.textContent = `Saved neon-coast-${s.id}-${s.w}x${s.h}.png — share it anywhere.`;
  });
  document.getElementById('exportAll').addEventListener('click', exportAllSizes);

  // Hold-to-compare: while held, the preview shows the raw photos.
  const compareBtn = document.getElementById('compare');
  const setCompare = (on) => {
    if (comparing === on) return;
    comparing = on;
    compareBtn.classList.toggle('active', on);
    redraw();
  };
  compareBtn.addEventListener('pointerdown', () => setCompare(true));
  compareBtn.addEventListener('pointerup', () => setCompare(false));
  compareBtn.addEventListener('pointerleave', () => setCompare(false));

  // Keyboard shortcuts (ignored while typing in a field).
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (e.key >= '1' && e.key <= String(LAYOUTS.length)) {
      pushUndo();
      state.layout = LAYOUTS[Number(e.key) - 1].id;
      syncControls();
      redraw();
    } else if (e.key === 'g' || e.key === 'G') {
      pushUndo();
      const i = GRADES.findIndex((g) => g.id === state.gradeId);
      state.gradeId = GRADES[(i + 1) % GRADES.length].id;
      syncControls();
      redraw();
    } else if (e.key === 'f' || e.key === 'F') {
      pushUndo();
      const i = FILTERS.findIndex((f) => f.id === state.slots[selected].filter);
      state.slots[selected].filter = FILTERS[(i + 1) % FILTERS.length].id;
      syncControls();
      redraw();
    } else if (e.key === 'e' || e.key === 'E') {
      document.getElementById('export').click();
    } else if (e.key === 'a' || e.key === 'A') {
      exportAllSizes();
    } else if (e.key === 's' || e.key === 'S') {
      randomizeLook();
    } else if (e.key === 'u' || e.key === 'U') {
      doUndo();
    } else if (e.key === 'r' || e.key === 'R') {
      doRedo();
    } else if ((e.key === 'b' || e.key === 'B') && !e.repeat) {
      setCompare(true);
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'b' || e.key === 'B') setCompare(false);
  });

  // Click a panel to select it; drag pans its photo; wheel zooms it.
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const s = size();
    const hit = lastPanels.findIndex((p) => px >= p.x / s.w && px <= (p.x + p.w) / s.w && py >= p.y / s.h && py <= (p.y + p.h) / s.h);
    if (hit >= 0) {
      selected = hit;
      renderSlots();
      redraw();
      drag = { x: e.clientX, y: e.clientY, ox: state.slots[selected].ox, oy: state.slots[selected].oy };
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    state.slots[selected].ox = drag.ox + (e.clientX - drag.x) / rect.width;
    state.slots[selected].oy = drag.oy + (e.clientY - drag.y) / rect.height;
    redraw();
  });
  canvas.addEventListener('pointerup', () => { if (drag) { pushUndo(); drag = null; } });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const slot = state.slots[selected];
    slot.zoom = Math.min(2.5, Math.max(1, slot.zoom - Math.sign(e.deltaY) * 0.08));
    redraw();
  }, { passive: false });
}

// Read-only handle for tests and debugging.
window.__neon = { get state() { return state; }, get comparing() { return comparing; } };

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
bindControls();
if (shot) {
  runShot(shot, query, { state, images, setSlotImage, redraw, syncControls, renderSlots });
} else {
  redraw();
}
