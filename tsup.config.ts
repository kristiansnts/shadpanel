import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    cli: "cli/index.ts"
  },
  format: ["esm"],
  dts: true,
  clean: true,
  minify: false,
  sourcemap: true,
  outDir: "dist",
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
})
