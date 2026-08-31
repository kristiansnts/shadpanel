import { mkdtemp, readFile, writeFile as writeFs } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { writeFile } from "../write-policy"

describe("writeFile policy", () => {
  it("creates a missing file", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "shadpanel-write-"))
    const target = path.join(dir, "lib", "prisma.ts")
    const outcome = await writeFile({ path: target, content: "created" })
    expect(outcome).toBe("written")
    expect(await readFile(target, "utf-8")).toBe("created")
  })

  it("skips an existing file and leaves content unchanged", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "shadpanel-write-"))
    const target = path.join(dir, "page.tsx")
    await writeFs(target, "original")
    const outcome = await writeFile({ path: target, content: "new" })
    expect(outcome).toBe("skipped")
    expect(await readFile(target, "utf-8")).toBe("original")
  })

  it("overwrites when force is set", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "shadpanel-write-"))
    const target = path.join(dir, "page.tsx")
    await writeFs(target, "original")
    const outcome = await writeFile({ path: target, content: "new", force: true })
    expect(outcome).toBe("overwritten")
    expect(await readFile(target, "utf-8")).toBe("new")
  })

  it("dry-run reports outcomes and writes nothing", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "shadpanel-write-"))
    const missing = path.join(dir, "new.ts")
    const existing = path.join(dir, "old.ts")
    await writeFs(existing, "keep")

    expect(await writeFile({ path: missing, content: "x", dryRun: true })).toBe("would-create")
    expect(await writeFile({ path: existing, content: "x", dryRun: true })).toBe("would-skip")
    expect(await writeFile({ path: existing, content: "x", force: true, dryRun: true })).toBe(
      "would-overwrite"
    )
    expect(await readFile(existing, "utf-8")).toBe("keep")
  })
})
