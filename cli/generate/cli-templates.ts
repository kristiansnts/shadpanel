import { fileURLToPath } from "url"
import path from "path"
import fs from "fs-extra"

/**
 * Resolve the published/source CLI package root (the directory that contains `templates/`).
 */
export function getCliPackageRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const candidates = [
    path.resolve(here, "../.."), // source: cli/generate → repo root
    path.resolve(here, ".."), // bundled: dist/cli.js → package root
  ]
  for (const root of candidates) {
    if (fs.existsSync(path.join(root, "templates"))) return root
  }
  return candidates[0]
}

export function getCliTemplatesDir(): string {
  return path.join(getCliPackageRoot(), "templates")
}

export async function getCliSchemaTemplate(): Promise<string | undefined> {
  const templatePath = path.join(
    getCliTemplatesDir(),
    "prisma",
    "schema.prisma.template"
  )
  if (await fs.pathExists(templatePath)) {
    return fs.readFile(templatePath, "utf-8")
  }
  return undefined
}

export async function getCliSeedTemplate(): Promise<string | undefined> {
  const seedPath = path.join(getCliTemplatesDir(), "prisma", "seed.ts")
  if (await fs.pathExists(seedPath)) {
    return fs.readFile(seedPath, "utf-8")
  }
  return undefined
}
