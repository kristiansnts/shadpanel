import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const README = readFileSync(path.join(process.cwd(), "README.md"), "utf-8")

function techStackSection(markdown: string): string {
  const start = markdown.indexOf("## Tech Stack")
  expect(start).toBeGreaterThanOrEqual(0)
  const rest = markdown.slice(start)
  const next = rest.search(/\n## /)
  return next === -1 ? rest : rest.slice(0, next)
}

describe("README stack smoke", () => {
  it("does not claim Next 14 or NextAuth v5", () => {
    expect(README).not.toMatch(/Next\.js 14|Next 14/)
    expect(README).not.toMatch(/NextAuth v5|NextAuth\.js v5/)
  })

  it("current stack is Next.js 16 + Better Auth, not Next 15 or NextAuth v4", () => {
    expect(README).toMatch(/Next\.js 16/)
    expect(README).toMatch(/Better Auth/)
    expect(README).not.toMatch(/Next\.js 15/)
    expect(README).not.toMatch(/NextAuth v4|NextAuth\.js v4|next-auth/)
    const stack = techStackSection(README)
    expect(stack).toMatch(/Next\.js 16/)
    expect(stack).toMatch(/Better Auth/)
    expect(stack).not.toMatch(/NextAuth/)
    expect(stack).not.toMatch(/Next\.js 15/)
  })

  it("heroes shadpanel resource before create-shadpanel-next", () => {
    const resourceAt = README.indexOf("shadpanel resource")
    expect(resourceAt).toBeGreaterThanOrEqual(0)

    const createAt = README.indexOf("create-shadpanel-next")
    if (createAt >= 0) {
      const resourceBeforeCreate = resourceAt < createAt
      const deprecatedNearCreate = /deprecated/i.test(
        README.slice(Math.max(0, createAt - 200), createAt + 200)
      )
      expect(resourceBeforeCreate || deprecatedNearCreate).toBe(true)
    }
  })

  it("documents migrate make/run/status and not db:generate", () => {
    expect(README).toContain("shadpanel db migrate make")
    expect(README).not.toContain("shadpanel db:generate")
  })
})
