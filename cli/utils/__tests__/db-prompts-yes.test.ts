import { describe, expect, it } from "vitest"
import { promptDatabaseInit } from "../db-prompts"

describe("promptDatabaseInit --yes defaults", () => {
  it("returns sqlite + installPrisma without prompting", async () => {
    const answers = await promptDatabaseInit(false, { yes: true })
    expect(answers).toEqual({
      driver: "sqlite",
      packageManager: "npm",
      installPrisma: true,
    })
  })

  it("honors explicit driver and skip install", async () => {
    const answers = await promptDatabaseInit(false, {
      yes: true,
      driver: "postgresql",
      packageManager: "pnpm",
      installPrisma: false,
    })
    expect(answers).toEqual({
      driver: "postgresql",
      packageManager: "pnpm",
      installPrisma: false,
    })
  })

  it("does not install Prisma when already installed", async () => {
    const answers = await promptDatabaseInit(true, { yes: true })
    expect(answers?.installPrisma).toBe(false)
    expect(answers?.driver).toBe("sqlite")
  })
})
