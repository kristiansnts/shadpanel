import { defineConfig } from "tsup"

/**
 * Build configuration for create-shadpanel-next CLI
 *
 * This builds the CLI tool to JavaScript for npx usage
 */
export default defineConfig({
  entry: {
    cli: "cli/index.ts",
  },
  format: ["esm"],
  target: "node18",
  bundle: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  outDir: "dist",
  // Add shebang for CLI executable
  banner: {
    js: "#!/usr/bin/env node",
  },
  // Don't bundle these - they should be in node_modules
  external: [
    "commander",
    "prompts",
    "chalk",
    "ora",
    "fs-extra",
  ],
})
