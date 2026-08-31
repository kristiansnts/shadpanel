import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const README = readFileSync(path.join(process.cwd(), "README.md"), "utf-8")

describe("README stack smoke", () => {
  it("does not claim Next 14 or NextAuth v5", () => {
    expect(README).not.toMatch(/Next\.js 14|Next 14/)
    expect(README).not.toMatch(/NextAuth v5|NextAuth\.js v5/)
  })

  it("heroes shadpanel resource before create-shadpanel-next", () => {
    const resourceAt = README.indexOf("shadpanel resource")
    expect(resourceAt).toBeGreaterThanOrEqual(0)

    const createAt = README.indexOf("create-shadpanel-next")
    if (createAt >= 0) {
      const line = README.slice(0, createAt).split("\n").pop() + README.slice(createAt).split("\n")[0]
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
