import { execSync } from "child_process"
import fs from "fs-extra"
import path from "path"

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun"

/**
 * Detect which package manager the user has available
 */
export function detectPackageManager(): PackageManager {
  try {
    execSync("pnpm --version", { stdio: "ignore" })
    return "pnpm"
  } catch {
    // pnpm not available
  }

  try {
    execSync("yarn --version", { stdio: "ignore" })
    return "yarn"
  } catch {
    // yarn not available
  }

  try {
    execSync("bun --version", { stdio: "ignore" })
    return "bun"
  } catch {
    // bun not available
  }

  return "npm" // default fallback
}

/**
 * Check if a package manager is available
 */
export function isPackageManagerAvailable(pm: PackageManager): boolean {
  try {
    execSync(`${pm} --version`, { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

/**
 * Install dependencies using the specified package manager
 */
export async function installDependencies(
  projectDir: string,
  packageManager: PackageManager,
  localPackagePath?: string
): Promise<void> {
  // If local package path is provided, install from tarball
  if (localPackagePath && await fs.pathExists(localPackagePath)) {
    const installLocalCommand = getInstallLocalCommand(packageManager, localPackagePath)
    execSync(installLocalCommand, {
      cwd: projectDir,
      stdio: "inherit",
    })
  } else {
    const installCommand = getInstallCommand(packageManager)
    execSync(installCommand, {
      cwd: projectDir,
      stdio: "inherit",
    })
  }
}

/**
 * Get the install command for a package manager
 */
export function getInstallCommand(packageManager: PackageManager): string {
  switch (packageManager) {
    case "npm":
      return "npm install"
    case "pnpm":
      return "pnpm install"
    case "yarn":
      return "yarn install"
    case "bun":
      return "bun install"
  }
}

/**
 * Get the install command for a local package
 */
export function getInstallLocalCommand(packageManager: PackageManager, packagePath: string): string {
  switch (packageManager) {
    case "npm":
      return `npm install ${packagePath}`
    case "pnpm":
      return `pnpm add ${packagePath}`
    case "yarn":
      return `yarn add ${packagePath}`
    case "bun":
      return `bun add ${packagePath}`
  }
}

/**
 * Get the dev command for a package manager
 */
export function getDevCommand(packageManager: PackageManager): string {
  switch (packageManager) {
    case "npm":
      return "npm run dev"
    case "pnpm":
      return "pnpm dev"
    case "yarn":
      return "yarn dev"
    case "bun":
      return "bun dev"
  }
}

/**
 * Update package.json with required dependencies
 */
export async function updatePackageJson(
  projectDir: string,
  options: {
    authentication: boolean
  }
): Promise<void> {
  const packageJsonPath = path.join(projectDir, "package.json")

  if (!(await fs.pathExists(packageJsonPath))) {
    throw new Error("package.json not found")
  }

  const packageJson = await fs.readJson(packageJsonPath)

  // Base dependencies are already in the template
  // Only add conditional dependencies here

  if (options.authentication) {
    packageJson.dependencies["next-auth"] = "^4.24.11"
  }

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
}

/**
 * Get lock file name for package manager
 */
export function getLockFileName(packageManager: PackageManager): string {
  switch (packageManager) {
    case "npm":
      return "package-lock.json"
    case "pnpm":
      return "pnpm-lock.yaml"
    case "yarn":
      return "yarn.lock"
    case "bun":
      return "bun.lockb"
  }
}
