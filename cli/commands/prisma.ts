import { Command } from "commander"
import { execSync } from "child_process"
import chalk from "chalk"
import path from "path"
import fs from "fs-extra"
import { logger } from "../utils/logger"
import { getDriver, writePrismaSchema } from "../utils/db"
import { promptDatabaseInit, createEnvFile } from "../utils/db-prompts"
import { emitPrismaClient, PRISMA_CLIENT_RELATIVE_PATH } from "../generate/emit-prisma-client"
import { emitSeed, SEED_RELATIVE_PATH } from "../generate/emit-seed"
import { getCliSeedTemplate } from "../generate/cli-templates"
import { writeFile, type WriteOutcome } from "../generate/write-policy"
import { prisma5Warnings, warnPrisma5 } from "../generate/prisma5"
import { ensurePrismaSeed } from "../utils/dependencies"
import { runPrisma } from "../utils/prisma-cli"

function logWriteOutcome(outcome: WriteOutcome, filePath: string) {
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

async function warnIfPrisma5(projectDir: string): Promise<void> {
  let packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } | undefined
  let schema: string | undefined
  let templateContent: string | undefined

  const pkgPath = path.join(projectDir, "package.json")
  if (await fs.pathExists(pkgPath)) {
    try {
      packageJson = await fs.readJson(pkgPath)
    } catch {
      // ignore invalid package.json
    }
  }

  const schemaPath = path.join(projectDir, "prisma", "schema.prisma")
  if (await fs.pathExists(schemaPath)) {
    schema = await fs.readFile(schemaPath, "utf-8")
  }

  const templatePath = path.join(projectDir, "prisma", "schema.prisma.template")
  if (await fs.pathExists(templatePath)) {
    templateContent = await fs.readFile(templatePath, "utf-8")
  }

  const warnings = prisma5Warnings({ packageJson, schema, templateContent })
  if (warnings.length) {
    warnPrisma5(warnings, (message) => logger.warn(message))
  }
}

