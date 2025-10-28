#!/usr/bin/env node

// cli/index.ts
import { Command as Command2 } from "commander";

// cli/commands/init.ts
import { execSync } from "child_process";
import prompts from "prompts";

// cli/utils/logger.ts
import chalk from "chalk";
import ora from "ora";
var logger = {
  // Info messages
  info: (message) => {
    console.log(chalk.blue("\u2139"), message);
  },
  // Success messages
  success: (message) => {
    console.log(chalk.green("\u2714"), message);
  },
  // Warning messages
  warn: (message) => {
    console.log(chalk.yellow("\u26A0"), message);
  },
  // Error messages
  error: (message) => {
    console.log(chalk.red("\u2716"), message);
  },
  // Create a spinner
  spinner: (text) => {
    return ora({
      text,
      spinner: "dots"
    });
  },
  // Print welcome banner
  welcome: () => {
    console.log();
    console.log(
      chalk.bold.cyan("\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510")
    );
    console.log(
      chalk.bold.cyan("\u2502                                                 \u2502")
    );
    console.log(
      chalk.bold.cyan("\u2502   Welcome to ShadPanel CLI                      \u2502")
    );
    console.log(
      chalk.bold.cyan("\u2502   Admin Panels Built on shadcn/ui               \u2502")
    );
    console.log(
      chalk.bold.cyan("\u2502                                                 \u2502")
    );
    console.log(
      chalk.bold.cyan("\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518")
    );
    console.log();
  },
  // Print completion message
  complete: (projectName, devCommand, installationType, isCurrentDir) => {
    console.log();
    if (installationType === "full-panel") {
      console.log(chalk.green.bold("\u2728 Done! Your ShadPanel admin panel is ready."));
    } else if (installationType === "auth-components") {
      console.log(chalk.green.bold("\u2728 Done! Authentication and components are installed."));
    } else if (installationType === "components-only") {
      console.log(chalk.green.bold("\u2728 Done! ShadPanel components are installed."));
    } else {
      console.log(chalk.green.bold("\u2728 Done! Your ShadPanel project is ready."));
    }
    console.log();
    console.log(chalk.bold("\u{1F680} Get started:"));
    if (!isCurrentDir) {
      console.log(chalk.cyan(`  cd ${projectName}`));
    }
    console.log(chalk.cyan(`  ${devCommand}`));
    if (installationType === "full-panel") {
      console.log();
      console.log(chalk.yellow("\u26A0\uFE0F  Don't forget:"));
      console.log(chalk.cyan(`  \u2022 Open .env and configure your authentication providers`));
    }
    console.log();
    console.log(chalk.bold("\u{1F4DA} Documentation:"), chalk.cyan("https://github.com/kristiansnts/shadpanel"));
    console.log();
  },
  // Print a blank line
  newline: () => {
    console.log();
  }
};

// cli/commands/init.ts
async function initCommand(projectName) {
  try {
    logger.welcome();
    let finalProjectName = projectName;
    if (!finalProjectName) {
      const response = await prompts({
        type: "text",
        name: "projectName",
        message: "What is your project name?",
        initial: "my-shadpanel-app",
        validate: (value) => value.length > 0 ? true : "Project name is required"
      });
      if (!response.projectName) {
        logger.error("Project name is required");
        process.exit(1);
      }
      finalProjectName = response.projectName;
    }
    logger.info(`Creating your ShadPanel project: ${finalProjectName}`);
    logger.newline();
    const spinner = logger.spinner("Running create-shadpanel-next...");
    spinner.start();
    try {
      execSync(`npx create-shadpanel-next ${finalProjectName}`, {
        stdio: "inherit",
        cwd: process.cwd()
      });
      spinner.succeed("Project created successfully!");
    } catch (error) {
      spinner.fail("Failed to create project");
      throw error;
    }
    logger.newline();
    logger.success("\u2728 Done! Your ShadPanel project is ready.");
    logger.newline();
    logger.info("\u{1F4DA} Next steps:");
    logger.info(`   1. cd ${finalProjectName}`);
    logger.info("   2. Run 'shadpanel db:init' to set up your database (optional)");
    logger.info("   3. npm run dev");
    logger.newline();
  } catch (error) {
    logger.error("Failed to initialize project");
    console.error(error);
    process.exit(1);
  }
}

// cli/commands/prisma.ts
import { Command } from "commander";
import { execSync as execSync2 } from "child_process";
import path3 from "path";
import fs3 from "fs-extra";

