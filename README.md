# Neon Coast Cover Studio

A GTA 6-style cover art maker for make.fun's **gta6-cover-art-01** bounty
($250 pot). An offline web app: drop in your own photos, pick a multi-panel
poster layout, grade it with a Vice City sunset or neon look, letter it, and
export a PNG to share. Photos never leave the machine — nothing is uploaded.

## What it does

- **9 poster layouts** — Four panels, Hero + three, Full bleed, Nine mosaic,
  Tilted snaps, Diagonal split, Story strip, Vertical split, Magazine
  masthead (title band on top).
- **Any photo, per panel** — up to 4 photos (or one photo in every panel);
  click a panel to select it, double-click it to change its photo, drag on
  the preview to reposition, scroll or slide to zoom, with per-panel
  zoom/pan sliders.
- **Per-panel photo filters** — Original, Duotone, Noir, Warm pop, Vignette
  and Sticker cutout (thick white die-cut border), each applied to one panel
  only, so a cover can mix a duotone panel with a raw one.
- **6 sunset / neon grades** — Sunset, Neon Vice, Gold Hour, Teal Noir,
  Rose Dusk, Mono Heat — plus film grain, halftone dots and a white frame.
- **Poster lettering** — Anton capitals (solid white, sunset gradient or
  neon glow), a Pacifico script subtitle, a badge ribbon and a 1–5 star
  heat meter. Both fonts are vendored under the SIL Open Font License.
- **8 caption presets** — one tap fills title, subtitle and badge with a
  punchy tagline ("Midnight Run", "Pier Pressure", "Salt Air" …), and a
  **🎲 Surprise me** button shuffles layout, grade, filters and caption
  into a fresh look.
- **Before / after compare** — hold the button (or hold **B**) to see the
  raw photos with no grade, grain, halftone or filters.
- **Keyboard shortcuts** — `1`–`9` layout, `G` grade, `F` filter,
  `S` shuffle, `E` export, `A` export all, `U`/`R` undo/redo, hold `B`
  compare.
- **4 post sizes, one click** — 1080 × 1080, 1080 × 1350, 1920 × 1080 and a
  1080 × 1620 poster print, exported as PNG — or **Export all 4 sizes**
  at once. Undo / redo included.
- **Sample photos** — four built-in samples so the first cover takes seconds;
  your own photos replace them.

Everything is original: no Rockstar Games logo, artwork, character or font.
The title, badge and sample scenes are invented ("Neon Shore", "Vice Coast").

## Run it

```
node serve.ts        # serves app/ at http://localhost:8080
```

Open the page in desktop Chrome, add photos, choose a layout and grade,
type a caption, hit **Export PNG**.

## Hand it in (the entry program)

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored
`vendor/makefun-app.ts` library.

## Files

| File | Job |
|---|---|
| `app/index.html` | Page shell, controls, preview canvas |
| `app/style.css` | Editor styling, shot-cover mode |
| `app/src/main.js` | Editor wiring, uploads, drag/zoom, undo/redo, export, shortcuts |
| `app/src/cover.js` | Cover engine: photos, filters, title block, grain, halftone, export |
| `app/src/panels.js` | The 9 layout geometries |
| `app/src/grades.js` | The 6 sunset/neon grades |
| `app/src/filters.js` | The 6 per-panel photo filters |
| `app/src/captions.js` | The 8 caption presets + random pick |
| `app/src/shots.js` | Deterministic `?shot=` scenes for screenshots |
| `app/fonts/` | Anton + Pacifico (OFL, texts beside them) |
| `app/samples/` | Sample photos (kit samples + procedural sunset/neon) |
| `main.ts` | Entry program (copies app/ + screenshots/, writes dossier.json) |
| `serve.ts` | Tiny static server for local trying |
| `vendor/makefun-app.ts` | Kit library, unchanged |
| `shots.json` | Shot list for the 4 screenshots |

## License

MIT — see `LICENSE`.
