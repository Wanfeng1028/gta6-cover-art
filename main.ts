// Neon Dusk Cover Maker: the entry program. It copies the app and its
// screenshots into the output directory and writes dossier.json there with
// buildDossier from vendor/makefun-app.ts. Standard library only, Node 22.
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || "/output";

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

function freshDir(path) {
  if (existsSync(path)) rmSync(path, { recursive: true, force: true });
  mkdirSync(path, { recursive: true });
}

mkdirSync(OUTPUT_DIR, { recursive: true });
freshDir(join(OUTPUT_DIR, "app"));
freshDir(join(OUTPUT_DIR, "screenshots"));
cpSync(join(REPO_ROOT, "app"), join(OUTPUT_DIR, "app"), { recursive: true });
cpSync(join(REPO_ROOT, "screenshots"), join(OUTPUT_DIR, "screenshots"), { recursive: true });

const dossier = buildDossier(OUTPUT_DIR, CAPS);
writeFileSync(join(OUTPUT_DIR, "dossier.json"), dossier);

console.log("Neon Dusk dossier written: " + dossier.length + " bytes -> " + join(OUTPUT_DIR, "dossier.json"));
