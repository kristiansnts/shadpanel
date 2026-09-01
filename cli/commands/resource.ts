import path from "path"
import fs from "fs-extra"
import { Command } from "commander"
import { logger } from "../utils/logger"
import { parsePrismaSchema, findModelName } from "../generate/parse-prisma"
import { emitResource, applyMenuPatch, resourceMenuItem } from "../generate/emit-resource"
import { emitPrismaClient, PRISMA_CLIENT_RELATIVE_PATH } from "../generate/emit-prisma-client"
import { writeFile, type WriteOutcome } from "../generate/write-policy"

function logOutcome(outcome: WriteOutcome, filePath: string) {
  switch (outcome) {
    case "written":
      logger.success(`Created: ${filePath}`)
      break
    case "overwritten":
      logger.info(`Overwritten: ${filePath}`)
      break
    case "skipped":
      logger.info(`Skipped (exists): ${filePath}`)
      break
    case "would-create":
      logger.info(`Would create: ${filePath}`)
      break
    case "would-overwrite":
      logger.info(`Would overwrite: ${filePath}`)
      break
    case "would-skip":
      logger.info(`Would skip: ${filePath}`)
      break
  }
}

export type ResourceRunOptions = {
  name: string
  projectPath: string
  force?: boolean
  skipMenu?: boolean
  dryRun?: boolean
}

export type ResourceRunResult = {
  exitCode: number
  error?: string
  outcomes?: Array<{ relativePath: string; outcome: WriteOutcome }>
}

/**
 * Generate a resource. Returns an exit code instead of calling process.exit
 * so tests can assert "Prisma not initialized" without crashing the runner.
 */
export async function runResource(options: ResourceRunOptions): Promise<ResourceRunResult> {
  const projectPath = path.resolve(options.projectPath)
  const force = !!options.force
  const dryRun = !!options.dryRun
  const name = options.name

  logger.info(`Scaffolding resource '${name}' in ${projectPath}`)

  const schemaPath = path.join(projectPath, "prisma", "schema.prisma")
  if (!(await fs.pathExists(schemaPath))) {
    const error = `Prisma not initialized: schema not found at ${schemaPath}`
    logger.error(error)
    logger.newline()
    logger.info("You need to initialize Prisma and define your model before generating a resource.")
    logger.info("Next steps:")
    logger.info("  1) Run 'shadpanel db init'")
    logger.info("  2) Define your model in prisma/schema.prisma")
    logger.info("  3) (Optional) Run 'shadpanel db generate'")
    logger.info("  4) Run 'shadpanel resource <model-name>' again")
    return { exitCode: 2, error }
  }

  const schema = await fs.readFile(schemaPath, "utf-8")
  const { enums, models } = parsePrismaSchema(schema)
  const modelEntry = findModelName(models, name)

  if (!modelEntry) {
    const error = `Model '${name}' not found in prisma/schema.prisma`
    logger.error(error)
    const modelNames = Object.keys(models)
    if (modelNames.length) {
      logger.info("Available models:")
      modelNames.forEach((m) => logger.info(`  - ${m}`))
    } else {
      logger.warn("No models found in your Prisma schema.")
    }
    logger.newline()
    logger.info("Please define your model first in prisma/schema.prisma, e.g.:")
    logger.info("  model Post {\n    id Int @id @default(autoincrement())\n    title String\n    published Boolean @default(false)\n  }")
    logger.newline()
    logger.info("Then run: 'shadpanel resource <model-name>'")
    return { exitCode: 3, error }
  }

  const files = emitResource({
    modelName: modelEntry,
    fields: models[modelEntry],
    enums,
    models,
    resourceName: name,
  })

  files.push({
    relativePath: PRISMA_CLIENT_RELATIVE_PATH,
    content: emitPrismaClient(),
  })

  const outcomes: Array<{ relativePath: string; outcome: WriteOutcome }> = []

  try {
    for (const file of files) {
      const abs = path.join(projectPath, file.relativePath)
      const outcome = await writeFile({
        path: abs,
        content: file.content,
        force,
        dryRun,
      })
      logOutcome(outcome, file.relativePath)
      outcomes.push({ relativePath: file.relativePath, outcome })
    }

    if (!options.skipMenu) {
      const menu = resourceMenuItem({
        modelName: modelEntry,
        fields: models[modelEntry],
        enums,
        models,
        resourceName: name,
      })
      const menuAbs = path.join(projectPath, menu.relativePath)
      const existing = (await fs.pathExists(menuAbs))
        ? await fs.readFile(menuAbs, "utf-8")
        : null
      const patched = applyMenuPatch(existing, menu)

      if (patched.action === "skipped") {
        const outcome = dryRun ? "would-skip" : "skipped"
        logOutcome(outcome, menu.relativePath)
        outcomes.push({ relativePath: menu.relativePath, outcome })
      } else {
        const outcome = await writeFile({
          path: menuAbs,
          content: patched.content,
          force: patched.action === "created" ? force : true,
          dryRun,
        })
        logOutcome(outcome, menu.relativePath)
        outcomes.push({ relativePath: menu.relativePath, outcome })
      }
    }
  } catch (error) {
    logger.error("Failed to write resource files")
    console.error(error)
    return { exitCode: 1, error: "Failed to write resource files", outcomes }
  }

  if (dryRun) {
    logger.info("Dry run complete. No files were written.")
  }

  return { exitCode: 0, outcomes }
}

export function resourceCommand(): Command {
  const cmd = new Command("resource")

  cmd
    .description(
      "Scaffold a Next.js App Router resource from a Prisma model (Resource 2.0 relations; skip-if-exists; --force overwrites)"
    )
    .alias("r")
    .argument("<name>", "Resource name (singular or plural)")
    .option("--force", "Overwrite existing files")
    .option("--skip-menu", "Do not modify config/menu.ts")
    .option("--path <projectPath>", "Target project path", process.cwd())
    .option("--dry-run", "Print would-create / would-skip / would-overwrite without writing")
    .action(async (name: string, options: {
      force?: boolean
      skipMenu?: boolean
      path?: string
      dryRun?: boolean
    }) => {
      const result = await runResource({
        name,
        projectPath: options.path || process.cwd(),
        force: options.force,
        skipMenu: options.skipMenu,
        dryRun: options.dryRun,
      })
      if (result.exitCode !== 0) {
        process.exit(result.exitCode)
      }
    })

  return cmd
}

export default resourceCommand
