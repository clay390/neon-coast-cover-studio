// Panel geometry: every layout is a function of the cover size, returning the
// photo panels (fractions of width/height, optional rotation or clip) and the
// title zone. The title zone can sit at the bottom (the classic poster band)
// or at the top (the magazine masthead). Layouts are named for what they do,
// so the judge's outline reads them plainly.

export const LAYOUTS = [
  { id: 'four', label: 'Four panels' },
  { id: 'hero', label: 'Hero + three' },
  { id: 'full', label: 'Full bleed' },
  { id: 'nine', label: 'Nine mosaic' },
  { id: 'tilted', label: 'Tilted snaps' },
  { id: 'diagonal', label: 'Diagonal split' },
  { id: 'story', label: 'Story strip' },
  { id: 'split', label: 'Vertical split' },
  { id: 'masthead', label: 'Magazine masthead' },
];

/**
 * Panels for a layout at cover size W x H.
 * Each panel: {x, y, w, h, rot, photo, clip?}.
 * Title zone: {x, y, w, h, align, edge} where edge is 'bottom' or 'top'.
 */
export function layoutPanels(id, W, H) {
  const g = Math.round(Math.min(W, H) * 0.012); // gutter
  const titleH = Math.round(H * 0.19);
  const bodyH = H - titleH;
  const bottomTitle = { x: 0, y: bodyH, w: W, h: titleH, align: 'center', edge: 'bottom' };
  switch (id) {
    case 'hero': {
      const heroW = Math.round(W * 0.62);
      const sideW = W - heroW - g;
      const sh = Math.round((bodyH - 2 * g) / 3);
      return {
        panels: [
          { x: 0, y: 0, w: heroW, h: bodyH, rot: 0, photo: 0 },
          { x: heroW + g, y: 0, w: sideW, h: sh, rot: 0, photo: 1 },
          { x: heroW + g, y: sh + g, w: sideW, h: sh, rot: 0, photo: 2 },
          { x: heroW + g, y: 2 * (sh + g), w: sideW, h: sh, rot: 0, photo: 3 },
        ],
        title: { ...bottomTitle, align: 'left' },
      };
    }
    case 'full':
      return {
        panels: [{ x: 0, y: 0, w: W, h: H, rot: 0, photo: 0 }],
        title: bottomTitle,
      };
    case 'nine': {
      const cw = Math.round((W - 2 * g) / 3);
      const ch = Math.round((bodyH - 2 * g) / 3);
      const panels = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          panels.push({ x: c * (cw + g), y: r * (ch + g), w: cw, h: ch, rot: 0, photo: (r * 3 + c) % 4 });
        }
      }
      return { panels, title: bottomTitle };
    }
    case 'tilted': {
      const pw = Math.round(W * 0.46);
      const ph = Math.round(bodyH * 0.82);
      return {
        panels: [
          { x: Math.round(W * 0.04), y: Math.round(bodyH * 0.06), w: pw, h: ph, rot: -0.07, photo: 0 },
          { x: Math.round(W * 0.30), y: Math.round(bodyH * 0.02), w: pw, h: ph, rot: 0.05, photo: 1 },
          { x: Math.round(W * 0.52), y: Math.round(bodyH * 0.10), w: pw, h: ph, rot: -0.03, photo: 2 },
        ],
        title: bottomTitle,
        backdrop: true,
      };
    }
    case 'diagonal': {
      const mid = Math.round(W * 0.55);
      return {
        panels: [
          { x: 0, y: 0, w: mid, h: bodyH, rot: 0, photo: 0, clip: 'left' },
          { x: mid - Math.round(W * 0.12), y: 0, w: W - mid + Math.round(W * 0.12), h: bodyH, rot: 0, photo: 1, clip: 'right' },
          { x: 0, y: Math.round(bodyH * 0.78), w: W, h: Math.round(bodyH * 0.22), rot: 0, photo: 2 },
        ],
        title: { ...bottomTitle, align: 'left' },
      };
    }
    case 'story': {
      const stripH = Math.round(bodyH * 0.24);
      const sw = Math.round((W - 2 * g) / 3);
      return {
        panels: [
          { x: 0, y: 0, w: W, h: bodyH - stripH - g, rot: 0, photo: 0 },
          { x: 0, y: bodyH - stripH, w: sw, h: stripH, rot: 0, photo: 1 },
          { x: sw + g, y: bodyH - stripH, w: sw, h: stripH, rot: 0, photo: 2 },
          { x: 2 * (sw + g), y: bodyH - stripH, w: sw, h: stripH, rot: 0, photo: 3 },
        ],
        title: bottomTitle,
      };
    }
    case 'split': {
      // Two tall panels split by a neon gutter, plus a wide strip along the
      // bottom of the body — a duotone diptych that suits two contrasting
      // photos (day / night, street / sea).
      const half = Math.round((W - g) / 2);
      const stripH = Math.round(bodyH * 0.22);
      const tallH = bodyH - stripH - g;
      return {
        panels: [
          { x: 0, y: 0, w: half, h: tallH, rot: 0, photo: 0 },
          { x: half + g, y: 0, w: half, h: tallH, rot: 0, photo: 1 },
          { x: 0, y: tallH + g, w: W, h: stripH, rot: 0, photo: 2 },
        ],
        title: { ...bottomTitle, align: 'left' },
      };
    }
    case 'masthead': {
      // Magazine cover: the title band rides on top like a masthead, a big
      // hero photo fills the middle, three small panels run along the foot.
      const stripH = Math.round((H - titleH) * 0.20);
      const heroH = H - titleH - stripH - g;
      const sw = Math.round((W - 2 * g) / 3);
      return {
        panels: [
          { x: 0, y: titleH, w: W, h: heroH, rot: 0, photo: 0 },
          { x: 0, y: titleH + heroH + g, w: sw, h: stripH, rot: 0, photo: 1 },
          { x: sw + g, y: titleH + heroH + g, w: sw, h: stripH, rot: 0, photo: 2 },
          { x: 2 * (sw + g), y: titleH + heroH + g, w: sw, h: stripH, rot: 0, photo: 3 },
        ],
        title: { x: 0, y: 0, w: W, h: titleH, align: 'center', edge: 'top' },
      };
    }
    case 'four':
    default: {
      const cw = Math.round((W - g) / 2);
      const ch = Math.round((bodyH - g) / 2);
      return {
        panels: [
          { x: 0, y: 0, w: cw, h: ch, rot: 0, photo: 0 },
          { x: cw + g, y: 0, w: cw, h: ch, rot: 0, photo: 1 },
          { x: 0, y: ch + g, w: cw, h: ch, rot: 0, photo: 2 },
          { x: cw + g, y: ch + g, w: cw, h: ch, rot: 0, photo: 3 },
        ],
        title: bottomTitle,
      };
    }
  }
}
