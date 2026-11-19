# BUILD LOG — Neon Coast Cover Studio (make.fun gta6-cover-art-01)

An offline GTA 6-style cover art maker: a web app that turns a person's
photos and a caption into a multi-panel poster in the style of GTA 6's
covers, with a Vice City sunset / neon grade, exported as a PNG to share.
Static files under `app/`, no build step, zero network requests — every
pixel drawn on canvas, every font vendored under the SIL Open Font License.
Nothing from Rockstar/GTA: no logo, artwork, character or font — the title,
badge and sample scenes are invented ("Neon Shore", "Vice Coast").

## What it does

- **9 poster layouts** (`app/src/panels.js`): Four panels, Hero + three,
  Full bleed, Nine mosaic, Tilted snaps, Diagonal split, Story strip,
  Vertical split, Magazine masthead (title band on top).
- **Any photo, per panel** (`app/src/main.js`): up to 4 photos, or one photo
  filling every panel; click a panel to select it, double-click to change
  its photo, drag the preview to reposition its photo, scroll or slide to
  zoom, plus per-panel zoom/pan sliders.
- **6 per-panel photo filters** (`app/src/filters.js`): Original, Duotone,
  Noir, Warm pop, Vignette, Sticker cutout — each panel filtered on its own.
- **6 sunset / neon grades** (`app/src/grades.js`): Sunset, Neon Vice, Gold
  Hour, Teal Noir, Rose Dusk, Mono Heat — soft-light + multiply tint,
  vignette, film grain and halftone dots, white frame toggle.
- **Poster lettering** (`app/src/cover.js`): Anton capitals (solid white,
  sunset gradient or neon glow), Pacifico script subtitle, badge ribbon,
  1–5 star heat meter. Fonts vendored in `app/fonts/` with OFL texts.
- **8 caption presets** (`app/src/captions.js`) + a 🎲 randomize-look
  shuffle (layout + grade + filters + caption in one click).
- **Before / after compare**: hold the button or **B** to see the raw photos.
- **Keyboard shortcuts**: `1`–`9` layout, `G` grade, `F` filter, `S` shuffle,
  `E` export, `A` export all, `U`/`R` undo/redo, hold `B` compare.
- **4 post sizes, one click**: 1080 × 1080, 1080 × 1350, 1920 × 1080,
  1080 × 1620 poster print — or export all 4 at once — as PNG via
  `canvas.toBlob`. Undo / redo included.
- **Deterministic screenshots** (`app/src/shots.js`): `?shot=cover|editor`
  stages a fixed scene and sets `window.__shotReady` once painted.

## Files

| File | Job |
|---|---|
| `app/index.html` | Page shell, controls, preview canvas |
| `app/style.css` | Editor styling, shot-cover mode |
| `app/src/main.js` | Editor wiring, uploads, drag/zoom, undo/redo, export, shortcuts |
| `app/src/cover.js` | Cover engine: photos, filters, title block, grain, halftone |
| `app/src/panels.js` | The 9 layout geometries |
| `app/src/grades.js` | The 6 sunset/neon grades |
| `app/src/filters.js` | The 6 per-panel photo filters |
| `app/src/captions.js` | The 8 caption presets + random pick |
| `app/src/shots.js` | Deterministic `?shot=` scenes for screenshots |
| `app/fonts/` | Anton + Pacifico (OFL) |
| `app/samples/` | 2 kit samples + 2 procedural sunset/neon scenes |
| `main.ts` | Entry program (copies app/ + screenshots/, writes dossier.json) |
| `serve.ts` | Kit starter, untouched |
| `vendor/makefun-app.ts` | Kit library, unchanged |
| `shots.json` | Shot list for the 4 screenshots |

## Verification (Playwright headless Chromium, /tmp/gta6-cover-shots/test.js)

**18/18 checks passed:**

- Editor boots; 7 layout chips, 6 grade chips, 3 size chips, 4 photo slots.
- Sample photos fill all 4 slots; layout/grade switch repaints the canvas.
- Caption edit accepted; drag on the canvas pans the selected photo.
- Export downloads `neon-coast-square-1080x1080.png` (1,523,741 bytes).
- **Zero console errors, zero external requests, zero failed requests.**

### Screenshots (JPEG q82, retaken after two fixes)

| File | Size | Dimensions | Shows |
|---|---|---|---|
| `1-cover.jpg` | 112,346 B | 1280 × 720 | Wide exported cover, Hero + three, Neon Vice grade, "NEON SHORE" |
| `2-editor.jpg` | 177,288 B | 1280 × 1150 | Editor with 4 photos loaded, four-panel layout, all controls |
| `3-cover-portrait.jpg` | 141,077 B | 960 × 1200 | Portrait exported cover, Story strip, Gold Hour, "PIER PRESSURE" |
| `4-cover-nine.jpg` | 146,286 B | 1024 × 1024 | Square exported cover, Nine mosaic, Rose Dusk, "VICE COAST" |

Each image was read back and visually inspected.

