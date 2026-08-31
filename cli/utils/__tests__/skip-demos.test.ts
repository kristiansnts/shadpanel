import { Command } from "commander"
import { describe, expect, it } from "vitest"
import { promptInitQuestions } from "../prompts"
import { shouldCopyDemoPages, shouldSkipDemos } from "../skip-demos"

/** Same option surface as `cli/index.ts` init — Commander maps `--no-demos` to `demos: false`. */
function parseInitOptions(argv: string[]) {
  const program = new Command()
  program.exitOverride()
  program
    .command("init")
    .argument("[project-name]")
    .option("--yes")
    .option("--skip-install")
    .option("--no-demos", "Skip demo pages")
    .option("--skip-demos", "Skip demo pages (same as --no-demos)")
    .action(() => {})
  program.parse(["node", "shadpanel", "init", "qa-app", ...argv], { from: "node" })
  const cmd = program.commands.find((c) => c.name() === "init")
  return cmd?.opts() ?? {}
}

describe("shouldSkipDemos / Commander --no-demos", () => {
  it("treats Commander --no-demos (demos: false) as skip", () => {
    const opts = parseInitOptions(["--no-demos"])
    expect(opts.demos).toBe(false)
    expect(opts.noDemos).toBeUndefined()
    expect(shouldSkipDemos(opts)).toBe(true)
  })

  it("treats --skip-demos as an equivalent skip flag", () => {
    const opts = parseInitOptions(["--skip-demos"])
    expect(opts.skipDemos).toBe(true)
    expect(shouldSkipDemos(opts)).toBe(true)
  })

  it("treats programmatic noDemos as skip", () => {
    expect(shouldSkipDemos({ noDemos: true })).toBe(true)
  })

  it("does not skip when Commander default demos:true (no skip flag)", () => {
    const opts = parseInitOptions(["--yes"])
    expect(opts.demos).toBe(true)
    expect(shouldSkipDemos(opts)).toBe(false)
  })
})

describe("promptInitQuestions honors skip-demo flags (--yes path)", () => {
  it("does not include demos when Commander --no-demos shape is passed with --yes", async () => {
    const opts = parseInitOptions(["--yes", "--no-demos", "--skip-install"])
    const answers = await promptInitQuestions("qa-no-demos", opts)
    expect(answers).not.toBeNull()
    expect(answers!.demos).toBe(false)
    expect(answers!.demoTypes).toEqual([])
    expect(shouldCopyDemoPages(answers!.installationType, answers!.demos)).toBe(false)
  })

  it("does not include demos for --skip-demos --yes", async () => {
    const opts = parseInitOptions(["--yes", "--skip-demos"])
    const answers = await promptInitQuestions("qa-skip-demos", opts)
    expect(answers!.demos).toBe(false)
    expect(shouldCopyDemoPages(answers!.installationType, answers!.demos)).toBe(false)
  })

  it("includes demos by default for full-panel --yes (no skip flag)", async () => {
    const opts = parseInitOptions(["--yes"])
    const answers = await promptInitQuestions("qa-with-demos", opts)
    expect(answers!.demos).toBe(true)
    expect(answers!.demoTypes.length).toBeGreaterThan(0)
    expect(shouldCopyDemoPages(answers!.installationType, answers!.demos)).toBe(true)
  })
})
