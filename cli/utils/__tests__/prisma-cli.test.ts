import { mkdirSync, writeFileSync } from "node:fs"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { PRISMA_PIN, prismaCommandLine, prismaInvocation } from "../prisma-cli"

const PRISMA_COMMAND_SOURCE = readFileSync(
  path.join(process.cwd(), "cli/commands/prisma.ts"),
  "utf-8"
)

describe("prismaInvocation pin", () => {
  it("uses node_modules/.bin/prisma when present", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "shadpanel-prisma-"))
    const binDir = path.join(dir, "node_modules", ".bin")
    mkdirSync(binDir, { recursive: true })
    const localBin = path.join(binDir, "prisma")
    writeFileSync(localBin, "#!/bin/sh\n")

    const inv = prismaInvocation(dir, ["generate"])
    expect(inv.command).toBe(localBin)
    expect(inv.args).toEqual(["generate"])
    expect(prismaCommandLine(dir, ["generate"])).not.toMatch(/npx prisma(?!@)/)
    expect(prismaCommandLine(dir, ["generate"])).not.toContain("npx prisma ")
  })

  it("falls back to npx --yes prisma@6.18.0, never unpinned npx prisma", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "shadpanel-prisma-empty-"))
    const inv = prismaInvocation(dir, ["generate"])
    expect(inv.command).toBe("npx")
    expect(inv.args).toEqual(["--yes", `prisma@${PRISMA_PIN}`, "generate"])
    expect(PRISMA_PIN).toBe("6.18.0")

    const line = prismaCommandLine(dir, ["generate"])
    expect(line).toBe("npx --yes prisma@6.18.0 generate")
    expect(line).not.toBe("npx prisma generate")
    expect(line).not.toMatch(/(^|[\s"])npx prisma(?!@)/)
    expect(line).not.toMatch(/prisma@8/)
  })
})

describe("db generate does not invoke unpinned npx prisma", () => {
  it("prisma.ts generate paths do not shell out to unpinned npx prisma", () => {
    expect(PRISMA_COMMAND_SOURCE).not.toMatch(/npx prisma generate/)
    expect(PRISMA_COMMAND_SOURCE).not.toMatch(/["'`]npx prisma/)
    expect(PRISMA_COMMAND_SOURCE).not.toMatch(/npx prisma(?!@)/)
    expect(PRISMA_COMMAND_SOURCE).toContain('runPrisma(["generate"]')
    expect(PRISMA_COMMAND_SOURCE).toContain('from "../utils/prisma-cli"')
  })
})
