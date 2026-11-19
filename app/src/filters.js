// Per-panel photo filters. Each filter is drawn on an offscreen canvas the
// size of its panel, cover-fit from the source photo, so the cover engine can
// drop the result straight into the panel's clip path. All filters are plain
// canvas compositing — no library, no network, deterministic.

export const FILTERS = [
  { id: 'none', label: 'Original' },
  { id: 'duotone', label: 'Duotone' },
  { id: 'noir', label: 'Noir' },
  { id: 'warm', label: 'Warm pop' },
  { id: 'vignette', label: 'Vignette' },
  { id: 'sticker', label: 'Sticker cutout' },
];

export function isSticker(filterId) {
  return filterId === 'sticker';
}

/** Cover-fit draw of `img` onto `ctx` at 0,0 sized w×h, with slot zoom/pan. */
function drawCoverFit(ctx, img, w, h, slot) {
  const zoom = slot?.zoom ?? 1.15;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const ox = (slot?.ox ?? 0) * w;
  const oy = (slot?.oy ?? 0) * h;
  ctx.drawImage(img, (w - pw) / 2 + ox, (h - ph) / 2 + oy, pw, ph);
}

/**
 * Renders one panel's photo with its filter into a fresh canvas of w×h.
 * Returns null for 'none' (caller draws the raw photo) and for 'sticker'
 * (caller draws the raw photo, then adds the white sticker border itself).
 */
export function renderFiltered(img, w, h, slot, filterId) {
  if (!img || !filterId || filterId === 'none' || filterId === 'sticker') return null;
  const off = document.createElement('canvas');
  off.width = Math.max(1, Math.round(w));
  off.height = Math.max(1, Math.round(h));
  const ctx = off.getContext('2d');
  if (filterId === 'duotone') {
    ctx.filter = 'grayscale(1) contrast(1.12)';
    drawCoverFit(ctx, img, w, h, slot);
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(255,46,136,0.55)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255,209,102,0.30)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (filterId === 'noir') {
    ctx.filter = 'grayscale(1) contrast(1.28) brightness(1.06)';
    drawCoverFit(ctx, img, w, h, slot);
    ctx.filter = 'none';
  } else if (filterId === 'warm') {
    ctx.filter = 'sepia(0.32) saturate(1.55) contrast(1.06)';
    drawCoverFit(ctx, img, w, h, slot);
    ctx.filter = 'none';
  } else if (filterId === 'vignette') {
    drawCoverFit(ctx, img, w, h, slot);
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(10,0,20,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  } else {
    drawCoverFit(ctx, img, w, h, slot);
  }
  return off;
}
