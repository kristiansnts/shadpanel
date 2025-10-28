import { execSync } from "child_process"
import prompts from "prompts"
import { logger } from "../utils/logger"

export async function initCommand(projectName?: string): Promise<void> {
  try {
    logger.welcome()

    // Prompt for project name if not provided
    let finalProjectName = projectName

    if (!finalProjectName) {
      const response = await prompts({
        type: "text",
        name: "projectName",
        message: "What is your project name?",
        initial: "my-shadpanel-app",
        validate: (value: string) =>
          value.length > 0 ? true : "Project name is required",
      })

      if (!response.projectName) {
        logger.error("Project name is required")
        process.exit(1)
      }

      finalProjectName = response.projectName
    }

    // Run npx create-shadpanel-next {project-name}
    logger.info(`Creating your ShadPanel project: ${finalProjectName}`)
    logger.newline()

    const spinner = logger.spinner("Running create-shadpanel-next...")
    spinner.start()

    try {
      execSync(`npx create-shadpanel-next ${finalProjectName}`, {
        stdio: "inherit",
        cwd: process.cwd(),
      })
      spinner.succeed("Project created successfully!")
    } catch (error) {
      spinner.fail("Failed to create project")
      throw error
    }

    logger.newline()
    logger.success("✨ Done! Your ShadPanel project is ready.")
    logger.newline()
    logger.info("📚 Next steps:")
    logger.info(`   1. cd ${finalProjectName}`)
    logger.info("   2. Run 'shadpanel db:init' to set up your database (optional)")
    logger.info("   3. npm run dev")
    logger.newline()
  } catch (error) {
    logger.error("Failed to initialize project")
    console.error(error)
    process.exit(1)
  }
}
