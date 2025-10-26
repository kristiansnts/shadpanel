import { Command } from "commander"
import { initCommand } from "./commands/init"
import packageJson from "../package.json"

const program = new Command()

program
  .name("create-shadpanel-next")
  .description("Create a new Next.js admin panel with ShadPanel")
  .version(packageJson.version)
  .argument("[project-name]", "Project directory name")
  .option("--use-npm", "Explicitly use npm as package manager")
  .option("--use-pnpm", "Explicitly use pnpm as package manager")
  .option("--use-yarn", "Explicitly use yarn as package manager")
  .option("--use-bun", "Explicitly use bun as package manager")
  .option("--skip-install", "Skip installing packages")
  .option("--disable-git", "Explicitly skip initializing a git repository")
  .option("--yes", "Use defaults for all options without prompting")
  .option("-e, --example <name>", "Bootstrap with a specific example")
  .option("--full-panel", "Install full panel with authentication (default)")
  .option("--auth-components", "Install authentication + components only")
  .option("--components-only", "Install components only")
  .option("--no-auth", "Skip authentication setup")
  .option("--google", "Include Google OAuth provider")
  .option("--github", "Include GitHub OAuth provider")
  .option("--credentials", "Include email/password authentication (default)")
  .option("--no-demos", "Skip demo pages")
  .action(async (projectName?: string, options?: any) => {
    // When used as `npx create-shadpanel-next my-app`, projectName is the first arg
    await initCommand(projectName, options)
  })

// Also support the init subcommand for backward compatibility
program
  .command("init")
  .description("Initialize a new ShadPanel project")
  .argument("[project-name]", "Project directory name")
  .option("--use-npm", "Explicitly use npm as package manager")
  .option("--use-pnpm", "Explicitly use pnpm as package manager")
  .option("--use-yarn", "Explicitly use yarn as package manager")
  .option("--use-bun", "Explicitly use bun as package manager")
  .option("--skip-install", "Skip installing packages")
  .option("--disable-git", "Explicitly skip initializing a git repository")
  .option("--yes", "Use defaults for all options without prompting")
  .option("-e, --example <name>", "Bootstrap with a specific example")
  .option("--full-panel", "Install full panel with authentication (default)")
  .option("--auth-components", "Install authentication + components only")
  .option("--components-only", "Install components only")
  .option("--no-auth", "Skip authentication setup")
  .option("--google", "Include Google OAuth provider")
  .option("--github", "Include GitHub OAuth provider")
  .option("--credentials", "Include email/password authentication (default)")
  .option("--no-demos", "Skip demo pages")
  .action(async (projectName?: string, options?: any) => {
    await initCommand(projectName, options)
  })

program.parse()
