import fs from "fs-extra"
import path from "path"

export interface TemplateVariables {
  APP_NAME: string
  PROJECT_NAME: string
  SHADPANEL_VERSION: string
  NEXTAUTH_SECRET: string
  GOOGLE: boolean
  GITHUB: boolean
  CREDENTIALS: boolean
}

/**
 * Copy template files to the target directory
 */
export async function copyTemplateFiles(
  templateDir: string,
  targetDir: string,
  variables: TemplateVariables
): Promise<void> {
  await fs.ensureDir(targetDir)

  const files = await fs.readdir(templateDir, { withFileTypes: true })

  for (const file of files) {
    const sourcePath = path.join(templateDir, file.name)
    const targetPath = path.join(targetDir, file.name)

    if (file.isDirectory()) {
      // Recursively copy directories
      await copyTemplateFiles(sourcePath, targetPath, variables)
    } else if (file.isFile()) {
      // Read file content
      let content = await fs.readFile(sourcePath, "utf-8")

      // Process template variables
      content = processTemplate(content, variables)

      // Write to target
      await fs.ensureDir(path.dirname(targetPath))
      await fs.writeFile(targetPath, content, "utf-8")
    }
  }
}

/**
 * Process template placeholders and conditional blocks
 */
export function processTemplate(
  content: string,
  variables: TemplateVariables
): string {
  let processed = content

  // Replace simple placeholders
  processed = processed.replace(/\{\{APP_NAME\}\}/g, variables.APP_NAME)
  processed = processed.replace(/\{\{PROJECT_NAME\}\}/g, variables.PROJECT_NAME)
  processed = processed.replace(
    /\{\{SHADPANEL_VERSION\}\}/g,
    variables.SHADPANEL_VERSION
  )
  processed = processed.replace(
    /\{\{NEXTAUTH_SECRET\}\}/g,
    variables.NEXTAUTH_SECRET
  )

  // Process conditional blocks
  processed = processConditional(processed, "GOOGLE", variables.GOOGLE)
  processed = processConditional(processed, "GITHUB", variables.GITHUB)
  processed = processConditional(processed, "CREDENTIALS", variables.CREDENTIALS)

  return processed
}

/**
 * Process conditional blocks like {{#GOOGLE}}...{{/GOOGLE}}
 */
function processConditional(
  content: string,
  key: string,
  include: boolean
): string {
  const startTag = `{{#${key}}}`
  const endTag = `{{/${key}}}`
  const regex = new RegExp(
    `${escapeRegex(startTag)}([\\s\\S]*?)${escapeRegex(endTag)}`,
    "g"
  )

  if (include) {
    // Keep the content, remove the tags
    return content.replace(regex, "$1")
  } else {
    // Remove the entire block
    return content.replace(regex, "")
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Merge multiple template files into one target
 * Used for combining base + auth/demo configurations
 */
export async function mergeTemplates(
  baseContent: string,
  additionalContent: string,
  mergeType: "append" | "prepend" | "replace" = "append"
): Promise<string> {
  switch (mergeType) {
    case "append":
      return baseContent + "\n" + additionalContent
    case "prepend":
      return additionalContent + "\n" + baseContent
    case "replace":
      return additionalContent
    default:
      return baseContent
  }
}

/**
 * Copy base template files
 */
export async function copyBaseTemplate(
  templatesDir: string,
  targetDir: string,
  variables: TemplateVariables
): Promise<void> {
  const baseDir = path.join(templatesDir, "base")
  await copyTemplateFiles(baseDir, targetDir, variables)
}

/**
 * Copy auth template files
 */
export async function copyAuthTemplate(
  templatesDir: string,
  targetDir: string,
  variables: TemplateVariables
): Promise<void> {
  const authDir = path.join(templatesDir, "auth")
  await copyTemplateFiles(authDir, targetDir, variables)
}

/**
 * Copy demo template files
 */
export async function copyDemoTemplate(
  templatesDir: string,
  targetDir: string,
  variables: TemplateVariables
): Promise<void> {
  const demoDir = path.join(templatesDir, "demo")
  await copyTemplateFiles(demoDir, targetDir, variables)
}

/**
 * Copy config template files
 */
export async function copyConfigTemplate(
  templatesDir: string,
  targetDir: string,
  variables: TemplateVariables
): Promise<void> {
  const configDir = path.join(templatesDir, "config")

  const files = await fs.readdir(configDir, { withFileTypes: true })

  for (const file of files) {
    const sourcePath = path.join(configDir, file.name)

    // Handle special files
    let targetFileName = file.name
    let targetPath = path.join(targetDir, targetFileName)

    // package.json.template -> package.json
    if (file.name === "package.json.template") {
      targetFileName = "package.json"
      targetPath = path.join(targetDir, targetFileName)
    }

    // globals.css -> app/globals.css
    if (file.name === "globals.css") {
      targetPath = path.join(targetDir, "app", "globals.css")
      await fs.ensureDir(path.join(targetDir, "app"))
    }

    if (file.isFile()) {
      let content = await fs.readFile(sourcePath, "utf-8")
      content = processTemplate(content, variables)
      await fs.writeFile(targetPath, content, "utf-8")
    }
  }
}

/**
 * Create .env file from .env.example
 */
export async function createEnvFile(targetDir: string): Promise<void> {
  const examplePath = path.join(targetDir, ".env.example")
  const envPath = path.join(targetDir, ".env")

  if (await fs.pathExists(examplePath)) {
    await fs.copy(examplePath, envPath)
  }
}

/**
 * Merge menu configurations when demos are included
 */
export async function mergeMenuConfigs(
  targetDir: string,
  includeDemos: boolean
): Promise<void> {
  if (!includeDemos) return

  const baseMenuPath = path.join(targetDir, "config", "menu.ts")
  const demoMenuPath = path.join(targetDir, "config", "menu-demo.ts")

  if (await fs.pathExists(demoMenuPath)) {
    const demoContent = await fs.readFile(demoMenuPath, "utf-8")
    await fs.writeFile(baseMenuPath, demoContent, "utf-8")
    await fs.remove(demoMenuPath)
  }
}

/**
 * Copy UI components from the package to the target project
 */
export async function copyUIComponents(
  packageDir: string,
  targetDir: string
): Promise<void> {
  const sourceComponentsDir = path.join(packageDir, "components")
  const targetComponentsDir = path.join(targetDir, "components")

  if (!(await fs.pathExists(sourceComponentsDir))) {
    throw new Error("Components directory not found in package")
  }

  // Copy all UI components
  await fs.copy(sourceComponentsDir, targetComponentsDir, {
    overwrite: false,
    errorOnExist: false,
  })
}

/**
 * Copy lib utilities from the package to the target project
 */
export async function copyLibUtils(
  packageDir: string,
  targetDir: string
): Promise<void> {
  const sourceLibDir = path.join(packageDir, "lib")
  const targetLibDir = path.join(targetDir, "lib")

  if (await fs.pathExists(sourceLibDir)) {
    await fs.copy(sourceLibDir, targetLibDir, {
      overwrite: false,
      errorOnExist: false,
    })
  }
}

/**
 * Copy hooks from the package to the target project
 */
export async function copyHooks(
  packageDir: string,
  targetDir: string
): Promise<void> {
  const sourceHooksDir = path.join(packageDir, "hooks")
  const targetHooksDir = path.join(targetDir, "hooks")

  if (await fs.pathExists(sourceHooksDir)) {
    await fs.copy(sourceHooksDir, targetHooksDir, {
      overwrite: false,
      errorOnExist: false,
    })
  }
}
