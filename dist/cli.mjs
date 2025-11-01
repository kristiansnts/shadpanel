#!/usr/bin/env node

// cli/index.ts
import { Command as Command2 } from "commander";

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
    const projectDir2 = path.resolve(process.cwd(), defaultProjectName);
    const directoryExists2 = fs.existsSync(projectDir2);
    return {
      projectName: defaultProjectName,
      installationType,
      packageManager,
      authentication: cliOptions.noAuth ? false : installationType !== "components-only",
      authProviders: authProviders.length > 0 ? authProviders : ["credentials"],
      demos: cliOptions.noDemos ? false : installationType === "full-panel",
      demoTypes: cliOptions.noDemos ? [] : ["form", "table", "notification"],
      initGit: cliOptions.disableGit ? false : true,
      skipInstall: cliOptions.skipInstall || false,
      mergeWithExisting: directoryExists2
      // Auto-merge if --yes flag and directory exists
    };
  }
  const projectDir = path.resolve(process.cwd(), initialProjectName || defaultProjectName);
  const directoryExists = fs.existsSync(projectDir);
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
        return true;
      }
    },
    // Ask if user wants to merge with existing directory
    directoryExists && !cliOptions.yes ? {
      type: "confirm",
      name: "mergeWithExisting",
      message: `Directory "${initialProjectName || defaultProjectName}" already exists. Do you want to merge ShadPanel into this existing project?`,
      initial: true
    } : null,
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
    if (directoryExists && promptAnswers.mergeWithExisting === false) {
      console.log("\nOperation cancelled. Please choose a different project name or remove the existing directory.");
      return null;
    }
    const answers = {
      projectName: initialProjectName || promptAnswers.projectName || defaultProjectName,
      installationType: promptAnswers.installationType || installationType,
      packageManager: promptAnswers.packageManager || packageManager,
      authentication: false,
      authProviders: promptAnswers.authProviders || authProviders,
      demos: promptAnswers.demos !== void 0 ? promptAnswers.demos : cliOptions.noDemos ? false : installationType === "full-panel",
      demoTypes: promptAnswers.demoTypes || (cliOptions.noDemos ? [] : ["form", "table", "notification"]),
      initGit: promptAnswers.initGit !== void 0 ? promptAnswers.initGit : !cliOptions.disableGit,
      skipInstall: cliOptions.skipInstall || false,
      mergeWithExisting: promptAnswers.mergeWithExisting !== void 0 ? promptAnswers.mergeWithExisting : false
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
async function copyTemplateFiles(templateDir, targetDir, variables, preserveExisting = false) {
  await fs2.ensureDir(targetDir);
  const files = await fs2.readdir(templateDir, { withFileTypes: true });
  for (const file of files) {
    const sourcePath = path2.join(templateDir, file.name);
    const targetPath = path2.join(targetDir, file.name);
    if (file.isDirectory()) {
      await copyTemplateFiles(sourcePath, targetPath, variables, preserveExisting);
    } else if (file.isFile()) {
      if (preserveExisting && await fs2.pathExists(targetPath)) {
        continue;
      }
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
async function copyBaseTemplate(templatesDir, targetDir, variables, preserveExisting = false) {
  const baseDir = path2.join(templatesDir, "base");
  await copyTemplateFiles(baseDir, targetDir, variables, preserveExisting);
}
async function copyAuthTemplate(templatesDir, targetDir, variables, preserveExisting = false) {
  const authDir = path2.join(templatesDir, "auth");
  await copyTemplateFiles(authDir, targetDir, variables, preserveExisting);
}
async function copyDemoTemplate(templatesDir, targetDir, variables, preserveExisting = false) {
  const demoDir = path2.join(templatesDir, "demo");
  await copyTemplateFiles(demoDir, targetDir, variables, preserveExisting);
}
async function copyConfigTemplate(templatesDir, targetDir, variables, preserveExisting = false) {
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
      if (preserveExisting && await fs2.pathExists(targetPath)) {
        continue;
      }
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
  name: "shadpanel",
  version: "1.1.3",
  description: "ShadPanel CLI - Build admin panels with Next.js and shadcn/ui",
  main: "index.cjs",
  type: "module",
  bin: {
    shadpanel: "./dist/cli.mjs"
  },
  scripts: {
    test: 'echo "Error: no test specified" && exit 1',
    "build:cli": "tsup cli/index.ts --format esm --dts --clean && mv dist/index.js dist/cli.mjs",
    "dev:cli": "tsx cli/index.ts",
    prepublishOnly: "npm run build:cli"
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

// cli/commands/init.ts
var __filename2 = fileURLToPath(import.meta.url);
var __dirname2 = path4.dirname(__filename2);
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
  const templatesDir = path4.resolve(__dirname2, "../templates");
  if (!await fs5.pathExists(templatesDir)) {
    logger.error("Templates directory not found. This may be a package issue.");
    process.exit(1);
  }
  if (answers.mergeWithExisting) {
    logger.info(`Merging ShadPanel into existing project: ${targetDir}`);
    logger.info("Existing files will be preserved");
  } else {
    logger.info(`Setting up your project in: ${targetDir}`);
  }
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
    if (answers.installationType === "full-panel" && !answers.mergeWithExisting) {
      const spinner2 = logger.spinner("Copying base template files...");
      spinner2.start();
      await copyBaseTemplate(templatesDir, targetDir, variables);
      spinner2.succeed("Base template files copied");
    } else if (answers.mergeWithExisting) {
      logger.info("Skipping base template (preserving existing Next.js structure)");
    }
    const spinner3 = logger.spinner("Setting up configuration...");
    spinner3.start();
    await copyConfigTemplate(templatesDir, targetDir, variables, answers.mergeWithExisting);
    spinner3.succeed("Configuration files created");
    if (answers.authentication) {
      const spinner4 = logger.spinner("Adding authentication system...");
      spinner4.start();
      await copyAuthTemplate(templatesDir, targetDir, variables, answers.mergeWithExisting);
      spinner4.succeed("Authentication system added");
    }
    if (answers.installationType === "full-panel" && answers.demos) {
      const spinner5 = logger.spinner("Adding demo pages...");
      spinner5.start();
      await copyDemoTemplate(templatesDir, targetDir, variables, answers.mergeWithExisting);
      await mergeMenuConfigs(targetDir, true);
      spinner5.succeed("Demo pages added");
    }
    const packageDir = path4.resolve(__dirname2, "..");
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

// cli/commands/prisma.ts
import { Command } from "commander";
import { execSync as execSync3 } from "child_process";
import path7 from "path";
import fs8 from "fs-extra";

// cli/utils/db.ts
import fs6 from "fs-extra";
import path5 from "path";
function loadEnv() {
  try {
    const envPath = path5.join(process.cwd(), ".env");
    if (fs6.existsSync(envPath)) {
      const envContent = fs6.readFileSync(envPath, "utf-8");
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
  const templatePath = path5.join(baseDir, "prisma", "schema.prisma.template");
  const outputPath = path5.join(baseDir, "prisma", "schema.prisma");
  const driver = getDriver();
  const url = getUrl();
  console.log(`\u{1F4CA} Database Driver: ${driver}`);
  console.log(`\u{1F517} Database URL: ${url.substring(0, 20)}...`);
  if (!await fs6.pathExists(templatePath)) {
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
    await fs6.ensureDir(path5.dirname(templatePath));
    await fs6.writeFile(templatePath, defaultTemplate);
  }
  let schemaContent = await fs6.readFile(templatePath, "utf-8");
  schemaContent = schemaContent.replace(/\{\{DATABASE_DRIVER\}\}/g, driver).replace(/\{\{DATABASE_URL\}\}/g, url);
  await fs6.ensureDir(path5.dirname(outputPath));
  await fs6.writeFile(outputPath, schemaContent);
  console.log(`\u2705 Generated: ${outputPath}`);
}

// cli/utils/db-prompts.ts
import prompts2 from "prompts";
import fs7 from "fs-extra";
import path6 from "path";
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
async function createEnvFile2(projectDir, driver) {
  const envPath = path6.join(projectDir, ".env");
  const envExamplePath = path6.join(projectDir, ".env.example");
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
  if (await fs7.pathExists(envPath)) {
    const existing = await fs7.readFile(envPath, "utf-8");
    if (!existing.includes("DATABASE_DRIVER")) {
      await fs7.appendFile(envPath, "\n" + envContent);
    }
  } else {
    await fs7.writeFile(envPath, envContent);
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
  if (await fs7.pathExists(envExamplePath)) {
    const existing = await fs7.readFile(envExamplePath, "utf-8");
    if (!existing.includes("DATABASE_DRIVER")) {
      await fs7.appendFile(envExamplePath, "\n" + exampleContent);
    }
  } else {
    await fs7.writeFile(envExamplePath, exampleContent);
  }
}

// cli/commands/prisma.ts
function isPrismaInstalled(projectDir) {
  try {
    const packageJsonPath = path7.join(projectDir, "package.json");
    if (!fs8.existsSync(packageJsonPath)) {
      return false;
    }
    const packageJson = JSON.parse(fs8.readFileSync(packageJsonPath, "utf-8"));
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
      await createEnvFile2(projectDir, answers.driver);
      spinner1.succeed("Environment configuration created (.env)");
      const spinner2 = logger.spinner("Setting up Prisma files...");
      spinner2.start();
      const prismaDir = path7.join(projectDir, "prisma");
      await fs8.ensureDir(prismaDir);
      const templatePath = path7.join(prismaDir, "schema.prisma.template");
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
      await fs8.writeFile(templatePath, defaultTemplate);
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
          execSync3(pmCommands[answers.packageManager], {
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
      logger.info("   3. Update schema.prisma with your models");
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
  db.command("generate").description("Generate Prisma schema and Prisma Client").action(async () => {
    try {
      const spinner1 = logger.spinner("Generating Prisma schema from template...");
      spinner1.start();
      await generatePrismaSchema();
      spinner1.succeed("Prisma schema generated");
      const spinner2 = logger.spinner("Generating Prisma Client...");
      spinner2.start();
      execSync3("npx prisma generate", { stdio: "inherit" });
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
      execSync3(migrateCmd, { stdio: "inherit" });
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
      execSync3("npx prisma db push", { stdio: "inherit" });
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
      execSync3(pullCmd, { stdio: "inherit" });
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
      execSync3(studioCmd, { stdio: "inherit" });
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
      execSync3("npx prisma db seed", { stdio: "inherit" });
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
      execSync3(resetCmd, { stdio: "inherit" });
      logger.success("Database reset complete!");
    } catch (error) {
      logger.error("Failed to reset database");
      console.error(error);
      process.exit(1);
    }
  });
  return db;
}

// cli/index.ts
var program = new Command2();
program.name("shadpanel").description("ShadPanel CLI - Build admin panels with Next.js and shadcn/ui").version(package_default.version);
program.command("init").description("Initialize a new ShadPanel project").argument("[project-name]", "Project directory name").option("--use-npm", "Explicitly use npm as package manager").option("--use-pnpm", "Explicitly use pnpm as package manager").option("--use-yarn", "Explicitly use yarn as package manager").option("--use-bun", "Explicitly use bun as package manager").option("--skip-install", "Skip installing packages").option("--disable-git", "Explicitly skip initializing a git repository").option("--yes", "Use defaults for all options without prompting").option("-e, --example <name>", "Bootstrap with a specific example").option("--full-panel", "Install full panel with authentication (default)").option("--auth-components", "Install authentication + components only").option("--components-only", "Install components only").option("--no-auth", "Skip authentication setup").option("--google", "Include Google OAuth provider").option("--github", "Include GitHub OAuth provider").option("--credentials", "Include email/password authentication (default)").option("--no-demos", "Skip demo pages").action(async (projectName, options) => {
  await initCommand(projectName, options);
});
program.addCommand(prismaCommand());
program.parse();
//# sourceMappingURL=index.js.map