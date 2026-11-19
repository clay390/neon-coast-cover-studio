// Fixed scenes for screenshots: ?shot=cover shows the exported cover alone;
// ?shot=editor shows the editor with photos loaded. `layout`, `grade`, `size`,
// `title`, `subtitle`, `badge`, `caption` (a preset id), `filters` (comma list,
// one per slot) and `photos` (comma sample names) pick the scene.
// window.__shotReady is set once the cover is painted.

import { CAPTIONS } from './captions.js';

const SAMPLES = { boulevard: 'boulevard', pier: 'pier', sunset: 'sunset', neon: 'neon' };

export async function runShot(shot, query, api) {
  const { state, setSlotImage, redraw, syncControls, renderSlots } = api;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layout = query.get('layout');
  if (layout) state.layout = layout;
  const gradeId = query.get('grade');
  if (gradeId) state.gradeId = gradeId;
  const sizeId = query.get('size');
  if (sizeId) state.sizeId = sizeId;
  const caption = CAPTIONS.find((c) => c.id === query.get('caption'));
  if (caption) {
    state.title = caption.title;
    state.subtitle = caption.subtitle;
    state.badge = caption.badge;
  }
  if (query.get('title')) state.title = query.get('title');
  if (query.get('subtitle')) state.subtitle = query.get('subtitle');
  if (query.get('badge')) state.badge = query.get('badge');
  if (query.get('titleStyle')) state.titleStyle = query.get('titleStyle');
  if (query.get('stars')) state.stars = Number(query.get('stars'));
  const filters = (query.get('filters') ?? '').split(',').map((f) => f.trim());
  const photos = (query.get('photos') ?? query.get('photo') ?? 'boulevard,pier,sunset,neon').split(',');
  for (let i = 0; i < 4; i++) {
    const name = SAMPLES[photos[i % photos.length]] ?? 'boulevard';
    await setSlotImage(i, `samples/${name}.jpg`, name, { silent: true });
    if (filters[i]) state.slots[i].filter = filters[i];
  }
  syncControls();
  renderSlots();
  redraw();
  try { await document.fonts.ready; } catch { /* fonts are local; paint anyway */ }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
