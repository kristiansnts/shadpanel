import type { InstallationType } from "./prompts"

export type DemoCliFlags = {
  /** Commander `--no-demos` sets this to `false`. */
  demos?: boolean
  noDemos?: boolean
  skipDemos?: boolean
}

/**
 * Commander `--no-demos` sets `demos: false` (not `noDemos`).
 * `--skip-demos` / programmatic `noDemos` are equivalent skip flags.
 */
export function shouldSkipDemos(cliOptions: DemoCliFlags = {}): boolean {
  return (
    cliOptions.noDemos === true ||
    cliOptions.skipDemos === true ||
    cliOptions.demos === false
  )
}

export function shouldCopyDemoPages(
  installationType: InstallationType,
  demos: boolean
): boolean {
  return installationType === "full-panel" && demos === true
}
