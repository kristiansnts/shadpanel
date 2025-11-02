#!/usr/bin/env node

// cli/index.ts
import { Command } from "commander";

// cli/commands/init.ts
import path4 from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import fs5 from "fs-extra";

// cli/utils/prompts.ts
import prompts from "prompts";
import path from "path";
import fs from "fs-extra";
function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent || "";
  if (userAgent.includes("pnpm")) return "pnpm";
  if (userAgent.includes("yarn")) return "yarn";
  if (userAgent.includes("bun")) return "bun";
  return "npm";
}
async function promptInitQuestions(initialProjectName, cliOptions = {}) {
  const defaultProjectName = initialProjectName || "my-admin-panel";
  let packageManager = detectPackageManager();
  if (cliOptions.useNpm) packageManager = "npm";
  if (cliOptions.usePnpm) packageManager = "pnpm";
  if (cliOptions.useYarn) packageManager = "yarn";
  if (cliOptions.useBun) packageManager = "bun";
  let installationType = "full-panel";
  if (cliOptions.componentsOnly) installationType = "components-only";
  if (cliOptions.authComponents) installationType = "auth-components";
  if (cliOptions.fullPanel) installationType = "full-panel";
  const authProviders = [];
  if (cliOptions.credentials !== false) authProviders.push("credentials");
  if (cliOptions.google) authProviders.push("google");
  if (cliOptions.github) authProviders.push("github");
  if (cliOptions.yes) {
    return {
      projectName: defaultProjectName,
      installationType,
      packageManager,
      authentication: cliOptions.noAuth ? false : installationType !== "components-only",
      authProviders: authProviders.length > 0 ? authProviders : ["credentials"],
      demos: cliOptions.noDemos ? false : installationType === "full-panel",
      demoTypes: cliOptions.noDemos ? [] : ["form", "table", "notification"],
      initGit: cliOptions.disableGit ? false : true,
      skipInstall: cliOptions.skipInstall || false
    };
  }
  const questions = [
    // Project name (skip if provided as argument)
    initialProjectName ? null : {
      type: "text",
      name: "projectName",
      message: "What is your project name?",
      initial: defaultProjectName,
      validate: (value) => {
        if (!value) return "Project name is required";
        if (value.includes(" ")) return "Project name cannot contain spaces";
        if (fs.existsSync(path.resolve(process.cwd(), value))) {
          return `Directory "${value}" already exists`;
        }
        return true;
      }
    },
    // Installation type (skip if provided via CLI)
    cliOptions.fullPanel || cliOptions.authComponents || cliOptions.componentsOnly ? null : {
      type: "select",
      name: "installationType",
      message: "What do you want to install?",
      choices: [
        {
          title: "Full Panel with Auth",
          value: "full-panel",
          description: "Complete admin panel with authentication, sidebar, and demo pages"
        },
        {
          title: "Auth + Components",
          value: "auth-components",
          description: "Authentication system + UI components without full panel structure"
        },
        {
          title: "Components Only",
          value: "components-only",
          description: "Just the UI components (Form Builder, Data Table, etc.)"
        }
      ],
      initial: 0
    },
    // Package manager (skip if provided via CLI)
    cliOptions.useNpm || cliOptions.usePnpm || cliOptions.useYarn || cliOptions.useBun ? null : {
      type: "select",
      name: "packageManager",
      message: "Which package manager do you want to use?",
      choices: [
        { title: "pnpm", value: "pnpm" },
        { title: "npm", value: "npm" },
        { title: "yarn", value: "yarn" },
        { title: "bun", value: "bun" }
      ],
      initial: packageManager === "pnpm" ? 0 : packageManager === "npm" ? 1 : packageManager === "yarn" ? 2 : 3
    },
    // Authentication (skip if noAuth flag or if installation type determines it)
    cliOptions.noAuth || installationType === "full-panel" || installationType === "auth-components" ? null : {
      type: (prev, answers) => {
        const instType = answers.installationType || installationType;
        return instType === "full-panel" ? null : "confirm";
      },
      name: "authentication",
      message: "Do you want to include authentication (NextAuth.js)?",
      initial: (prev, answers) => (answers.installationType || installationType) === "auth-components"
    },
    // Auth providers (skip if specified via CLI flags)
    cliOptions.google || cliOptions.github || cliOptions.credentials !== void 0 ? null : {
      type: (prev, answers) => {
        const instType = answers.installationType || installationType;
        const hasAuth = answers.authentication !== void 0 ? answers.authentication : instType === "full-panel" || instType === "auth-components";
        return hasAuth ? "multiselect" : null;
      },
      name: "authProviders",
      message: "Which authentication providers do you want?",
      choices: [
        { title: "Email/Password (Credentials)", value: "credentials", selected: true },
        { title: "Google OAuth", value: "google" },
        { title: "GitHub OAuth", value: "github" }
      ],
      hint: "Space to select. Return to submit",
      instructions: false
    },
    // Demos (skip if noDemos flag)
    cliOptions.noDemos ? null : {
      type: (prev, answers) => {
        const instType = answers.installationType || installationType;
        return instType === "full-panel" ? "confirm" : null;
      },
      name: "demos",
      message: "Do you want to include demo pages? (recommended for learning)",
      initial: true
    },
    {
      type: (prev, answers) => {
        const instType = answers.installationType || installationType;
        return prev && instType === "full-panel" ? "multiselect" : null;
      },
      name: "demoTypes",
      message: "Which demos do you want to include?",
      choices: [
        { title: "Form Builder Demo", value: "form", selected: true },
        { title: "Data Table Demo", value: "table", selected: true },
        { title: "Notification Demo", value: "notification", selected: true }
      ],
      hint: "Space to select. Return to submit",
      instructions: false
    },
    // Git (skip if disableGit flag)
    cliOptions.disableGit ? null : {
      type: "confirm",
      name: "initGit",
      message: "Initialize a git repository?",
      initial: true
    }
  ].filter(Boolean);
  try {
    const promptAnswers = await prompts(questions, {
      onCancel: () => {
        throw new Error("User cancelled the operation");
      }
    });
    const answers = {
      projectName: initialProjectName || promptAnswers.projectName || defaultProjectName,
      installationType: promptAnswers.installationType || installationType,
      packageManager: promptAnswers.packageManager || packageManager,
      authentication: false,
      authProviders: promptAnswers.authProviders || authProviders,
      demos: promptAnswers.demos !== void 0 ? promptAnswers.demos : cliOptions.noDemos ? false : installationType === "full-panel",
      demoTypes: promptAnswers.demoTypes || (cliOptions.noDemos ? [] : ["form", "table", "notification"]),
      initGit: promptAnswers.initGit !== void 0 ? promptAnswers.initGit : !cliOptions.disableGit,
      skipInstall: cliOptions.skipInstall || false
    };
    if (cliOptions.noAuth) {
      answers.authentication = false;
    } else if (answers.installationType === "full-panel" || answers.installationType === "auth-components") {
      answers.authentication = true;
    } else {
      answers.authentication = promptAnswers.authentication || false;
    }
    if (answers.authentication && answers.authProviders.length === 0) {
      answers.authProviders = ["credentials"];
    }
    return answers;
  } catch (error) {
    return null;
  }
}

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
  complete: (projectName, devCommand, installationType, isCurrentDir, skipInstall, packageManager) => {
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
    if (skipInstall && packageManager) {
      const installCmd = packageManager === "npm" ? "npm install" : packageManager === "yarn" ? "yarn install" : packageManager === "bun" ? "bun install" : `${packageManager} install`;
      console.log(chalk.cyan(`  ${installCmd}`));
    }
    console.log(chalk.cyan(`  ${devCommand}`));
    if (installationType === "full-panel") {
      console.log();
      console.log(chalk.yellow("\u26A0\uFE0F  Don't forget:"));
      console.log(chalk.cyan(`  \u2022 Open .env and configure your authentication providers`));
    }
    console.log();
    console.log(chalk.bold("\u{1F4DA} Documentation:"), chalk.cyan("https://github.com/kristiansnts/shadpanel"));
    console.log(chalk.bold("\u2B50 Enjoying ShadPanel?"), chalk.cyan("Give it a star:"), chalk.underline.cyan("https://github.com/kristiansnts/shadpanel"));
    console.log();
  },
  // Print a blank line
  newline: () => {
    console.log();
  }
};

