// The cover engine: draws one finished poster onto a canvas at any size.
// Photos are HTMLImageElements (or null); slots carry {imageId, zoom, ox, oy,
// filter} per photo. Everything is drawn, nothing is uploaded: the export is
// canvas.toBlob. `opts.compare` renders the "before" state — raw photos, no
// grade, no grain, no halftone, no per-panel filter — so the editor's
// hold-to-compare shows exactly what the grade and filters add.

import { layoutPanels } from './panels.js';
import { applyGrade, applyVignette } from './grades.js';
import { renderFiltered, isSticker } from './filters.js';

export const SIZES = [
  { id: 'square', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
  { id: 'print', label: 'Poster print 1080 × 1620', w: 1080, h: 1620 },
];

/** Draws one photo cover-fit inside a panel rect, with zoom and pan offsets. */
export function drawPhotoInPanel(ctx, img, panel, slot, compare = false) {
  const { x, y, w, h } = panel;
  const filterId = compare ? 'none' : (slot?.filter ?? 'none');
  ctx.save();
  ctx.beginPath();
  if (panel.clip === 'left') {
    ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - w * 0.22, y + h); ctx.lineTo(x, y + h); ctx.closePath();
  } else if (panel.clip === 'right') {
    ctx.moveTo(x + w * 0.22, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.clip();
  if (panel.rot) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(panel.rot);
    ctx.translate(-w / 2, -h / 2);
  } else {
    ctx.translate(x, y);
  }
  if (!img) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#3d1458'); g.addColorStop(1, '#12081f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = `600 ${Math.max(14, w * 0.05)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', w / 2, h / 2);
  } else if (filterId !== 'none' && !isSticker(filterId)) {
    // Filtered photos come pre-rendered at panel size from filters.js.
    const rendered = renderFiltered(img, w, h, slot, filterId);
    ctx.drawImage(rendered, 0, 0, w, h);
  } else {
    const zoom = slot?.zoom ?? 1.15;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const pw = img.naturalWidth * scale;
    const ph = img.naturalHeight * scale;
    const ox = (slot?.ox ?? 0) * w;
    const oy = (slot?.oy ?? 0) * h;
    ctx.drawImage(img, (w - pw) / 2 + ox, (h - ph) / 2 + oy, pw, ph);
  }
  ctx.restore();
  if (panel.rot) {
    // A white snapshot border around tilted panels, like a printed photo.
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(panel.rot);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(4, w * 0.015);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
  if (img && isSticker(filterId)) {
    // Sticker cutout: a thick white outline with a soft drop shadow, so the
    // photo reads as a die-cut sticker pasted onto the poster.
    ctx.save();
    if (panel.rot) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(panel.rot);
      ctx.translate(-w / 2, -h / 2);
    } else {
      ctx.translate(x, y);
    }
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = Math.max(8, w * 0.02);
    ctx.shadowOffsetY = Math.max(4, w * 0.01);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(8, w * 0.028);
    ctx.strokeRect(0, 0, w, h);
    ctx.restore();
  }
}

/** Seeded specks of film grain over the whole cover. */
export function drawGrain(ctx, W, H, seed) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  ctx.save();
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < Math.round(W * H / 900); i++) {
    const v = Math.floor(rnd() * 255);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(rnd() * W, rnd() * H, 1.6, 1.6);
  }
  ctx.restore();
}

