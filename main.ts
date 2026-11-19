// Neon Dusk Cover Maker — the program that hands the entry in.
// Node 22, standard library only. It copies this repository's app/ and
// screenshots/ into the output directory and writes /output/dossier.json
// with the vendored make.fun library, so the judge can read the entry.
//
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The scorer's own caps (its gate.json): only text_max_bytes shapes the
// dossier bytes; the others refuse an entry the scorer would refuse — more
// than 4 screenshots or one over 256 KiB; more than 993 files in app/ or
// 48 MiB of app files in all, or a path under app/ over 1000 bytes.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function handIn(repoDir, outDir) {
  // Start from a clean output directory so a stale file from an earlier
  // run can never ride along with this entry.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  cpSync(join(repoDir, 'app'), join(outDir, 'app'), { recursive: true });

  const shots = join(repoDir, 'screenshots');
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(shots)) {
    cpSync(shots, join(outDir, 'screenshots'), { recursive: true });
  }

  const dossier = buildDossier(outDir, CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  return dossier;
}

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const dossier = handIn(repoDir, outDir);
console.log(`handed in ${outDir} (${dossier.length} bytes of dossier)`);