// cli/utils/files.ts
import fs2 from "fs-extra";
import path2 from "path";
async function copyTemplateFiles(templateDir, targetDir, variables) {
  await fs2.ensureDir(targetDir);
  const files = await fs2.readdir(templateDir, { withFileTypes: true });
  for (const file of files) {
    const sourcePath = path2.join(templateDir, file.name);
    const targetPath = path2.join(targetDir, file.name);
    if (file.isDirectory()) {
      await copyTemplateFiles(sourcePath, targetPath, variables);
    } else if (file.isFile()) {
      let content = await fs2.readFile(sourcePath, "utf-8");
      content = processTemplate(content, variables);
      await fs2.ensureDir(path2.dirname(targetPath));
      await fs2.writeFile(targetPath, content, "utf-8");
    }
  }
}
function processTemplate(content, variables) {
  let processed = content;
  processed = processed.replace(/\{\{APP_NAME\}\}/g, variables.APP_NAME);
  processed = processed.replace(/\{\{PROJECT_NAME\}\}/g, variables.PROJECT_NAME);
  processed = processed.replace(
    /\{\{SHADPANEL_VERSION\}\}/g,
    variables.SHADPANEL_VERSION
  );
  processed = processed.replace(
    /\{\{NEXTAUTH_SECRET\}\}/g,
    variables.NEXTAUTH_SECRET
  );
  processed = processConditional(processed, "GOOGLE", variables.GOOGLE);
  processed = processConditional(processed, "GITHUB", variables.GITHUB);
  processed = processConditional(processed, "CREDENTIALS", variables.CREDENTIALS);
  return processed;
}
function processConditional(content, key, include) {
  const startTag = `{{#${key}}}`;
  const endTag = `{{/${key}}}`;
  const regex = new RegExp(
    `${escapeRegex(startTag)}([\\s\\S]*?)${escapeRegex(endTag)}`,
    "g"
  );
  if (include) {
    return content.replace(regex, "$1");
  } else {
    return content.replace(regex, "");
  }
}
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
async function copyBaseTemplate(templatesDir, targetDir, variables) {
  const baseDir = path2.join(templatesDir, "base");
  await copyTemplateFiles(baseDir, targetDir, variables);
}
async function copyAuthTemplate(templatesDir, targetDir, variables) {
  const authDir = path2.join(templatesDir, "auth");
  await copyTemplateFiles(authDir, targetDir, variables);
}
async function copyDemoTemplate(templatesDir, targetDir, variables) {
  const demoDir = path2.join(templatesDir, "demo");
  await copyTemplateFiles(demoDir, targetDir, variables);
}
async function copyConfigTemplate(templatesDir, targetDir, variables) {
  const configDir = path2.join(templatesDir, "config");
  const files = await fs2.readdir(configDir, { withFileTypes: true });
  for (const file of files) {
    const sourcePath = path2.join(configDir, file.name);
    let targetFileName = file.name;
    let targetPath = path2.join(targetDir, targetFileName);
    if (file.name === "package.json.template") {
      targetFileName = "package.json";
      targetPath = path2.join(targetDir, targetFileName);
    }
    if (file.name === "globals.css") {
      targetPath = path2.join(targetDir, "app", "globals.css");
      await fs2.ensureDir(path2.join(targetDir, "app"));
    }
    if (file.isFile()) {
      let content = await fs2.readFile(sourcePath, "utf-8");
      content = processTemplate(content, variables);
      await fs2.writeFile(targetPath, content, "utf-8");
    }
  }
}
async function createEnvFile(targetDir) {
  const examplePath = path2.join(targetDir, ".env.example");
  const envPath = path2.join(targetDir, ".env");
  if (await fs2.pathExists(examplePath)) {
    await fs2.copy(examplePath, envPath);
  }
}
async function mergeMenuConfigs(targetDir, includeDemos) {
  if (!includeDemos) return;
  const baseMenuPath = path2.join(targetDir, "config", "menu.ts");
  const demoMenuPath = path2.join(targetDir, "config", "menu-demo.ts");
  if (await fs2.pathExists(demoMenuPath)) {
    const demoContent = await fs2.readFile(demoMenuPath, "utf-8");
    await fs2.writeFile(baseMenuPath, demoContent, "utf-8");
    await fs2.remove(demoMenuPath);
  }
}
async function copyUIComponents(packageDir, targetDir) {
  const sourceComponentsDir = path2.join(packageDir, "components");
  const targetComponentsDir = path2.join(targetDir, "components");
  if (!await fs2.pathExists(sourceComponentsDir)) {
    throw new Error("Components directory not found in package");
  }
  await fs2.copy(sourceComponentsDir, targetComponentsDir, {
    overwrite: false,
    errorOnExist: false
  });
}
async function copyLibUtils(packageDir, targetDir) {
  const sourceLibDir = path2.join(packageDir, "lib");
  const targetLibDir = path2.join(targetDir, "lib");
  if (await fs2.pathExists(sourceLibDir)) {
    await fs2.copy(sourceLibDir, targetLibDir, {
      overwrite: false,
      errorOnExist: false
    });
  }
}
async function copyHooks(packageDir, targetDir) {
  const sourceHooksDir = path2.join(packageDir, "hooks");
  const targetHooksDir = path2.join(targetDir, "hooks");
  if (await fs2.pathExists(sourceHooksDir)) {
    await fs2.copy(sourceHooksDir, targetHooksDir, {
      overwrite: false,
      errorOnExist: false
    });
  }
}

