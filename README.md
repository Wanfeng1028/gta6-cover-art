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

MIT — see `LICENSE`. Fonts are under the SIL Open Font License, Version 1.1 (full text in the Fonts section below).

## Fonts

This project uses the Anton and Inter typefaces, both licensed under the SIL Open Font License, Version 1.1. The full text of the license follows.

Copyright 2020 The Anton Project Authors (https://github.com/googlefonts/AntonFont.git)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded, 
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
