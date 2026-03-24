import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(".");
const distDir = resolve(rootDir, "dist");

mkdirSync(distDir, { recursive: true });

for (const assetName of ["manifest.json", "settings.html", "style.css"]) {
  cpSync(resolve(rootDir, assetName), resolve(distDir, assetName), {
    force: true,
  });
}
