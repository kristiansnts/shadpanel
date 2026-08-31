import { describe, expect, it } from "vitest"
import { emitSeed, patchPrismaSeedConfig } from "../emit-seed"

describe("emitSeed", () => {
  it("has no sample users or passwords", () => {
    const seed = emitSeed()
    expect(seed).toContain("PrismaClient")
    expect(seed).toContain("async function main()")
    expect(seed).not.toMatch(/admin123/)
    expect(seed).not.toMatch(/admin@example\.com/)
    expect(seed).not.toMatch(/password/i)
  })

  it("adds prisma.seed without clobbering other keys", () => {
    const original = {
      name: "app",
      scripts: { dev: "next dev" },
      prisma: { schema: "prisma/schema.prisma" },
    }
    const { pkg, changed } = patchPrismaSeedConfig(original)
    expect(changed).toBe(true)
    expect(pkg.scripts).toEqual({ dev: "next dev" })
    expect(pkg.prisma?.schema).toBe("prisma/schema.prisma")
    expect(pkg.prisma?.seed).toBe("npx tsx prisma/seed.ts")
  })

  it("skips when prisma.seed already exists", () => {
    const original = {
      prisma: { seed: "node prisma/custom-seed.js" },
    }
    const { pkg, changed } = patchPrismaSeedConfig(original)
    expect(changed).toBe(false)
    expect(pkg.prisma?.seed).toBe("node prisma/custom-seed.js")
  })
})
