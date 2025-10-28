import { Command } from "commander"
import { initCommand } from "./commands/init"
import { prismaCommand } from "./commands/prisma"
import packageJson from "../package.json"

const program = new Command()

program
  .name("shadpanel")
  .description("ShadPanel CLI - Build admin panels with Next.js and shadcn/ui")
  .version(packageJson.version)

// shadpanel init - Initialize new project with create-shadpanel-next
program
  .command("init")
  .description("Initialize a new ShadPanel project")
  .argument("[project-name]", "Project directory name")
  .action(initCommand)

// Register prisma/db commands (shadpanel db:init, etc.)
program.addCommand(prismaCommand())

program.parse()
