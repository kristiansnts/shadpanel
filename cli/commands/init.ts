import path from "path"
import { fileURLToPath } from "url"
import { randomBytes } from "crypto"
import fs from "fs-extra"
import { promptInitQuestions, promptAppName } from "../utils/prompts"
import { logger } from "../utils/logger"
import {
  copyBaseTemplate,
  copyAuthTemplate,
  copyDemoTemplate,
  copyConfigTemplate,
  createEnvFile,
  mergeMenuConfigs,
  copyUIComponents,
  copyLibUtils,
  copyHooks,
  type TemplateVariables,
} from "../utils/files"
import {
  isPackageManagerAvailable,
  installDependencies,
  updatePackageJson,
  getDevCommand,
  type PackageManager,
} from "../utils/dependencies"
import { initGitRepository, isGitAvailable } from "../utils/git"
import packageJson from "../../package.json"

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface CliOptions {
  useNpm?: boolean
  usePnpm?: boolean
  useYarn?: boolean
  useBun?: boolean
  skipInstall?: boolean
  disableGit?: boolean
  yes?: boolean
  example?: string
  fullPanel?: boolean
  authComponents?: boolean
  componentsOnly?: boolean
  noAuth?: boolean
  google?: boolean
  github?: boolean
  credentials?: boolean
  noDemos?: boolean
}

export async function initCommand(projectName?: string, options: CliOptions = {}): Promise<void> {
  logger.welcome()

  // Prompt user for project configuration (or use CLI options)
  const answers = await promptInitQuestions(projectName, options)

  if (!answers) {
    logger.error("Initialization cancelled")
    process.exit(1)
  }

  // Validate package manager
  if (!isPackageManagerAvailable(answers.packageManager)) {
    logger.error(
      `Package manager "${answers.packageManager}" is not available on your system`
    )
    process.exit(1)
  }

  // Convert project name to application display name
  // e.g., "my-admin-panel" -> "My Admin Panel"
  const appName = answers.projectName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Setup paths
  // Handle current directory (.) for components-only and auth-components
  const targetDir = answers.projectName === "."
    ? process.cwd()
    : path.resolve(process.cwd(), answers.projectName)
  // When built, __dirname is dist/, so we go up one level to find templates/
  const templatesDir = path.resolve(__dirname, "../templates")

  // Check if templates directory exists
  if (!(await fs.pathExists(templatesDir))) {
    logger.error("Templates directory not found. This may be a package issue.")
    process.exit(1)
  }

  // Show appropriate message based on merge status
  if (answers.mergeWithExisting) {
    logger.info(`Merging ShadPanel into existing project: ${targetDir}`)
    logger.info("Existing files will be preserved")
  } else {
    logger.info(`Setting up your project in: ${targetDir}`)
  }
  logger.newline()

  // Generate a secure random secret for NextAuth
  const nextAuthSecret = randomBytes(32).toString('base64')

  // Create template variables
  const variables: TemplateVariables = {
    APP_NAME: appName,
    PROJECT_NAME: answers.projectName,
    SHADPANEL_VERSION: packageJson.version,
    NEXTAUTH_SECRET: nextAuthSecret,
    GOOGLE: answers.authProviders.includes("google"),
    GITHUB: answers.authProviders.includes("github"),
    CREDENTIALS: answers.authProviders.includes("credentials"),
  }

  try {
    // Step 1: Create project directory
    const spinner1 = logger.spinner("Creating project structure...")
    spinner1.start()
    await fs.ensureDir(targetDir)
    spinner1.succeed("Project structure created")

    // Step 2: Copy base template (only for full-panel and when not merging)
    // When merging with existing project, skip base template to preserve existing Next.js structure
    if (answers.installationType === "full-panel" && !answers.mergeWithExisting) {
      const spinner2 = logger.spinner("Copying base template files...")
      spinner2.start()
      await copyBaseTemplate(templatesDir, targetDir, variables)
      spinner2.succeed("Base template files copied")
    } else if (answers.mergeWithExisting) {
      logger.info("Skipping base template (preserving existing Next.js structure)")
    }

    // Step 3: Copy config files (preserve existing if merging)
    const spinner3 = logger.spinner("Setting up configuration...")
    spinner3.start()
    await copyConfigTemplate(templatesDir, targetDir, variables, answers.mergeWithExisting)
    spinner3.succeed("Configuration files created")

    // Step 4: Copy auth template if needed (preserve existing if merging)
    if (answers.authentication) {
      const spinner4 = logger.spinner("Adding authentication system...")
      spinner4.start()
      await copyAuthTemplate(templatesDir, targetDir, variables, answers.mergeWithExisting)
      spinner4.succeed("Authentication system added")
    }

    // Step 5: Copy demo template if needed (only for full-panel, preserve existing if merging)
    if (answers.installationType === "full-panel" && answers.demos) {
      const spinner5 = logger.spinner("Adding demo pages...")
      spinner5.start()
      await copyDemoTemplate(templatesDir, targetDir, variables, answers.mergeWithExisting)
      await mergeMenuConfigs(targetDir, true)
      spinner5.succeed("Demo pages added")
    }

    // Step 5.5: Copy UI components, lib, and hooks from package
    const packageDir = path.resolve(__dirname, "..")
    const spinnerComponents = logger.spinner("Copying UI components...")
    spinnerComponents.start()
    await copyUIComponents(packageDir, targetDir)
    await copyLibUtils(packageDir, targetDir)
    await copyHooks(packageDir, targetDir)
    spinnerComponents.succeed("UI components copied")

    // Step 6: Create .env file
    const spinner6 = logger.spinner("Creating environment file...")
    spinner6.start()
    await createEnvFile(targetDir)
    spinner6.succeed("Environment file created")

    // Step 7: Update package.json with conditional dependencies
    const spinner7 = logger.spinner("Updating dependencies...")
    spinner7.start()
    await updatePackageJson(targetDir, {
      authentication: answers.authentication,
    })
    spinner7.succeed("Dependencies updated")

    // Step 8: Install dependencies (skip if --skip-install flag is used)
    if (!answers.skipInstall) {
      const spinner8 = logger.spinner(
        `Installing dependencies with ${answers.packageManager}...`
      )
      spinner8.start()
      await installDependencies(targetDir, answers.packageManager)
      spinner8.succeed("Dependencies installed")
    } else {
      logger.info("Skipping dependency installation (--skip-install flag)")
    }

    // Step 9: Initialize git repository
    if (answers.initGit && isGitAvailable()) {
      const spinner9 = logger.spinner("Initializing git repository...")
      spinner9.start()
      try {
        await initGitRepository(targetDir)
        spinner9.succeed("Git repository initialized")
      } catch (error) {
        spinner9.warn("Failed to initialize git repository")
      }
    }

    // Success!
    // For current directory installation, don't show "cd ." in completion message
    const projectNameForMessage = answers.projectName === "."
      ? path.basename(process.cwd())
      : answers.projectName
    logger.complete(
      projectNameForMessage,
      getDevCommand(answers.packageManager),
      answers.installationType,
      answers.projectName === ".", // Flag to indicate current directory installation
      answers.skipInstall, // Flag to indicate if install was skipped
      answers.packageManager // Package manager for install command
    )

    // Additional info
    if (answers.authentication) {
      logger.info(
        "Don't forget to set up your authentication providers in .env"
      )
    }
  } catch (error) {
    logger.error("Failed to initialize project")
    console.error(error)
    process.exit(1)
  }
}