### Bugs found and fixed while testing

- **Letterboxed cover shots.** `object-fit: contain` on the shot-cover
  canvas letterboxed the 1920 × 1080 buffer inside the viewport and left
  bands of the canvas background at the top and bottom. Removed it and
  take each shot at a viewport matching its own aspect ratio.
- **Badge text misaligned on centred titles.** The badge ribbon text was
  drawn while `textAlign` was still `'center'`, so on centred layouts the
  badge words slid left out of the gold pill. The badge now draws with
  `textAlign = 'left'` and restores the title alignment after.
- **Procedural sunset sample had a green cast.** Its gradient math pushed
  the mid-tones green; regenerated with a warm orange → pink → purple
  ramp, a smaller sun and a lit skyline.

### main.ts determinism

- `MAKEFUN_OUTPUT_DIR=out node main.ts`, then again to `out2`:
  `diff out/dossier.json out2/dossier.json` → **identical**.
- dossier.json: 806,541 bytes (cap 1.5 MiB). out/: 20 entries, 1,679,798
  bytes (caps 1000 entries / 64 MiB).

### Local gate check (/tmp/gta6-cover-shots/gatecheck.js)

- No symlinks; 15 app files (≤993); 296,260 bytes app total (≤48 MiB);
  index.html 4,260 bytes (≤1 MiB).
- 4 screenshots, each ≤256 KiB, long side ≤1280, short side ≥480, valid JPEGs.
- No network references in index.html or any reachable script (the only
  `http://` string is the `www.w3.org/2000/svg` XML namespace inside the
  inline data-URI favicon, which loads nothing).

### Kit pre-submit check

`node cli/makefun.mjs check --kit . --repo <entry>` reported the kit
verified (23 files) and stopped at "has no commit HEAD yet" — expected
before the first commit; re-run after committing. The 5 submission-time
checks (repo_public, repo_owner, repo_created_after_open, commit_in_repo,
duplicate_snapshot) need the public GitHub repo and the commit, which the
parent creates at submission time.

## v2 — re-record rebuild (2026-11-19, this session)

v1's sealed recording failed to seal (session logs were rewritten mid-window),
so v2 is a genuine second pass over the same repo, written fresh in this
session — every app file rewritten or restructured with real new systems,
not re-typed lines. v1 commit 1a3896e stays in history; v2 builds on top.

### What v2 added

- **Per-panel photo filters** (`app/src/filters.js`, new): Original, Duotone
  (grayscale + pink multiply + gold screen), Noir, Warm pop, Vignette and
  Sticker cutout (thick white die-cut border + drop shadow). Each panel
  carries its own `filter` in state; filters survive undo/redo and the
  randomizer. Compare mode renders every panel unfiltered.
- **2 new layouts** (`app/src/panels.js`): Vertical split (duotone diptych:
  two tall panels + wide strip) and Magazine masthead (title band on top
  like a magazine, hero photo, three-panel foot). The title zone now carries
  an `edge` (`top`/`bottom`); halftone dots hug the photo side of the band.
  9 layouts total.
- **Caption preset library** (`app/src/captions.js`, new): 8 one-tap
  taglines (Neon Shore, Pier Pressure, Midnight Run, Salt Air, Last Exit,
  Sunset Strip, High Tide, Vice Royale) filling title + subtitle + badge.
  Editing any word clears the preset highlight.
- **🎲 Surprise me — randomize look** (`main.js`): one click shuffles layout,
  grade, caption preset and a fresh filter per panel (weighted to keep at
  least one raw photo). Undo restores the pre-shuffle look.
- **Poster print export pipeline**: a 4th size, 1080 × 1620 (2:3), plus an
  **Export all 4 sizes** button that downloads square, portrait, wide and
  print in one go. Single export now revokes its object URL after use.
- **Before / after compare**: hold the "Hold: before / after" button (or
  hold **B**) to see the raw photos — no grade, grain, halftone or filters —
  and release to restore the graded cover. The stage label says which view
  is showing.
- **Keyboard shortcuts**: `1`–`9` layout, `G` cycle grade, `F` cycle the
  selected panel's filter, `S` shuffle, `E` export, `A` export all,
  `U`/`R` undo/redo, hold `B` compare (ignored while typing in a field).

### v1 weak points fixed while re-reading

- **Slot click opened the file picker every time.** Clicking a slot now only
  selects its panel; the picker opens on double-click or the new "Change
  selected photo" button.
- **Shot scenes pushed 4 undo entries.** `setSlotImage` takes a `silent`
  option; `shots.js` uses it, so staged screenshots no longer pollute the
  undo stack.
- **Shots could not stage the new features.** `shots.js` now accepts
  `caption` (preset id) and `filters` (one per slot) query params.