/** Halftone dots along one edge of the title band, poster-print style. */
export function drawHalftone(ctx, W, y, H) {
  const step = Math.max(10, W * 0.014);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  for (let row = 0; row < 4; row++) {
    for (let x = step / 2 + (row % 2) * step / 2; x < W; x += step) {
      const r = (4 - row) * step * 0.11;
      ctx.beginPath();
      ctx.arc(x, y + row * step * 0.9 + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Fits the title in Anton capitals, shrinking until it fits the band. */
export function drawTitleBlock(ctx, state, grade, zone, W) {
  const { x, y, w, h } = zone;
  ctx.save();
  ctx.globalAlpha = grade.bandAlpha;
  ctx.fillStyle = grade.band;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  const pad = Math.round(w * 0.045);
  const align = zone.align === 'left' ? 'left' : 'center';
  const tx = align === 'left' ? x + pad : x + w / 2;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  // Badge ribbon, top-left of the band.
  const badge = (state.badge || '').trim().toUpperCase();
  let titleY = y + h * 0.52;
  if (badge) {
    const bs = Math.round(h * 0.13);
    ctx.font = `700 ${bs}px system-ui, sans-serif`;
    const bw = ctx.measureText(badge).width + bs * 1.6;
    const bx = align === 'left' ? x + pad : x + w / 2 - bw / 2;
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(bx, y + h * 0.10, bw, bs * 1.9);
    ctx.fillStyle = '#2b0a3d';
    ctx.textAlign = 'left';
    ctx.fillText(badge, bx + bs * 0.8, y + h * 0.10 + bs * 1.45);
    ctx.textAlign = align;
    titleY = y + h * 0.66;
  }
  // Title.
  const title = (state.title || 'UNTITLED').trim().toUpperCase();
  let size = Math.round(h * (badge ? 0.34 : 0.44));
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  while (ctx.measureText(title).width > w - pad * 2 && size > 16) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  }
  const ty = titleY;
  if (state.titleStyle === 'sunset') {
    const fg = ctx.createLinearGradient(0, ty - size, 0, ty);
    fg.addColorStop(0, '#ffe259'); fg.addColorStop(0.5, '#ff7e5f'); fg.addColorStop(1, '#ff2e88');
    ctx.fillStyle = fg;
  } else if (state.titleStyle === 'neon') {
    ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = size * 0.45;
    ctx.fillStyle = '#ffffff';
  } else {
    ctx.fillStyle = '#ffffff';
  }
  ctx.lineWidth = Math.max(2, size * 0.07);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.strokeText(title, tx, ty);
  ctx.fillText(title, tx, ty);
  ctx.shadowBlur = 0;
  // Subtitle in Pacifico script.
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const ss = Math.round(h * 0.17);
    ctx.font = `${ss}px Pacifico, cursive`;
    ctx.fillStyle = '#ffd166';
    ctx.fillText(sub, tx, y + h * 0.88);
  }
  // Heat stars, top-right of the band.
  const stars = '★'.repeat(state.stars || 3) + '☆'.repeat(5 - (state.stars || 3));
  const st = Math.round(h * 0.16);
  ctx.font = `${st}px system-ui, sans-serif`;
  ctx.fillStyle = '#ff5e78';
  ctx.textAlign = 'right';
  ctx.fillText(stars, x + w - pad, y + h * 0.24);
  ctx.restore();
}

/**
 * Renders the full cover for `state` onto `canvas` at its own size.
 * `opts.compare` renders the before-state (see the header comment).
 */
export function drawCover(canvas, state, images, opts = {}) {
  const { width: W, height: H } = canvas;
  const ctx = canvas.getContext('2d');
  const grade = state.grade;
  const compare = !!opts.compare;
  ctx.clearRect(0, 0, W, H);
  // Sunset backdrop, visible between panels and behind tilted snaps.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#2b0a3d'); bg.addColorStop(0.55, '#c2185b'); bg.addColorStop(1, '#ff7e3d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const { panels, title } = layoutPanels(state.layout, W, H);
  for (const panel of panels) {
    const slot = state.slots[panel.photo];
    drawPhotoInPanel(ctx, slot?.imageId ? images.get(slot.imageId) ?? null : null, panel, slot, compare);
  }
  if (!compare) {
    applyGrade(ctx, grade, W, H);
    applyVignette(ctx, W, H);
    // Halftone dots hug the photo side of the title band: below a top
    // masthead, above a bottom band.
    if (state.halftone) drawHalftone(ctx, W, title.edge === 'top' ? title.y + title.h : title.y, title.h);
  }
  drawTitleBlock(ctx, state, grade, title, W);
  if (!compare && state.grain) drawGrain(ctx, W, H, 1234567);
  if (state.frame) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(6, W * 0.008);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
  }
  return { panels, title };
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
