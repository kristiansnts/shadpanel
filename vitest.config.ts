import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["cli/**/*.test.ts", "docs/**/*.test.ts"],
  },
})