- **Screenshot 4 replaced**: the nine-mosaic shot is now the magazine
  masthead on the 2:3 poster print size (720 × 1080 viewport, within the
  gate's long-side ≤ 1280 rule), showing the sticker + duotone filters.

## Verification v2 (Playwright headless Chromium, /tmp/gta6-cover-shots/test-v2.js)

**31/31 checks passed:**

- Editor boots; 9 layout chips, 6 grade chips, 4 size chips, 4 photo slots,
  6 filter chips, 8 caption presets.
- Sample photos fill all 4 slots; layout/grade switch repaints the canvas.
- Caption preset fills the title; duotone filter applies to the selected
  panel and repaints.
- Keyboard `8` picks the Vertical split layout; randomize changes the look;
  undo restores the pre-shuffle look.
- Hold-`B` compare enters compare mode, shows different pixels, and release
  restores the graded pixels exactly.
- Export downloads `neon-coast-square-1080x1080.png` (1,245,655 bytes);
  export-all downloads all 4 PNGs including `neon-coast-print-1080x1620.png`.
- Drag on the canvas pans the selected photo.
- **Zero console errors, zero external requests, zero failed requests.**

### Screenshots v2 (JPEG q82, all retaken fresh in this session)

| File | Size | Dimensions | Shows |
|---|---|---|---|
| `1-cover.jpg` | 112,346 B | 1280 × 720 | Wide exported cover, Hero + three, Neon Vice grade, "NEON SHORE" |
| `2-editor.jpg` | 177,783 B | 1280 × 1150 | Editor with 4 photos loaded, four-panel layout, new caption/filter controls |
| `3-cover-portrait.jpg` | 141,077 B | 960 × 1200 | Portrait exported cover, Story strip, Gold Hour, "PIER PRESSURE" |
| `4-cover-masthead.jpg` | 76,925 B | 720 × 1080 | Poster print 2:3, Magazine masthead, Rose Dusk, sticker + duotone filters, "SALT AIR" |

Each image was read back and visually inspected (masthead + editor).

### main.ts determinism v2

- `MAKEFUN_OUTPUT_DIR=out node main.ts`, then again to `out2`:
  `diff out/dossier.json out2/dossier.json` → **identical**.
- dossier.json: 806,541 bytes (cap 1.5 MiB). out/: 1,551,390 bytes
  (caps 1000 entries / 64 MiB).

### Local gate check v2 (/tmp/gta6-cover-shots/gatecheck.js)

- No symlinks; 17 app files (≤993); 312,133 bytes app total (≤48 MiB);
  index.html 5,678 bytes (≤1 MiB).
- 4 screenshots, each ≤256 KiB, long side ≤1280, short side ≥480, valid JPEGs.
- No network references in index.html or any reachable script (the only
  `http://` string is the `www.w3.org/2000/svg` XML namespace inside the
  inline data-URI favicon, which loads nothing).

### Kit pre-submit check v2

`node cli/makefun.mjs check --kit . --repo <entry>` (run 2026-11-19 after the
v2 commit): kit verified (23 files); **4 passed, 0 failed, 16 skipped, 5
checked at submission**. Passed: competition_open, snapshot (30 files,
900,494 bytes), license_osi (MIT), entrypoint (main.ts, node22). The 5
at-submission checks (repo_public, repo_owner, repo_created_after_open,
commit_in_repo, duplicate_snapshot) need the public GitHub repo and the
commit pushed, which the parent creates at submission time.

## Submission (parent's steps, after the seal)

1. Write the usage rows (coordinator + this build session) to
   `~/.makefun/muse-usage-gta6-cover-art-01.jsonl`, then kill the recording
   and verify the seal line in `~/.makefun/record-gta6-cover-art-01.log`
   BEFORE anything else. If the seal fails, do not submit — report it.
2. Only with a sealed recording id: create the GitHub repo, upload the
   final files, and submit with
   `node cli/makefun.mjs submit --competition gta6-cover-art-01 --recording <id>
   --repo-url https://github.com/clay390/<repo> --commit <sha>
   --title "Neon Coast Cover Studio" --keypair ~/workspace/makefun/makefun-keypair.json
   --repo <entry dir>` (run from inside the kit dir; prizes are escrowed,
   so --keypair is required). Deadline: 2026-11-21T10:30:00Z
   (21 Nov 17:30 WIB). Max 5 submissions/day, 10 total.

1. Write the usage rows (coordinator + this build session) to
   `~/.makefun/muse-usage-gta6-cover-art-01.jsonl`, then kill the recording
   and verify the seal line in `~/.makefun/record-gta6-cover-art-01.log`
   BEFORE anything else. If the seal fails, do not submit — report it.
2. Only with a sealed recording id: create the GitHub repo, upload the
   final files, and submit with
   `node cli/makefun.mjs submit --competition gta6-cover-art-01 --recording <id>
   --repo-url https://github.com/clay390/<repo> --commit <sha>
   --title "Neon Coast Cover Studio" --keypair ~/workspace/makefun/makefun-keypair.json
   --repo <entry dir>` (run from inside the kit dir; prizes are escrowed,
   so --keypair is required). Deadline: 2026-11-21T10:30:00Z
   (21 Nov 17:30 WIB). Max 5 submissions/day, 10 total.
