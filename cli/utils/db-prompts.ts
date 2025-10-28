import prompts from "prompts"
import fs from "fs-extra"
import path from "path"

export type DatabaseDriver = "mysql" | "postgresql" | "sqlite" | "mongodb"
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun"

export interface DatabaseInitAnswers {
  driver: DatabaseDriver
  packageManager: PackageManager
  installPrisma: boolean
}

export async function promptDatabaseInit(prismaAlreadyInstalled: boolean = false): Promise<DatabaseInitAnswers | null> {
  console.log("\n🗄️  Database Configuration\n")

  if (prismaAlreadyInstalled) {
    console.log("✓ Prisma is already installed in this project\n")
  }

  const questions: prompts.PromptObject[] = [
    {
      type: "select",
      name: "driver",
      message: "Which database are you using?",
      choices: [
        { title: "MySQL", value: "mysql", description: "MySQL database" },
        { title: "PostgreSQL", value: "postgresql", description: "PostgreSQL database" },
        { title: "SQLite", value: "sqlite", description: "SQLite (local file database)" },
        { title: "MongoDB", value: "mongodb", description: "MongoDB database" },
      ],
      initial: 0,
    },
    {
      type: prismaAlreadyInstalled ? null : "select",
      name: "packageManager",
      message: "Which package manager do you want to use?",
      choices: [
        { title: "npm", value: "npm" },
        { title: "pnpm", value: "pnpm" },
        { title: "yarn", value: "yarn" },
        { title: "bun", value: "bun" },
      ],
      initial: 0,
    },
    {
      type: prismaAlreadyInstalled ? null : "confirm",
      name: "installPrisma",
      message: "Install Prisma packages now?",
      initial: true,
    },
  ]

  try {
    const answers = await prompts(questions, {
      onCancel: () => {
        throw new Error("User cancelled the operation")
      },
    })

    // If Prisma is already installed, set default values for skipped questions
    if (prismaAlreadyInstalled) {
      answers.installPrisma = false
      answers.packageManager = "npm" // Default, won't be used anyway
    }

    return answers as DatabaseInitAnswers
  } catch (error) {
    return null
  }
}

export async function createEnvFile(
  projectDir: string,
  driver: DatabaseDriver
): Promise<void> {
  const envPath = path.join(projectDir, ".env")
  const envExamplePath = path.join(projectDir, ".env.example")

  // Create template based on driver
  const templates = {
    mysql: `# MySQL Database Configuration
DATABASE_DRIVER=mysql
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# OR use individual credentials (will auto-construct DATABASE_URL):
# DATABASE_HOST=localhost
# DATABASE_PORT=3306
# DATABASE_NAME=mydb
# DATABASE_USERNAME=root
# DATABASE_PASSWORD=password
`,
    postgresql: `# PostgreSQL Database Configuration
DATABASE_DRIVER=postgresql
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"

# OR use individual credentials (will auto-construct DATABASE_URL):
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_NAME=mydb
# DATABASE_USERNAME=postgres
# DATABASE_PASSWORD=password
# DATABASE_SCHEMA=public
`,
    sqlite: `# SQLite Database Configuration
DATABASE_DRIVER=sqlite
DATABASE_URL="file:./dev.db"
`,
    mongodb: `# MongoDB Database Configuration
DATABASE_DRIVER=mongodb
DATABASE_URL="mongodb://username:password@localhost:27017/database_name?authSource=admin"

# OR use individual credentials (will auto-construct DATABASE_URL):
# DATABASE_HOST=localhost
# DATABASE_PORT=27017
# DATABASE_NAME=mydb
# DATABASE_USERNAME=admin
# DATABASE_PASSWORD=password
`,
  }

  const envContent = templates[driver]

  // Check if .env already exists
  if (await fs.pathExists(envPath)) {
    // Append to existing .env if DATABASE_DRIVER not already present
    const existing = await fs.readFile(envPath, "utf-8")
    if (!existing.includes("DATABASE_DRIVER")) {
      await fs.appendFile(envPath, "\n" + envContent)
    }
  } else {
    // Create new .env
    await fs.writeFile(envPath, envContent)
  }

  // Create .env.example with template for all drivers
  const exampleContent = `# Database Configuration
# Choose your database driver and configure accordingly

# ===== MySQL =====
# DATABASE_DRIVER=mysql
# DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# ===== PostgreSQL =====
# DATABASE_DRIVER=postgresql
# DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"

# ===== SQLite =====
# DATABASE_DRIVER=sqlite
# DATABASE_URL="file:./dev.db"

# ===== MongoDB =====
# DATABASE_DRIVER=mongodb
# DATABASE_URL="mongodb://username:password@localhost:27017/database_name?authSource=admin"

# ===== Alternative: Individual Credentials =====
# The system will auto-construct DATABASE_URL from these:
# DATABASE_HOST=localhost
# DATABASE_PORT=3306
# DATABASE_NAME=mydb
# DATABASE_USERNAME=root
# DATABASE_PASSWORD=password
# DATABASE_SCHEMA=public
`

  if (await fs.pathExists(envExamplePath)) {
    const existing = await fs.readFile(envExamplePath, "utf-8")
    if (!existing.includes("DATABASE_DRIVER")) {
      await fs.appendFile(envExamplePath, "\n" + exampleContent)
    }
  } else {
    await fs.writeFile(envExamplePath, exampleContent)
  }
}