// cli/utils/dependencies.ts
import { execSync } from "child_process";
import fs3 from "fs-extra";
import path3 from "path";
function isPackageManagerAvailable(pm) {
  try {
    execSync(`${pm} --version`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
async function installDependencies(projectDir, packageManager, localPackagePath) {
  if (localPackagePath && await fs3.pathExists(localPackagePath)) {
    const installLocalCommand = getInstallLocalCommand(packageManager, localPackagePath);
    execSync(installLocalCommand, {
      cwd: projectDir,
      stdio: "inherit"
    });
  } else {
    const installCommand = getInstallCommand(packageManager);
    execSync(installCommand, {
      cwd: projectDir,
      stdio: "inherit"
    });
  }
}
function getInstallCommand(packageManager) {
  switch (packageManager) {
    case "npm":
      return "npm install";
    case "pnpm":
      return "pnpm install";
    case "yarn":
      return "yarn install";
    case "bun":
      return "bun install";
  }
}
function getInstallLocalCommand(packageManager, packagePath) {
  switch (packageManager) {
    case "npm":
      return `npm install ${packagePath}`;
    case "pnpm":
      return `pnpm add ${packagePath}`;
    case "yarn":
      return `yarn add ${packagePath}`;
    case "bun":
      return `bun add ${packagePath}`;
  }
}
function getDevCommand(packageManager) {
  switch (packageManager) {
    case "npm":
      return "npm run dev";
    case "pnpm":
      return "pnpm dev";
    case "yarn":
      return "yarn dev";
    case "bun":
      return "bun dev";
  }
}
async function updatePackageJson(projectDir, options) {
  const packageJsonPath = path3.join(projectDir, "package.json");
  if (!await fs3.pathExists(packageJsonPath)) {
    throw new Error("package.json not found");
  }
  const packageJson = await fs3.readJson(packageJsonPath);
  if (options.authentication) {
    packageJson.dependencies["next-auth"] = "^4.24.11";
  }
  await fs3.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

// cli/utils/git.ts
import { execSync as execSync2 } from "child_process";
import fs4 from "fs-extra";
function isGitAvailable() {
  try {
    execSync2("git --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
async function initGitRepository(projectDir) {
  if (!isGitAvailable()) {
    throw new Error("Git is not available on this system");
  }
  execSync2("git init", {
    cwd: projectDir,
    stdio: "ignore"
  });
  execSync2("git add .", {
    cwd: projectDir,
    stdio: "ignore"
  });
  execSync2('git commit -m "Initial commit from ShadPanel CLI"', {
    cwd: projectDir,
    stdio: "ignore"
  });
}

// package.json
var package_default = {
  name: "create-shadpanel-next",
  version: "0.1.0",
  description: "Create a new Next.js admin panel with ShadPanel - Use via npx create-shadpanel-next@latest my-app",
  type: "module",
  bin: {
    "create-shadpanel-next": "./dist/cli.js"
  },
  files: [
    "dist",
    "templates",
    "components",
    "lib",
    "hooks",
    "contexts",
    "README.md"
  ],
  keywords: [
    "nextjs",
    "admin-panel",
    "form-builder",
    "data-table",
    "react",
    "typescript",
    "tailwindcss",
    "shadcn-ui",
    "cli",
    "npx",
    "create-app",
    "starter",
    "boilerplate"
  ],
  author: "Kristian Santoso <epafroditus.kristian@gmail.com>",
  license: "MIT",
  repository: {
    type: "git",
    url: "https://github.com/kristiansnts/shadpanel",
    directory: "packages/create-shadpanel-next"
  },
  scripts: {
    build: "tsup",
    dev: "tsup --watch",
    prepublishOnly: "pnpm run build"
  },
  dependencies: {
    chalk: "^5.6.2",
    commander: "^14.0.1",
    "fs-extra": "^11.3.2",
    ora: "^9.0.0",
    prompts: "^2.4.2"
  },
  devDependencies: {
    "@types/fs-extra": "^11.0.4",
    "@types/node": "^20",
    "@types/prompts": "^2.4.9",
    tsup: "^8.5.0",
    typescript: "^5"
  }
};

// cli/commands/init.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path4.dirname(__filename);
async function initCommand(projectName, options = {}) {
  logger.welcome();
  const answers = await promptInitQuestions(projectName, options);
  if (!answers) {
    logger.error("Initialization cancelled");
    process.exit(1);
  }
  if (!isPackageManagerAvailable(answers.packageManager)) {
    logger.error(
      `Package manager "${answers.packageManager}" is not available on your system`
    );
    process.exit(1);
  }
  const appName = answers.projectName.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const targetDir = answers.projectName === "." ? process.cwd() : path4.resolve(process.cwd(), answers.projectName);
  const templatesDir = path4.resolve(__dirname, "../templates");
  if (!await fs5.pathExists(templatesDir)) {
    logger.error("Templates directory not found. This may be a package issue.");
    process.exit(1);
  }
  logger.info(`Setting up your project in: ${targetDir}`);
  logger.newline();
  const nextAuthSecret = randomBytes(32).toString("base64");
  const variables = {
    APP_NAME: appName,
    PROJECT_NAME: answers.projectName,
    SHADPANEL_VERSION: package_default.version,
    NEXTAUTH_SECRET: nextAuthSecret,
    GOOGLE: answers.authProviders.includes("google"),
    GITHUB: answers.authProviders.includes("github"),
    CREDENTIALS: answers.authProviders.includes("credentials")
  };
  try {
    const spinner1 = logger.spinner("Creating project structure...");
    spinner1.start();
    await fs5.ensureDir(targetDir);
    spinner1.succeed("Project structure created");
    if (answers.installationType === "full-panel") {
      const spinner2 = logger.spinner("Copying base template files...");
      spinner2.start();
      await copyBaseTemplate(templatesDir, targetDir, variables);
      spinner2.succeed("Base template files copied");
    }
    const spinner3 = logger.spinner("Setting up configuration...");
    spinner3.start();
    await copyConfigTemplate(templatesDir, targetDir, variables);
    spinner3.succeed("Configuration files created");
    if (answers.authentication) {
      const spinner4 = logger.spinner("Adding authentication system...");
      spinner4.start();
      await copyAuthTemplate(templatesDir, targetDir, variables);
      spinner4.succeed("Authentication system added");
    }
    if (answers.installationType === "full-panel" && answers.demos) {
      const spinner5 = logger.spinner("Adding demo pages...");
      spinner5.start();
      await copyDemoTemplate(templatesDir, targetDir, variables);
      await mergeMenuConfigs(targetDir, true);
      spinner5.succeed("Demo pages added");
    }
    const packageDir = path4.resolve(__dirname, "..");
    const spinnerComponents = logger.spinner("Copying UI components...");
    spinnerComponents.start();
    await copyUIComponents(packageDir, targetDir);
    await copyLibUtils(packageDir, targetDir);
    await copyHooks(packageDir, targetDir);
    spinnerComponents.succeed("UI components copied");
    const spinner6 = logger.spinner("Creating environment file...");
    spinner6.start();
    await createEnvFile(targetDir);
    spinner6.succeed("Environment file created");
    const spinner7 = logger.spinner("Updating dependencies...");
    spinner7.start();
    await updatePackageJson(targetDir, {
      authentication: answers.authentication
    });
    spinner7.succeed("Dependencies updated");
    if (!answers.skipInstall) {
      const spinner8 = logger.spinner(
        `Installing dependencies with ${answers.packageManager}...`
      );
      spinner8.start();
      await installDependencies(targetDir, answers.packageManager);
      spinner8.succeed("Dependencies installed");
    } else {
      logger.info("Skipping dependency installation (--skip-install flag)");
    }
    if (answers.initGit && isGitAvailable()) {
      const spinner9 = logger.spinner("Initializing git repository...");
      spinner9.start();
      try {
        await initGitRepository(targetDir);
        spinner9.succeed("Git repository initialized");
      } catch (error) {
        spinner9.warn("Failed to initialize git repository");
      }
    }
    const projectNameForMessage = answers.projectName === "." ? path4.basename(process.cwd()) : answers.projectName;
    logger.complete(
      projectNameForMessage,
      getDevCommand(answers.packageManager),
      answers.installationType,
      answers.projectName === ".",
      // Flag to indicate current directory installation
      answers.skipInstall,
      // Flag to indicate if install was skipped
      answers.packageManager
      // Package manager for install command
    );
    if (answers.authentication) {
      logger.info(
        "Don't forget to set up your authentication providers in .env"
      );
    }
  } catch (error) {
    logger.error("Failed to initialize project");
    console.error(error);
    process.exit(1);
  }
}

// cli/index.ts
var program = new Command();
program.name("create-shadpanel-next").description("Create a new Next.js admin panel with ShadPanel").version(package_default.version).argument("[project-name]", "Project directory name").option("--use-npm", "Explicitly use npm as package manager").option("--use-pnpm", "Explicitly use pnpm as package manager").option("--use-yarn", "Explicitly use yarn as package manager").option("--use-bun", "Explicitly use bun as package manager").option("--skip-install", "Skip installing packages").option("--disable-git", "Explicitly skip initializing a git repository").option("--yes", "Use defaults for all options without prompting").option("-e, --example <name>", "Bootstrap with a specific example").option("--full-panel", "Install full panel with authentication (default)").option("--auth-components", "Install authentication + components only").option("--components-only", "Install components only").option("--no-auth", "Skip authentication setup").option("--google", "Include Google OAuth provider").option("--github", "Include GitHub OAuth provider").option("--credentials", "Include email/password authentication (default)").option("--no-demos", "Skip demo pages").action(async (projectName, options) => {
  await initCommand(projectName, options);
});
program.command("init").description("Initialize a new ShadPanel project").argument("[project-name]", "Project directory name").option("--use-npm", "Explicitly use npm as package manager").option("--use-pnpm", "Explicitly use pnpm as package manager").option("--use-yarn", "Explicitly use yarn as package manager").option("--use-bun", "Explicitly use bun as package manager").option("--skip-install", "Skip installing packages").option("--disable-git", "Explicitly skip initializing a git repository").option("--yes", "Use defaults for all options without prompting").option("-e, --example <name>", "Bootstrap with a specific example").option("--full-panel", "Install full panel with authentication (default)").option("--auth-components", "Install authentication + components only").option("--components-only", "Install components only").option("--no-auth", "Skip authentication setup").option("--google", "Include Google OAuth provider").option("--github", "Include GitHub OAuth provider").option("--credentials", "Include email/password authentication (default)").option("--no-demos", "Skip demo pages").action(async (projectName, options) => {
  await initCommand(projectName, options);
});
program.parse();
