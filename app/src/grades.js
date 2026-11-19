// Sunset / neon colour grades. Each grade is a pair of overlay tints plus the
// colour of the title band, applied with soft-light and multiply blending so
// any photo takes on a Vice City dusk or neon-night look.

export const GRADES = [
  { id: 'sunset', label: 'Sunset', top: 'rgba(255,120,60,0.16)', bottom: 'rgba(190,30,110,0.42)', band: '#1c0b2e', bandAlpha: 0.92 },
  { id: 'neon', label: 'Neon Vice', top: 'rgba(0,220,255,0.20)', bottom: 'rgba(255,30,160,0.45)', band: '#0d0221', bandAlpha: 0.94 },
  { id: 'gold', label: 'Gold Hour', top: 'rgba(255,190,60,0.22)', bottom: 'rgba(200,90,10,0.38)', band: '#241203', bandAlpha: 0.92 },
  { id: 'teal', label: 'Teal Noir', top: 'rgba(0,180,190,0.20)', bottom: 'rgba(10,20,60,0.50)', band: '#04121c', bandAlpha: 0.94 },
  { id: 'rose', label: 'Rose Dusk', top: 'rgba(255,90,120,0.18)', bottom: 'rgba(120,20,90,0.48)', band: '#22061e', bandAlpha: 0.92 },
  { id: 'mono', label: 'Mono Heat', top: 'rgba(255,255,255,0.10)', bottom: 'rgba(0,0,0,0.42)', band: '#111111', bandAlpha: 0.94 },
];

/** Applies a grade's tint gradient over the whole cover. */
export function applyGrade(ctx, grade, W, H) {
  const tint = ctx.createLinearGradient(0, 0, 0, H);
  tint.addColorStop(0, grade.top);
  tint.addColorStop(1, grade.bottom);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = grade.bottom;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Darkens the corners so the title lettering pops. */
export function applyVignette(ctx, W, H) {
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}
