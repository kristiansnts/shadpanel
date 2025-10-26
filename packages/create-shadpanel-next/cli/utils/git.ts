import { execSync } from "child_process"
import fs from "fs-extra"
import path from "path"

/**
 * Check if git is available on the system
 */
export function isGitAvailable(): boolean {
  try {
    execSync("git --version", { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

/**
 * Initialize a git repository
 */
export async function initGitRepository(projectDir: string): Promise<void> {
  if (!isGitAvailable()) {
    throw new Error("Git is not available on this system")
  }

  // Initialize git
  execSync("git init", {
    cwd: projectDir,
    stdio: "ignore",
  })

  // Add all files
  execSync("git add .", {
    cwd: projectDir,
    stdio: "ignore",
  })

  // Create initial commit
  execSync('git commit -m "Initial commit from ShadPanel CLI"', {
    cwd: projectDir,
    stdio: "ignore",
  })
}

/**
 * Check if the directory is already a git repository
 */
export async function isGitRepository(dir: string): Promise<boolean> {
  const gitDir = path.join(dir, ".git")
  return await fs.pathExists(gitDir)
}
