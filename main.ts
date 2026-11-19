// Sunset Cover Studio — the entry program for gta6-cover-art-01.
//
// Node 22, standard library only. It hands the app in: copy this repository's
// app/ (the static offline cover maker) and screenshots/ (the screenshots its
// maker took) into the output directory, then write /output/dossier.json with
// buildDossier from the vendored make.fun library, so the scorer and the judge
// read exactly what is handed in. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The two runs the grader does must write identical bytes, so this program
// copies files as they are and lets buildDossier do the only writing that
// derives anything. vendor/makefun-app.ts is the kit's copy, untouched.

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

// The repository root: the directory this file lives in.
const repoRoot = fileURLToPath(new URL(".", import.meta.url));
// The grader's writable output; a local run points it somewhere else.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

function handIn() {
  mkdirSync(outputDir, { recursive: true });
  copyTree(join(repoRoot, "app"), join(outputDir, "app"));
  if (existsSync(join(repoRoot, "screenshots"))) {
    copyTree(join(repoRoot, "screenshots"), join(outputDir, "screenshots"));
  }

  // The scorer's own caps (reference/gate.json): text_max_bytes shapes the
  // dossier's bytes; the other limits refuse an entry the scorer would refuse
  // (more than 4 screenshots or one over 256 KiB; more than 993 files in app/
  // or 48 MiB of app files in all, or a path under app/ over 1000 bytes).
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, "dossier.json"), dossier);
}

handIn();
