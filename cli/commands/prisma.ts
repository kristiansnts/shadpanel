import { Command } from "commander"
import { execSync } from "child_process"
import path from "path"
import fs from "fs-extra"
import { logger } from "../utils/logger"
import { generatePrismaSchema } from "../utils/db"
import { promptDatabaseInit, createEnvFile } from "../utils/db-prompts"

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
    .action(async () => {
      try {
        logger.info("🗄️  Let's set up your database!\n")

        const projectDir = process.cwd()

        // Check if Prisma is already installed
        const prismaAlreadyInstalled = isPrismaInstalled(projectDir)

        // Step 1: Prompt for database configuration
        const answers = await promptDatabaseInit(prismaAlreadyInstalled)

        if (!answers) {
          logger.error("Database initialization cancelled")
          process.exit(1)
        }

        // Step 2: Create .env file with template
        const spinner1 = logger.spinner("Creating environment configuration...")
        spinner1.start()
        await createEnvFile(projectDir, answers.driver)
        spinner1.succeed("Environment configuration created (.env)")

        // Step 3: Create prisma directory and template
        const spinner2 = logger.spinner("Setting up Prisma files...")
        spinner2.start()

        const prismaDir = path.join(projectDir, "prisma")
        await fs.ensureDir(prismaDir)

        const templatePath = path.join(prismaDir, "schema.prisma.template")
        const defaultTemplate = `datasource db {
  provider = "{{DATABASE_DRIVER}}"
  url      = "{{DATABASE_URL}}"
}

generator client {
  provider = "prisma-client-js"
}

// Add your models here
// Example:
// model User {
//   id        Int      @id @default(autoincrement())
//   email     String   @unique
//   name      String?
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }
`
        await fs.writeFile(templatePath, defaultTemplate)
        spinner2.succeed("Prisma files created")

        // Step 4: Install Prisma packages (pinned) if requested
        if (answers.installPrisma) {
          const spinner3 = logger.spinner(
            `Installing Prisma 6.18.0 with ${answers.packageManager}...`
          )
          spinner3.start()

          try {
            const pmCommands: Record<string, string> = {
              npm: "npm install @prisma/client@6.18.0 && npm install -D prisma@6.18.0",
              pnpm: "pnpm add @prisma/client@6.18.0 && pnpm add -D prisma@6.18.0",
              yarn: "yarn add @prisma/client@6.18.0 && yarn add -D prisma@6.18.0",
              bun: "bun add @prisma/client@6.18.0 && bun add -D prisma@6.18.0",
            }

            execSync(pmCommands[answers.packageManager] || pmCommands.npm, {
              stdio: "inherit",
              cwd: projectDir,
            })
            spinner3.succeed("Prisma packages installed")
          } catch (error) {
            spinner3.fail("Failed to install Prisma packages")
            logger.warn(
              `You can install manually with: ${answers.packageManager} add -D prisma@6.18.0 && ${answers.packageManager} add @prisma/client@6.18.0`
            )
          }
        }

        // Step 5: Generate Prisma Client if schema exists
        try {
          const schemaPath = path.join(projectDir, "prisma", "schema.prisma")
          const generateCmd: Record<string, string> = {
            npm: "npx prisma generate",
            pnpm: "pnpm prisma generate",
            yarn: "yarn prisma generate",
            bun: "bunx prisma generate",
          }
          if (await fs.pathExists(schemaPath)) {
            const spinnerGen = logger.spinner("Generating Prisma Client...")
            spinnerGen.start()
            execSync(generateCmd[answers.packageManager] || generateCmd.npm, {
              stdio: "inherit",
              cwd: projectDir,
            })
            spinnerGen.succeed("Prisma Client generated")
          } else {
            logger.warn("schema.prisma not found. Skipping 'prisma generate'.")
            logger.info("Create prisma/schema.prisma or run 'shadpanel db generate' later.")
          }
        } catch (error) {
          logger.warn("Failed to run 'prisma generate' automatically. You can run it manually later.")
        }

        // Success message
  logger.newline()
  logger.success("✅ Database setup complete!")
        logger.newline()
        logger.info("📝 Next steps:")
        logger.info("   1. Edit your .env file with actual database credentials")
        logger.info("   2. Edit prisma/schema.prisma.template to add your models")
        logger.info("   3. Update schema.prisma with your models")
        logger.info("   4. Edit prisma/schema.prisma to add/modify models")
        logger.info("   5. Run 'shadpanel db migrate' to create migrations")
        logger.info("   6. Run 'shadpanel db generate' to generate Prisma Client")
        logger.info("   7. Run 'shadpanel db studio' to browse your database")
        logger.newline()
        logger.warn("⚠️  Important:")
        logger.info("   • Edit schema.prisma for one-time changes")
        logger.info("   • Edit schema.prisma.template for reusable templates")
        logger.info("   • Use --regenerate flag to regenerate from template")
        logger.newline()
        logger.info(`💡 Tip: Your .env has been configured for ${answers.driver.toUpperCase()}`)
      } catch (error) {
        logger.error("Failed to initialize database")
        console.error(error)
        process.exit(1)
      }
    })



  // db:generate - Generate schema + Prisma Client
  db.command("generate")
    .description("Generate Prisma schema and Prisma Client")
    .action(async () => {
      try {
        // Step 1: Generate schema
        const spinner1 = logger.spinner("Generating Prisma schema from template...")
        spinner1.start()
        await generatePrismaSchema()
        spinner1.succeed("Prisma schema generated")

        // Step 2: Generate Prisma Client
        const spinner2 = logger.spinner("Generating Prisma Client...")
        spinner2.start()
        execSync("npx prisma generate", { stdio: "inherit" })
        spinner2.succeed("Prisma Client generated")

        logger.newline()
        logger.success("Database setup complete!")
      } catch (error) {
        logger.error("Failed to generate Prisma Client")
        console.error(error)
        process.exit(1)
      }
    })

  // db:migrate - Run migrations (without regenerating schema)
  db.command("migrate")
    .description("Run database migrations")
    .argument("[name]", "Migration name")
    .option("-n, --name <name>", "Name the migration (e.g. added_job_title)")
    .option("--regenerate", "Regenerate schema from template before migrating")
    .action(async (nameArg?: string, options?: { regenerate?: boolean; name?: string }) => {
      try {
        // Priority: --name flag > positional argument
        const migrationName = options?.name || nameArg

        // Step 1: Optionally regenerate schema from template
        if (options?.regenerate) {
          const spinner1 = logger.spinner("Generating Prisma schema from template...")
          spinner1.start()
          await generatePrismaSchema()
          spinner1.succeed("Prisma schema generated from template")
        }

        // Step 2: Run migrations
        const spinner2 = logger.spinner("Running database migrations...")
        spinner2.start()
        const migrateCmd = migrationName
          ? `npx prisma migrate dev --name ${migrationName}`
          : "npx prisma migrate dev"
        execSync(migrateCmd, { stdio: "inherit" })
        spinner2.succeed("Migrations applied")

        logger.newline()
        logger.success("Database migration complete!")
      } catch (error: any) {
        logger.newline()
        logger.error("Failed to run migrations")
        logger.newline()
        logger.warn("Common issues:")
        logger.info("  • Check your database credentials in .env")
        logger.info("  • Make sure the database exists and is running")
        logger.info("  • Verify your user has the correct permissions")
        logger.info("  • For MySQL: GRANT ALL PRIVILEGES ON database_name.* TO 'user'@'localhost';")
        logger.newline()

        if (error.message || error.stderr) {
          console.error(error)
        }
        process.exit(1)
      }
    })

  // db:push - Push schema to database (without regenerating)
  db.command("push")
    .description("Push Prisma schema to database (no migration files)")
    .option("--regenerate", "Regenerate schema from template before pushing")
    .action(async (options?: { regenerate?: boolean }) => {
      try {
        // Step 1: Optionally regenerate schema from template
        if (options?.regenerate) {
          const spinner1 = logger.spinner("Generating Prisma schema from template...")
          spinner1.start()
          await generatePrismaSchema()
          spinner1.succeed("Prisma schema generated from template")
        }

        // Step 2: Push to database
        const spinner2 = logger.spinner("Pushing schema to database...")
        spinner2.start()
        execSync("npx prisma db push", { stdio: "inherit" })
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

        const pullCmd = options.force
          ? "npx prisma db pull --force"
          : "npx prisma db pull"
        execSync(pullCmd, { stdio: "inherit" })

        spinner.succeed("Database introspected successfully!")
        logger.info("Run 'shadpanel db:generate' to generate Prisma Client")
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

        let studioCmd = `npx prisma studio --port ${options.port || 5555}`
        if (options.browser) {
          studioCmd += ` --browser ${options.browser}`
        }

        execSync(studioCmd, { stdio: "inherit" })
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
        execSync("npx prisma db seed", { stdio: "inherit" })
        spinner.succeed("Database seeded successfully!")
      } catch (error) {
        logger.error("Failed to seed database")
        logger.info("Make sure you have a 'prisma.seed' script in package.json")
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
        const resetCmd = options.force
          ? "npx prisma migrate reset --force"
          : "npx prisma migrate reset"

        logger.warn("This will delete all data in your database!")
        execSync(resetCmd, { stdio: "inherit" })
        logger.success("Database reset complete!")
      } catch (error) {
        logger.error("Failed to reset database")
        console.error(error)
        process.exit(1)
      }
    })

  return db
}
