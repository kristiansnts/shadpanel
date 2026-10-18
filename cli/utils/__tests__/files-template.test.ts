import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { copyConfigTemplate, processTemplate, type TemplateVariables } from "../files"

const dirs: string[] = []

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })))
})

const vars: TemplateVariables = {
  APP_NAME: "App",
  PROJECT_NAME: "app",
  SHADPANEL_VERSION: "1.6.0",
  BETTER_AUTH_SECRET: "secret",
  AUTH: true,
  GOOGLE: false,
  GITHUB: false,
  CREDENTIALS: true,
}

describe("template processing (1.6.0 release)", () => {
  it("substitutes BOOL placeholders for auth provider defaults", () => {
    const out = processTemplate(
      "google: {{BOOL:GOOGLE}}, github: {{BOOL:GITHUB}}, credentials: {{BOOL:CREDENTIALS}}",
      vars
    )
    expect(out).toBe("google: false, github: false, credentials: true")
  })

  it("renames shipped gitignore to .gitignore on config copy", async () => {
    const templatesRoot = await mkdtemp(path.join(tmpdir(), "shadpanel-tpl-"))
    const target = await mkdtemp(path.join(tmpdir(), "shadpanel-tgt-"))
    dirs.push(templatesRoot, target)

    const configDir = path.join(templatesRoot, "config")
    await mkdir(configDir, { recursive: true })
    await writeFile(path.join(configDir, "gitignore"), "node_modules/\n.next/\n")
    await writeFile(path.join(configDir, "next.config.ts"), "export default {}\n")

    await copyConfigTemplate(templatesRoot, target, vars)
    const gitignore = await readFile(path.join(target, ".gitignore"), "utf-8")
    expect(gitignore).toContain("node_modules/")
  })
})
