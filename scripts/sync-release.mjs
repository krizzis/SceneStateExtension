import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(".");

copyFileSync(resolve(rootDir, "dist", "index.js"), resolve(rootDir, "index.js"));