// cli/utils/db.ts
import fs from "fs-extra";
import path from "path";
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      envContent.split("\n").forEach((line) => {
        const match = line.match(/^([^=:#]+)=(.*)/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (error) {
  }
}
loadEnv();
function getDriver() {
  const driver = process.env.DATABASE_DRIVER;
  return driver || "mysql";
}
function getUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const credentials = {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    schema: process.env.DATABASE_SCHEMA
  };
  const constructedUrl = constructDatabaseUrl(getDriver(), credentials);
  if (constructedUrl) {
    return constructedUrl;
  }
  console.warn("No DATABASE_URL or credentials found. Using SQLite fallback.");
  return "file:./dev.db";
}
function constructDatabaseUrl(driver, credentials) {
  const { host, database } = credentials;
  if (!host || !database) {
    return null;
  }
  switch (driver) {
    case "mysql":
      return buildMySQLUrl(credentials);
    case "postgresql":
      return buildPostgreSQLUrl(credentials);
    case "mongodb":
      return buildMongoDBUrl(credentials);
    case "sqlite":
      return `file:${database}`;
    default:
      console.warn(`Unsupported driver: ${driver}`);
      return null;
  }
}
function buildMySQLUrl(credentials) {
  const { host, port = "3306", database, username, password, schema } = credentials;
  const auth = username && password ? `${username}:${password}@` : "";
  const schemaParam = schema ? `?schema=${schema}` : "";
  return `mysql://${auth}${host}:${port}/${database}${schemaParam}`;
}
function buildPostgreSQLUrl(credentials) {
  const { host, port = "5432", database, username, password, schema } = credentials;
  const auth = username && password ? `${username}:${password}@` : "";
  const schemaParam = schema ? `?schema=${schema}` : "";
  return `postgresql://${auth}${host}:${port}/${database}${schemaParam}`;
}
function buildMongoDBUrl(credentials) {
  const { host, port = "27017", database, username, password } = credentials;
  const auth = username && password ? `${username}:${password}@` : "";
  const authSource = username ? "?authSource=admin" : "";
  return `mongodb://${auth}${host}:${port}/${database}${authSource}`;
}
async function generatePrismaSchema(projectDir) {
  const baseDir = projectDir || process.cwd();
  const templatePath = path.join(baseDir, "prisma", "schema.prisma.template");
  const outputPath = path.join(baseDir, "prisma", "schema.prisma");
  const driver = getDriver();
  const url = getUrl();
  console.log(`\u{1F4CA} Database Driver: ${driver}`);
  console.log(`\u{1F517} Database URL: ${url.substring(0, 20)}...`);
  if (!await fs.pathExists(templatePath)) {
    console.warn(`\u26A0\uFE0F  Template file not found: ${templatePath}`);
    console.log("Creating default template...");
    const defaultTemplate = `datasource db {
  provider = "{{DATABASE_DRIVER}}"
  url      = "{{DATABASE_URL}}"
}

generator client {
  provider = "prisma-client-js"
}

// Add your models here
`;
    await fs.ensureDir(path.dirname(templatePath));
    await fs.writeFile(templatePath, defaultTemplate);
  }
  let schemaContent = await fs.readFile(templatePath, "utf-8");
  schemaContent = schemaContent.replace(/\{\{DATABASE_DRIVER\}\}/g, driver).replace(/\{\{DATABASE_URL\}\}/g, url);
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, schemaContent);
  console.log(`\u2705 Generated: ${outputPath}`);
}

// cli/utils/db-prompts.ts
import prompts2 from "prompts";
import fs2 from "fs-extra";
import path2 from "path";
async function promptDatabaseInit(prismaAlreadyInstalled = false) {
  console.log("\n\u{1F5C4}\uFE0F  Database Configuration\n");
  if (prismaAlreadyInstalled) {
    console.log("\u2713 Prisma is already installed in this project\n");
  }
  const questions = [
    {
      type: "select",
      name: "driver",
      message: "Which database are you using?",
      choices: [
        { title: "MySQL", value: "mysql", description: "MySQL database" },
        { title: "PostgreSQL", value: "postgresql", description: "PostgreSQL database" },
        { title: "SQLite", value: "sqlite", description: "SQLite (local file database)" },
        { title: "MongoDB", value: "mongodb", description: "MongoDB database" }
      ],
      initial: 0
    },
    {
      type: prismaAlreadyInstalled ? null : "select",
      name: "packageManager",
      message: "Which package manager do you want to use?",
      choices: [
        { title: "npm", value: "npm" },
        { title: "pnpm", value: "pnpm" },
        { title: "yarn", value: "yarn" },
        { title: "bun", value: "bun" }
      ],
      initial: 0
    },
    {
      type: prismaAlreadyInstalled ? null : "confirm",
      name: "installPrisma",
      message: "Install Prisma packages now?",
      initial: true
    }
  ];
  try {
    const answers = await prompts2(questions, {
      onCancel: () => {
        throw new Error("User cancelled the operation");
      }
    });
    if (prismaAlreadyInstalled) {
      answers.installPrisma = false;
      answers.packageManager = "npm";
    }
    return answers;
  } catch (error) {
    return null;
  }
}
async function createEnvFile(projectDir, driver) {
  const envPath = path2.join(projectDir, ".env");
  const envExamplePath = path2.join(projectDir, ".env.example");
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
`
  };
  const envContent = templates[driver];
  if (await fs2.pathExists(envPath)) {
    const existing = await fs2.readFile(envPath, "utf-8");
    if (!existing.includes("DATABASE_DRIVER")) {
      await fs2.appendFile(envPath, "\n" + envContent);
    }
  } else {
    await fs2.writeFile(envPath, envContent);
  }
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
`;
  if (await fs2.pathExists(envExamplePath)) {
    const existing = await fs2.readFile(envExamplePath, "utf-8");
    if (!existing.includes("DATABASE_DRIVER")) {
      await fs2.appendFile(envExamplePath, "\n" + exampleContent);
    }
  } else {
    await fs2.writeFile(envExamplePath, exampleContent);
  }
}

// cli/commands/prisma.ts
function isPrismaInstalled(projectDir) {
  try {
    const packageJsonPath = path3.join(projectDir, "package.json");
    if (!fs3.existsSync(packageJsonPath)) {
      return false;
    }
    const packageJson = JSON.parse(fs3.readFileSync(packageJsonPath, "utf-8"));
    const hasPrismaClient = packageJson.dependencies?.["@prisma/client"];
    const hasPrismaCli = packageJson.devDependencies?.["prisma"];
    return !!(hasPrismaClient || hasPrismaCli);
  } catch (error) {
    return false;
  }
}
function prismaCommand() {
  const db = new Command("db").description("Database management commands (Prisma)");
  db.command("init").description("Initialize database configuration interactively").action(async () => {
    try {
      logger.info("\u{1F5C4}\uFE0F  Let's set up your database!\n");
      const projectDir = process.cwd();
      const prismaAlreadyInstalled = isPrismaInstalled(projectDir);
      const answers = await promptDatabaseInit(prismaAlreadyInstalled);
      if (!answers) {
        logger.error("Database initialization cancelled");
        process.exit(1);
      }
      const spinner1 = logger.spinner("Creating environment configuration...");
      spinner1.start();
      await createEnvFile(projectDir, answers.driver);
      spinner1.succeed("Environment configuration created (.env)");
      const spinner2 = logger.spinner("Setting up Prisma files...");
      spinner2.start();
      const prismaDir = path3.join(projectDir, "prisma");
      await fs3.ensureDir(prismaDir);
      const templatePath = path3.join(prismaDir, "schema.prisma.template");
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
`;
      await fs3.writeFile(templatePath, defaultTemplate);
      spinner2.succeed("Prisma files created");
      if (answers.installPrisma) {
        const spinner3 = logger.spinner(
          `Installing Prisma with ${answers.packageManager}...`
        );
        spinner3.start();
        try {
          const pmCommands = {
            npm: "npm install @prisma/client && npm install -D prisma",
            pnpm: "pnpm add @prisma/client && pnpm add -D prisma",
            yarn: "yarn add @prisma/client && yarn add -D prisma",
            bun: "bun add @prisma/client && bun add -D prisma"
          };
          execSync2(pmCommands[answers.packageManager], {
            stdio: "inherit",
            cwd: projectDir
          });
          spinner3.succeed("Prisma packages installed");
        } catch (error) {
          spinner3.fail("Failed to install Prisma packages");
          logger.warn(
            `You can install manually with: ${answers.packageManager} install @prisma/client prisma`
          );
        }
      }
      logger.newline();
      logger.success("\u2705 Database setup complete!");
      logger.newline();
      logger.info("\u{1F4DD} Next steps:");
      logger.info("   1. Edit your .env file with actual database credentials");
      logger.info("   2. Edit prisma/schema.prisma.template to add your models");
      logger.info("   3. Run 'shadpanel db generate-schema' to generate schema.prisma");
      logger.info("   4. Edit prisma/schema.prisma to add/modify models");
      logger.info("   5. Run 'shadpanel db migrate' to create migrations");
      logger.info("   6. Run 'shadpanel db generate' to generate Prisma Client");
      logger.info("   7. Run 'shadpanel db studio' to browse your database");
      logger.newline();
      logger.warn("\u26A0\uFE0F  Important:");
      logger.info("   \u2022 Edit schema.prisma for one-time changes");
      logger.info("   \u2022 Edit schema.prisma.template for reusable templates");
      logger.info("   \u2022 Use --regenerate flag to regenerate from template");
      logger.newline();
      logger.info(`\u{1F4A1} Tip: Your .env has been configured for ${answers.driver.toUpperCase()}`);
    } catch (error) {
      logger.error("Failed to initialize database");
      console.error(error);
      process.exit(1);
    }
  });
  db.command("generate-schema").description("Generate prisma/schema.prisma from template using config").action(async () => {
    try {
      const spinner = logger.spinner("Generating Prisma schema from template...");
      spinner.start();
      await generatePrismaSchema();
      spinner.succeed("Prisma schema generated successfully!");
    } catch (error) {
      logger.error("Failed to generate schema");
      console.error(error);
      process.exit(1);
    }
  });
  db.command("generate").description("Generate Prisma schema and Prisma Client").action(async () => {
    try {
      const spinner1 = logger.spinner("Generating Prisma schema from template...");
      spinner1.start();
      await generatePrismaSchema();
      spinner1.succeed("Prisma schema generated");
      const spinner2 = logger.spinner("Generating Prisma Client...");
      spinner2.start();
      execSync2("npx prisma generate", { stdio: "inherit" });
      spinner2.succeed("Prisma Client generated");
      logger.newline();
      logger.success("Database setup complete!");
    } catch (error) {
      logger.error("Failed to generate Prisma Client");
      console.error(error);
      process.exit(1);
    }
  });
  db.command("migrate").description("Run database migrations").argument("[name]", "Migration name").option("--regenerate", "Regenerate schema from template before migrating").action(async (name, options) => {
    try {
      if (options?.regenerate) {
        const spinner1 = logger.spinner("Generating Prisma schema from template...");
        spinner1.start();
        await generatePrismaSchema();
        spinner1.succeed("Prisma schema generated from template");
      }
      const spinner2 = logger.spinner("Running database migrations...");
      spinner2.start();
      const migrateCmd = name ? `npx prisma migrate dev --name ${name}` : "npx prisma migrate dev";
      execSync2(migrateCmd, { stdio: "inherit" });
      spinner2.succeed("Migrations applied");
      logger.newline();
      logger.success("Database migration complete!");
    } catch (error) {
      logger.newline();
      logger.error("Failed to run migrations");
      logger.newline();
      logger.warn("Common issues:");
      logger.info("  \u2022 Check your database credentials in .env");
      logger.info("  \u2022 Make sure the database exists and is running");
      logger.info("  \u2022 Verify your user has the correct permissions");
      logger.info("  \u2022 For MySQL: GRANT ALL PRIVILEGES ON database_name.* TO 'user'@'localhost';");
      logger.newline();
      if (error.message || error.stderr) {
        console.error(error);
      }
      process.exit(1);
    }
  });
  db.command("push").description("Push Prisma schema to database (no migration files)").option("--regenerate", "Regenerate schema from template before pushing").action(async (options) => {
    try {
      if (options?.regenerate) {
        const spinner1 = logger.spinner("Generating Prisma schema from template...");
        spinner1.start();
        await generatePrismaSchema();
        spinner1.succeed("Prisma schema generated from template");
      }
      const spinner2 = logger.spinner("Pushing schema to database...");
      spinner2.start();
      execSync2("npx prisma db push", { stdio: "inherit" });
      spinner2.succeed("Schema pushed to database");
      logger.newline();
      logger.success("Database push complete!");
    } catch (error) {
      logger.newline();
      logger.error("Failed to push schema");
      logger.newline();
      logger.warn("Common issues:");
      logger.info("  \u2022 Check your database credentials in .env");
      logger.info("  \u2022 Make sure the database exists and is running");
      logger.info("  \u2022 Verify your user has the correct permissions");
      logger.newline();
      if (error.message || error.stderr) {
        console.error(error);
      }
      process.exit(1);
    }
  });
  db.command("pull").description("Introspect database and update Prisma schema").option("--force", "Overwrite existing schema").action(async (options) => {
    try {
      const spinner = logger.spinner("Introspecting database...");
      spinner.start();
      const pullCmd = options.force ? "npx prisma db pull --force" : "npx prisma db pull";
      execSync2(pullCmd, { stdio: "inherit" });
      spinner.succeed("Database introspected successfully!");
      logger.info("Run 'shadpanel db:generate' to generate Prisma Client");
    } catch (error) {
      logger.error("Failed to pull schema");
      console.error(error);
      process.exit(1);
    }
  });
  db.command("studio").description("Open Prisma Studio to browse and edit data").option("-p, --port <port>", "Port to run Prisma Studio on", "5555").option("-b, --browser <browser>", "Browser to open Prisma Studio in").action((options) => {
    try {
      logger.info(`Opening Prisma Studio on port ${options.port || 5555}...`);
      logger.info("Press Ctrl+C to stop");
      logger.newline();
      let studioCmd = `npx prisma studio --port ${options.port || 5555}`;
      if (options.browser) {
        studioCmd += ` --browser ${options.browser}`;
      }
      execSync2(studioCmd, { stdio: "inherit" });
    } catch (error) {
      logger.newline();
      logger.info("Prisma Studio stopped");
      process.exit(0);
    }
  });
  db.command("seed").description("Seed the database with initial data").action(() => {
    try {
      const spinner = logger.spinner("Seeding database...");
      spinner.start();
      execSync2("npx prisma db seed", { stdio: "inherit" });
      spinner.succeed("Database seeded successfully!");
    } catch (error) {
      logger.error("Failed to seed database");
      logger.info("Make sure you have a 'prisma.seed' script in package.json");
      console.error(error);
      process.exit(1);
    }
  });
  db.command("reset").description("Reset the database (WARNING: deletes all data)").option("--force", "Skip confirmation prompt").action((options) => {
    try {
      const resetCmd = options.force ? "npx prisma migrate reset --force" : "npx prisma migrate reset";
      logger.warn("This will delete all data in your database!");
      execSync2(resetCmd, { stdio: "inherit" });
      logger.success("Database reset complete!");
    } catch (error) {
      logger.error("Failed to reset database");
      console.error(error);
      process.exit(1);
    }
  });
  return db;
}

// package.json
var package_default = {
  name: "shadpanel",
  version: "0.1.0",
  description: "ShadPanel CLI - Build admin panels with Next.js and shadcn/ui",
  main: "index.cjs",
  type: "module",
  bin: {
    shadpanel: "./dist/cli.mjs",
    "create-shadpanel-next": "./cli.cjs"
  },
  scripts: {
    test: 'echo "Error: no test specified" && exit 1',
    "build:cli": "tsup cli/index.ts --format esm --dts --clean && mv dist/index.js dist/cli.mjs",
    "dev:cli": "tsx cli/index.ts",
    prepublishOnly: "npm run build:cli"
  },
  files: [
    "dist",
    "cli.cjs",
    "index.cjs",
    "README.md"
  ],
  keywords: [
    "panel",
    "ui",
    "component",
    "shadcn",
    "react",
    "nextjs",
    "cli",
    "scaffold"
  ],
  author: "",
  license: "MIT",
  repository: {
    type: "git",
    url: ""
  },
  homepage: "",
  dependencies: {
    chalk: "^5.6.2",
    commander: "^14.0.2",
    "fs-extra": "^11.3.2",
    ora: "^9.0.0",
    prompts: "^2.4.2"
  },
  devDependencies: {
    "@types/fs-extra": "^11.0.4",
    "@types/prompts": "^2.4.9",
    tsup: "^8.5.0",
    tsx: "^4.20.6",
    typescript: "^5.9.3"
  }
};

// cli/index.ts
var program = new Command2();
program.name("shadpanel").description("ShadPanel CLI - Build admin panels with Next.js and shadcn/ui").version(package_default.version);
program.command("init").description("Initialize a new ShadPanel project").argument("[project-name]", "Project directory name").action(initCommand);
program.addCommand(prismaCommand());
program.parse();
//# sourceMappingURL=index.js.map