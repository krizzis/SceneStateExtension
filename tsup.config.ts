import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  target: "es2020",
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: false,
  outDir: "dist",
  external: ["../../../extensions.js", "../../../../script.js"],
});
