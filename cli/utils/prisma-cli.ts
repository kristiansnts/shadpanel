import { execFileSync, type ExecFileSyncOptions } from "child_process"
import fs from "fs"
import path from "path"

/** ShadPanel 1.4.0 pin. Never fall back to unpinned `npx prisma` (Prisma 8 prompt). */
export const PRISMA_PIN = "6.18.0"

export type PrismaInvocation = {
  command: string
  args: string[]
}

function localPrismaBin(projectDir: string): string | null {
  const unix = path.join(projectDir, "node_modules", ".bin", "prisma")
  const win = path.join(projectDir, "node_modules", ".bin", "prisma.cmd")
  if (fs.existsSync(unix)) return unix
  if (fs.existsSync(win)) return win
  return null
}

/**
 * Resolve how to invoke the Prisma CLI without an interactive npx prompt.
 * Prefer the project's `node_modules/.bin/prisma`; otherwise pin `prisma@6.18.0`.
 */
export function prismaInvocation(projectDir: string, args: string[]): PrismaInvocation {
  const local = localPrismaBin(projectDir)
  if (local) {
    return { command: local, args: [...args] }
  }
  return {
    command: "npx",
    args: ["--yes", `prisma@${PRISMA_PIN}`, ...args],
  }
}

export function prismaCommandLine(projectDir: string, args: string[]): string {
  const { command, args: argv } = prismaInvocation(projectDir, args)
  return [command, ...argv].join(" ")
}

const NON_INTERACTIVE_ENV = {
  npm_config_yes: "true",
  NPM_CONFIG_YES: "true",
} as const

export function runPrisma(
  args: string[],
  options: {
    cwd?: string
    encoding?: BufferEncoding
    stdio?: ExecFileSyncOptions["stdio"]
  } = {}
): string {
  const cwd = options.cwd ?? process.cwd()
  const { command, args: argv } = prismaInvocation(cwd, args)
  const capture = options.encoding !== undefined || options.stdio === "pipe"
  const stdio = options.stdio ?? (capture ? "pipe" : "inherit")
  const result = execFileSync(command, argv, {
    cwd,
    stdio,
    encoding: options.encoding ?? (capture ? "utf-8" : undefined),
    env: {
      ...process.env,
      ...NON_INTERACTIVE_ENV,
    },
  })
  if (typeof result === "string") return result
  if (Buffer.isBuffer(result)) return result.toString("utf-8")
  return ""
}