// Check if Prisma is already installed
function isPrismaInstalled(projectDir: string): boolean {
  try {
    const packageJsonPath = path.join(projectDir, "package.json")
    if (!fs.existsSync(packageJsonPath)) {
      return false
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
    const hasPrismaClient = packageJson.dependencies?.["@prisma/client"]
    const hasPrismaCli = packageJson.devDependencies?.["prisma"]

    return !!(hasPrismaClient || hasPrismaCli)
  } catch (error) {
    return false
  }
}

export function prismaCommand(): Command {
  const db = new Command("db")
    .description("Database management commands (Prisma)")

  // db:init - Interactive database setup
  db.command("init")
    .description("Initialize database configuration interactively")
    .option("--force", "Overwrite existing schema, client, and seed files")
    .action(async (options: { force?: boolean }) => {
      try {
        logger.info("🗄️  Let's set up your database!\n")

        const projectDir = process.cwd()
        const force = !!options.force

        // Check if Prisma is already installed
        const prismaAlreadyInstalled = isPrismaInstalled(projectDir)

        // Step 1: Prompt for database configuration
        const answers = await promptDatabaseInit(prismaAlreadyInstalled)

        if (!answers) {
          logger.error("Database initialization cancelled")
          process.exit(1)
        }

        await warnIfPrisma5(projectDir)

        // Step 2: Create .env file with template
        const spinner1 = logger.spinner("Creating environment configuration...")
        spinner1.start()
        await createEnvFile(projectDir, answers.driver)
        spinner1.succeed("Environment configuration created (.env)")

        // Step 3: Write prisma/schema.prisma (CLI Prisma 6 template — never a user .template)
        const spinner2 = logger.spinner("Setting up Prisma files...")
        spinner2.start()

        const prismaDir = path.join(projectDir, "prisma")
        await fs.ensureDir(prismaDir)

        const leftoverTemplate = path.join(prismaDir, "schema.prisma.template")
        const schemaPath = path.join(prismaDir, "schema.prisma")
        if (!(await fs.pathExists(schemaPath)) && (await fs.pathExists(leftoverTemplate))) {
          const leftoverMsg =
            "prisma/schema.prisma.template is obsolete (ShadPanel 1.3.1 leftover). Writing prisma/schema.prisma from the Prisma 6 CLI template. Edit schema.prisma; do not keep using .template."
          logger.warn(leftoverMsg)
          console.error(leftoverMsg)
        }

        const schemaOutcome = await writePrismaSchema(projectDir, answers.driver, { force })
        logWriteOutcome(schemaOutcome, "prisma/schema.prisma")

        const clientOutcome = await writeFile({
          path: path.join(projectDir, PRISMA_CLIENT_RELATIVE_PATH),
          content: emitPrismaClient(),
          force,
        })
        logWriteOutcome(clientOutcome, PRISMA_CLIENT_RELATIVE_PATH)

        const seedContent = (await getCliSeedTemplate()) || emitSeed()
        const seedOutcome = await writeFile({
          path: path.join(projectDir, SEED_RELATIVE_PATH),
          content: seedContent,
          force,
        })
        logWriteOutcome(seedOutcome, SEED_RELATIVE_PATH)

        await ensurePrismaSeed(projectDir)
        spinner2.succeed("Prisma files created")

        // Step 4: Install Prisma packages (pinned) if requested
        if (answers.installPrisma) {
          const spinner3 = logger.spinner(
            `Installing Prisma 6.18.0 with ${answers.packageManager}...`
          )
          spinner3.start()

          try {
            const pmCommands: Record<string, string> = {
              npm: "npm install @prisma/client@6.18.0 && npm install -D prisma@6.18.0 tsx",
              pnpm: "pnpm add @prisma/client@6.18.0 && pnpm add -D prisma@6.18.0 tsx",
              yarn: "yarn add @prisma/client@6.18.0 && yarn add -D prisma@6.18.0 tsx",
              bun: "bun add @prisma/client@6.18.0 && bun add -D prisma@6.18.0 tsx",
            }

            execSync(pmCommands[answers.packageManager] || pmCommands.npm, {
              stdio: "inherit",
              cwd: projectDir,
            })
            spinner3.succeed("Prisma packages installed")
          } catch (error) {
            spinner3.fail("Failed to install Prisma packages")
            logger.warn(
              `You can install manually with: ${answers.packageManager} add -D prisma@6.18.0 tsx && ${answers.packageManager} add @prisma/client@6.18.0`
            )
          }
        }

        // Step 5: Generate Prisma Client if schema exists (pinned Prisma 6.18, never unpinned npx)
        try {
          if (await fs.pathExists(schemaPath)) {
            const spinnerGen = logger.spinner("Generating Prisma Client...")
            spinnerGen.start()
            runPrisma(["generate"], { cwd: projectDir, stdio: "inherit" })
            spinnerGen.succeed("Prisma Client generated")
          } else {
            logger.warn("schema.prisma not found. Skipping 'prisma generate'.")
            logger.info("Create prisma/schema.prisma or run 'shadpanel db generate' later.")
          }
        } catch (error) {
          logger.warn("Failed to run 'prisma generate' automatically. You can run it manually later.")
        }

        logger.newline()
        logger.success("✅ Database setup complete!")
        logger.newline()
        logger.info("📝 Next steps:")
        logger.info("   1. Edit .env with real credentials")
        logger.info("   2. Edit prisma/schema.prisma (add models)")
        logger.info("   3. shadpanel db migrate make <name>")
        logger.info("   4. shadpanel db migrate run")
        logger.info("   5. shadpanel resource <Model>")
        logger.newline()
        logger.info(`💡 Tip: Your .env has been configured for ${answers.driver.toUpperCase()}`)
      } catch (error) {
        logger.error("Failed to initialize database")
        console.error(error)
        process.exit(1)
      }
    })



  // db:generate - Prisma Client only (does not rewrite schema.prisma)
  db.command("generate")
    .description("Generate Prisma Client from prisma/schema.prisma")
    .action(async () => {
      try {
        const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma")
        if (!(await fs.pathExists(schemaPath))) {
          logger.error("prisma/schema.prisma not found. Run 'shadpanel db init' first.")
          process.exit(1)
        }

        const spinner2 = logger.spinner("Generating Prisma Client...")
        spinner2.start()
        runPrisma(["generate"], { stdio: "inherit" })
        spinner2.succeed("Prisma Client generated")

        logger.newline()
        logger.success("Prisma Client generated!")
      } catch (error) {
        logger.error("Failed to generate Prisma Client")
        console.error(error)
        process.exit(1)
      }
    })

  // db:migrate - Laravel-style workflows (make/run/status)
  const migrate = new Command("migrate").description(
    "Laravel-style Prisma migrations: make, run, status (no shadow DB)"
  )

  // Helper: sanitize migration name to snake_case
  function sanitizeMigrationName(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
  }

  // Helper: timestamp like YYYYMMDDHHMMSS
  function timestamp() {
    const d = new Date()
    const pad = (n: number) => n.toString().padStart(2, "0")
    return (
      d.getFullYear().toString() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      pad(d.getSeconds())
    )
  }

  // db migrate make <name>
  migrate
    .command("make")
    .description("Create a new migration by diffing schema against the DB")
    .argument("<name>", "Descriptive migration name, e.g. add_avatar_to_users")
    .option("--empty", "Create an empty migration file for custom SQL")
    .action(async (name: string, options: { empty?: boolean }) => {
      const projectDir = process.cwd()
      const prismaDir = path.join(projectDir, "prisma")
      const schemaPath = path.join(prismaDir, "schema.prisma")
      const migrationsDir = path.join(prismaDir, "migrations")

      try {
        // Ensure schema exists
        if (!fs.existsSync(schemaPath)) {
          logger.error("prisma/schema.prisma not found. Create it first or run 'shadpanel db init'.")
          process.exit(1)
        }

        const safeName = sanitizeMigrationName(name)
        const folder = `${timestamp()}_${safeName}`
        const destDir = path.join(migrationsDir, folder)
        await fs.ensureDir(destDir)

        const migrationFile = path.join(destDir, "migration.sql")

        if (options.empty) {
          const header = `-- Empty migration\n-- Name: ${safeName}\n-- Created: ${new Date().toISOString()}\n\n`
          await fs.writeFile(migrationFile, header)
        } else {
          // Generate SQL diff between DB (from datasource) and schema (datamodel)
          const spinner = logger.spinner("Generating migration from schema changes...")
          spinner.start()
          try {
            const sql = runPrisma(
              [
                "migrate",
                "diff",
                "--from-schema-datasource",
                "prisma/schema.prisma",
                "--to-schema-datamodel",
                "prisma/schema.prisma",
                "--script",
              ],
              { cwd: projectDir, encoding: "utf-8", stdio: "pipe" }
            )
            const trimmed = (sql || "").trim()

            if (!trimmed || /No\s+changes?/i.test(trimmed)) {
              spinner.stop()
              logger.warn("No schema changes detected. Migration not created.")
              // Clean up created dir if empty
              const files = await fs.readdir(destDir)
              if (files.length === 0) await fs.remove(destDir)
              process.exit(0)
            }

            await fs.writeFile(migrationFile, trimmed + (trimmed.endsWith("\n") ? "" : "\n"))
            spinner.succeed(
              `Migration created: ${folder}\n  Location: prisma/migrations/${folder}/migration.sql`
            )
          } catch (err: any) {
            spinner.fail("Failed to generate migration diff")
            throw err
          }
        }

        logger.newline()
        logger.info("Next steps:")
        logger.info("  1. Review the migration file")
        logger.info("  2. Run: shadpanel db migrate run")
      } catch (error) {
        logger.error("Failed to create migration")
        console.error(error)
        process.exit(1)
      }
    })

  // db migrate run
  migrate
    .command("run")
    .description("Apply all pending migrations and regenerate Prisma Client")
    .action(async () => {
      try {
        const spinner1 = logger.spinner("Applying migrations...")
        spinner1.start()
        runPrisma(["migrate", "deploy"], { stdio: "inherit" })
        spinner1.succeed("Migrations applied successfully")

        const spinner2 = logger.spinner("Generating Prisma Client...")
        spinner2.start()
        runPrisma(["generate"], { stdio: "inherit" })
        spinner2.succeed("Done!")
      } catch (error) {
        logger.error("Failed to apply migrations")
        console.error(error)
        process.exit(1)
      }
    })

  // db migrate status
  migrate
    .command("status")
    .description("Show migration status and pending migrations")
    .action(() => {
      logger.info("Checking migration status...\n")

      // Helper to parse prisma status text output
      function parseStatus(text: string) {
        const fullText = text
        const lines = text.split(/\r?\n/)
        let lastCommon: string | null = null
        let inPending = false
        let inDbOnly = false
        let pending: string[] = []
        let dbOnly: string[] = []
        let totalMigrations = 0

        for (const raw of lines) {
          const line = raw.trim()
          if (!line) continue

          // Extract total migrations count
          const totalMatch = line.match(/^(\d+)\s+migrations?\s+found/i)
          if (totalMatch) {
            totalMigrations = parseInt(totalMatch[1], 10)
          }

          // Check for section headers
          if (line.startsWith("The last common migration is:")) {
            lastCommon = line.replace("The last common migration is:", "").trim()
            inPending = false
            inDbOnly = false
            continue
          }
          if (line.match(/migration.*have not yet been applied/i)) {
            inPending = true
            inDbOnly = false
            continue
          }
          if (line.match(/migrations from the database are not found locally/i)) {
            inDbOnly = true
            inPending = false
            continue
          }

          // Capture migration names (timestamp_name format)
          if (/^\d{14}_/.test(line)) {
            if (inPending) {
              pending.push(line)
            } else if (inDbOnly) {
              dbOnly.push(line)
            }
          }
        }

        return { lastCommon, pending, dbOnly, totalMigrations, text: fullText }
      }

      try {
        // Capture output even if exit code is non-zero
        let output = ""
        try {
          output = runPrisma(["migrate", "status"], { encoding: "utf-8", stdio: "pipe" })
        } catch (err: any) {
          // Prisma exits with code 1 when there are pending/drift migrations
          // Combine both stdout and stderr as Prisma may write to both
          const stdout = err.stdout?.toString() || ""
          const stderr = err.stderr?.toString() || ""
          output = stdout + stderr
        }

        if (!output) {
          logger.warn("No output from Prisma. Ensure Prisma is installed and schema is configured.")
          return
        }

        const { lastCommon, pending, dbOnly, totalMigrations, text } = parseStatus(output)
        const pendingCount = pending.length
        const dbOnlyCount = dbOnly.length

        // Check if database is in sync
        const hasLocalHistory = text.includes("Your local migration history") && text.includes("are different")
        const isUpToDate = (text.includes("up to date") || text.includes("up-to-date")) && !hasLocalHistory
        
        // Clean summary output
        if (isUpToDate) {
          console.log(chalk.green(`✔ Database is up to date! (${totalMigrations} migration${totalMigrations === 1 ? '' : 's'} applied)`))
        } else {
          console.log(chalk.green(`✔ Already on database: ${dbOnlyCount}`))
          console.log(chalk.red(`✖ Pending: ${pendingCount}`))
          
          if (pendingCount > 0) {
            console.log(chalk.blue("\nPending migrations:"))
            pending.forEach((migration) => {
              console.log(`  ${chalk.yellow("→")} ${migration}`)
            })
          }
        }
      } catch (error) {
        // Do not hard fail; provide guidance
        logger.warn("Unable to compute migration summary. See Prisma output above.")
      }
    })

  // Default: running `shadpanel db migrate` will act like `run`
  migrate.action(() => {
    try {
      logger.info("No subcommand provided. Running pending migrations...\n")
      runPrisma(["migrate", "deploy"], { stdio: "inherit" })
      logger.newline()
      logger.success("Migrations applied")
    } catch (error) {
      logger.error("Failed to apply migrations")
      console.error(error)
      process.exit(1)
    }
  })

  db.addCommand(migrate)

  // db:push - Push schema to database (without regenerating)
  db.command("push")
    .description("Push Prisma schema to database (no migration files)")
    .option("--regenerate", "Re-copy schema from the CLI Prisma 6 template (skip-if-exists unless --force)")
    .option("--force", "Overwrite prisma/schema.prisma when used with --regenerate")
    .action(async (options?: { regenerate?: boolean; force?: boolean }) => {
      try {
        if (options?.regenerate) {
          const spinner1 = logger.spinner("Copying Prisma 6 schema from CLI template...")
          spinner1.start()
          const outcome = await writePrismaSchema(process.cwd(), getDriver(), {
            force: !!options.force,
          })
          spinner1.succeed("Schema copy finished")
          logWriteOutcome(outcome, "prisma/schema.prisma")
        }

        // Step 2: Push to database
        const spinner2 = logger.spinner("Pushing schema to database...")
        spinner2.start()
        runPrisma(["db", "push"], { stdio: "inherit" })
        spinner2.succeed("Schema pushed to database")

        logger.newline()
        logger.success("Database push complete!")
      } catch (error: any) {
        logger.newline()
        logger.error("Failed to push schema")
        logger.newline()
        logger.warn("Common issues:")
        logger.info("  • Check your database credentials in .env")
        logger.info("  • Make sure the database exists and is running")
        logger.info("  • Verify your user has the correct permissions")
        logger.newline()

        if (error.message || error.stderr) {
          console.error(error)
        }
        process.exit(1)
      }
    })

  // db:pull - Pull schema from database
  db.command("pull")
    .description("Introspect database and update Prisma schema")
    .option("--force", "Overwrite existing schema")
    .action(async (options: { force?: boolean }) => {
      try {
        const spinner = logger.spinner("Introspecting database...")
        spinner.start()

        const pullArgs = options.force ? ["db", "pull", "--force"] : ["db", "pull"]
        runPrisma(pullArgs, { stdio: "inherit" })

        spinner.succeed("Database introspected successfully!")
        logger.info("Run 'shadpanel db generate' to generate Prisma Client")
      } catch (error) {
        logger.error("Failed to pull schema")
        console.error(error)
        process.exit(1)
      }
    })

  // db:studio - Open Prisma Studio
  db.command("studio")
    .description("Open Prisma Studio to browse and edit data")
    .option("-p, --port <port>", "Port to run Prisma Studio on", "5555")
    .option("-b, --browser <browser>", "Browser to open Prisma Studio in")
    .action((options: { port?: string; browser?: string }) => {
      try {
        logger.info(`Opening Prisma Studio on port ${options.port || 5555}...`)
        logger.info("Press Ctrl+C to stop")
        logger.newline()

        const studioArgs = ["studio", "--port", options.port || "5555"]
        if (options.browser) {
          studioArgs.push("--browser", options.browser)
        }

        runPrisma(studioArgs, { stdio: "inherit" })
      } catch (error) {
        // User pressed Ctrl+C, exit gracefully
        logger.newline()
        logger.info("Prisma Studio stopped")
        process.exit(0)
      }
    })

  // db:seed - Seed the database
  db.command("seed")
    .description("Seed the database with initial data")
    .action(() => {
      try {
        const spinner = logger.spinner("Seeding database...")
        spinner.start()
        runPrisma(["db", "seed"], { stdio: "inherit" })
        spinner.succeed("Database seeded successfully!")
      } catch (error) {
        logger.error("Failed to seed database")
        logger.info("Edit prisma/seed.ts and make sure package.json has a prisma.seed script")
        console.error(error)
        process.exit(1)
      }
    })

  // db:reset - Reset the database
  db.command("reset")
    .description("Reset the database (WARNING: deletes all data)")
    .option("--force", "Skip confirmation prompt")
    .action((options: { force?: boolean }) => {
      try {
        const resetArgs = options.force
          ? ["migrate", "reset", "--force"]
          : ["migrate", "reset"]

        logger.warn("This will delete all data in your database!")
        runPrisma(resetArgs, { stdio: "inherit" })
        logger.success("Database reset complete!")
      } catch (error) {
        logger.error("Failed to reset database")
        console.error(error)
        process.exit(1)
      }
    })

  return db
}
