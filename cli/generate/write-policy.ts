import fs from "fs-extra"
import path from "path"

export type WriteOutcome =
  | "written"
  | "skipped"
  | "overwritten"
  | "would-create"
  | "would-skip"
  | "would-overwrite"

export type WriteFileOptions = {
  path: string
  content: string
  force?: boolean
  dryRun?: boolean
}

/**
 * Skip-if-exists unless `force`. Never fail the run because a file already exists.
 */
export async function writeFile(options: WriteFileOptions): Promise<WriteOutcome> {
  const exists = await fs.pathExists(options.path)

  if (options.dryRun) {
    if (!exists) return "would-create"
    return options.force ? "would-overwrite" : "would-skip"
  }

  if (exists && !options.force) {
    return "skipped"
  }

  await fs.ensureDir(path.dirname(options.path))
  await fs.writeFile(options.path, options.content, "utf-8")
  return exists ? "overwritten" : "written"
}

export function isWriteSuccess(outcome: WriteOutcome): boolean {
  return (
    outcome === "written" ||
    outcome === "overwritten" ||
    outcome === "skipped" ||
    outcome === "would-create" ||
    outcome === "would-skip" ||
    outcome === "would-overwrite"
  )
}
