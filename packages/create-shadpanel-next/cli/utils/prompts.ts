import prompts from "prompts"
import path from "path"
import fs from "fs-extra"
import type { CliOptions } from "../commands/init"

export type InstallationType = "full-panel" | "auth-components" | "components-only"
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun"

export interface InitAnswers {
  installationType: InstallationType
  projectName: string
  packageManager: PackageManager
  authentication: boolean
  authProviders: string[]
  demos: boolean
  demoTypes: string[]
  initGit: boolean
  skipInstall: boolean
}

// Detect available package managers
function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent || ""

  if (userAgent.includes("pnpm")) return "pnpm"
  if (userAgent.includes("yarn")) return "yarn"
  if (userAgent.includes("bun")) return "bun"
  return "npm"
}

export async function promptInitQuestions(
  initialProjectName?: string,
  cliOptions: CliOptions = {}
): Promise<InitAnswers | null> {
  const defaultProjectName = initialProjectName || "my-admin-panel"

  // Determine package manager from CLI options or detect
  let packageManager: PackageManager = detectPackageManager()
  if (cliOptions.useNpm) packageManager = "npm"
  if (cliOptions.usePnpm) packageManager = "pnpm"
  if (cliOptions.useYarn) packageManager = "yarn"
  if (cliOptions.useBun) packageManager = "bun"

  // Determine installation type from CLI options
  let installationType: InstallationType = "full-panel"
  if (cliOptions.componentsOnly) installationType = "components-only"
  if (cliOptions.authComponents) installationType = "auth-components"
  if (cliOptions.fullPanel) installationType = "full-panel"

  // Determine authentication providers
  const authProviders: string[] = []
  if (cliOptions.credentials !== false) authProviders.push("credentials") // Default
  if (cliOptions.google) authProviders.push("google")
  if (cliOptions.github) authProviders.push("github")

  // If --yes flag is used, skip all prompts and use defaults/CLI options
  if (cliOptions.yes) {
    return {
      projectName: defaultProjectName,
      installationType,
      packageManager,
      authentication: cliOptions.noAuth ? false : (installationType !== "components-only"),
      authProviders: authProviders.length > 0 ? authProviders : ["credentials"],
      demos: cliOptions.noDemos ? false : (installationType === "full-panel"),
      demoTypes: cliOptions.noDemos ? [] : ["form", "table", "notification"],
      initGit: cliOptions.disableGit ? false : true,
      skipInstall: cliOptions.skipInstall || false,
    }
  }

  // Build questions array, skipping those provided via CLI
  const questions = [
    // Project name (skip if provided as argument)
    initialProjectName ? null : {
      type: "text" as const,
      name: "projectName",
      message: "What is your project name?",
      initial: defaultProjectName,
      validate: (value: string) => {
        if (!value) return "Project name is required"
        if (value.includes(" ")) return "Project name cannot contain spaces"

        // Check if directory exists
        if (fs.existsSync(path.resolve(process.cwd(), value))) {
          return `Directory "${value}" already exists`
        }
        return true
      },
    },
    // Installation type (skip if provided via CLI)
    (cliOptions.fullPanel || cliOptions.authComponents || cliOptions.componentsOnly) ? null : {
      type: "select" as const,
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
        },
      ],
      initial: 0,
    },
    // Package manager (skip if provided via CLI)
    (cliOptions.useNpm || cliOptions.usePnpm || cliOptions.useYarn || cliOptions.useBun) ? null : {
      type: "select" as const,
      name: "packageManager",
      message: "Which package manager do you want to use?",
      choices: [
        { title: "pnpm", value: "pnpm" },
        { title: "npm", value: "npm" },
        { title: "yarn", value: "yarn" },
        { title: "bun", value: "bun" },
      ],
      initial: packageManager === "pnpm" ? 0 : packageManager === "npm" ? 1 : packageManager === "yarn" ? 2 : 3,
    },
    // Authentication (skip if noAuth flag or if installation type determines it)
    (cliOptions.noAuth || installationType === "full-panel" || installationType === "auth-components") ? null : {
      type: (prev: any, answers: any) => {
        const instType = answers.installationType || installationType
        return instType === "full-panel" ? null : "confirm"
      },
      name: "authentication",
      message: "Do you want to include authentication (NextAuth.js)?",
      initial: (prev: any, answers: any) => (answers.installationType || installationType) === "auth-components",
    },
    // Auth providers (skip if specified via CLI flags)
    (cliOptions.google || cliOptions.github || cliOptions.credentials !== undefined) ? null : {
      type: (prev: any, answers: any) => {
        const instType = answers.installationType || installationType
        const hasAuth = answers.authentication !== undefined ? answers.authentication :
                       (instType === "full-panel" || instType === "auth-components")
        return hasAuth ? "multiselect" : null
      },
      name: "authProviders",
      message: "Which authentication providers do you want?",
      choices: [
        { title: "Email/Password (Credentials)", value: "credentials", selected: true },
        { title: "Google OAuth", value: "google" },
        { title: "GitHub OAuth", value: "github" },
      ],
      hint: "Space to select. Return to submit",
      instructions: false,
    },
    // Demos (skip if noDemos flag)
    cliOptions.noDemos ? null : {
      type: (prev: any, answers: any) => {
        const instType = answers.installationType || installationType
        return instType === "full-panel" ? "confirm" : null
      },
      name: "demos",
      message: "Do you want to include demo pages? (recommended for learning)",
      initial: true,
    },
    {
      type: (prev: boolean, answers: any) => {
        const instType = answers.installationType || installationType
        return prev && instType === "full-panel" ? "multiselect" : null
      },
      name: "demoTypes",
      message: "Which demos do you want to include?",
      choices: [
        { title: "Form Builder Demo", value: "form", selected: true },
        { title: "Data Table Demo", value: "table", selected: true },
        { title: "Notification Demo", value: "notification", selected: true },
      ],
      hint: "Space to select. Return to submit",
      instructions: false,
    },
    // Git (skip if disableGit flag)
    cliOptions.disableGit ? null : {
      type: "confirm" as const,
      name: "initGit",
      message: "Initialize a git repository?",
      initial: true,
    },
  ].filter(Boolean) // Remove null entries

  try {
    const promptAnswers = await prompts(questions as any, {
      onCancel: () => {
        throw new Error("User cancelled the operation")
      },
    })

    // Merge CLI options with prompt answers
    const answers: InitAnswers = {
      projectName: initialProjectName || promptAnswers.projectName || defaultProjectName,
      installationType: promptAnswers.installationType || installationType,
      packageManager: promptAnswers.packageManager || packageManager,
      authentication: false,
      authProviders: promptAnswers.authProviders || authProviders,
      demos: promptAnswers.demos !== undefined ? promptAnswers.demos : (cliOptions.noDemos ? false : installationType === "full-panel"),
      demoTypes: promptAnswers.demoTypes || (cliOptions.noDemos ? [] : ["form", "table", "notification"]),
      initGit: promptAnswers.initGit !== undefined ? promptAnswers.initGit : !cliOptions.disableGit,
      skipInstall: cliOptions.skipInstall || false,
    }

    // Set authentication based on installation type or noAuth flag
    if (cliOptions.noAuth) {
      answers.authentication = false
    } else if (answers.installationType === "full-panel" || answers.installationType === "auth-components") {
      answers.authentication = true
    } else {
      answers.authentication = promptAnswers.authentication || false
    }

    // Ensure auth providers has at least credentials if authentication is enabled
    if (answers.authentication && answers.authProviders.length === 0) {
      answers.authProviders = ["credentials"]
    }

    return answers
  } catch (error) {
    return null
  }
}

export async function promptAppName(): Promise<string> {
  const answer = await prompts({
    type: "text",
    name: "appName",
    message: "What is your application name?",
    initial: "My Admin Panel",
  })

  return answer.appName || "My Admin Panel"
}
