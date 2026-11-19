# Neon Dusk Cover Maker

[![Built on make.fun](https://img.shields.io/badge/built%20on-make.fun-ff4d8d)](https://make.fun)
[![Bounty: Make GTA 6 Cover Art](https://img.shields.io/badge/bounty-Make%20GTA%206%20Cover%20Art-7c3aed)](https://make.fun/c/gta6-cover-art-01)
[![Prize $250](https://img.shields.io/badge/prize-%24250-22c55e)](https://make.fun/c/gta6-cover-art-01)

Turn any photo into GTA-style multi-panel cover art, right in your browser. Pick a photo or a built-in sample, choose a layout, edit the neon caption, and export a share-ready PNG. Everything runs offline from static files — your photos never leave your machine.

Built for the [Make GTA 6 Cover Art](https://make.fun/c/gta6-cover-art-01) bounty on [make.fun](https://make.fun). Try make.fun yourself with my referral link: https://make.fun/r/9q000x24

## What it does

- **Any photo**: upload your own, or use one of the two built-in sample photos (a pier at dusk, a beach boulevard).
- **Three layouts**: split screen, triptych, and hero — each panel holds its own photo.
- **Crop and position**: click a panel to select it, drag the photo to move it, scroll (or use the zoom slider) to zoom it.
- **Neon caption**: edit the title and subtitle; toggle the pink-and-cyan neon glow on the title.
- **Colour grades**: Sunset, Neon night, Teal dusk, and Mono noir.
- **Export**: one click exports a PNG at 1080 x 1080, 1080 x 1350, or 1920 x 1080.
- **Offline**: no network requests at runtime. Fonts (Anton for titles, Inter for body text) ship in `app/fonts/` under the SIL Open Font License.

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

## How it is put together

- `app/index.html` — the editor page.
- `app/style.css` — the dark neon editor styling.
- `app/src/cover.js` — the cover engine: panel layouts, cover-fit cropping, colour grades, title block, PNG export.
- `app/src/main.js` — the editor wiring: photos, panel picking, drag and zoom, export.
- `app/fonts/` — Anton and Inter as woff2, with their OFL licence texts.
- `app/samples/` — the two built-in sample photos.
- `serve.ts` — the local static server.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json`.
- `shots.json` — the list of the four screenshots.

## Hand in the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That writes `out/dossier.json` next to the copied `app/` and `screenshots/`.

## Licence

MIT — see `LICENSE`. Fonts are under the SIL Open Font License, Version 1.1 (texts in `app/fonts/`).
