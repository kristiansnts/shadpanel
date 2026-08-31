import { BETTER_AUTH_PRISMA_MODELS } from "./better-auth-schema"

export type SchemaDriver = "mysql" | "postgresql" | "sqlite" | "mongodb"

export const SCHEMA_RELATIVE_PATH = "prisma/schema.prisma"

function fallbackSchema(driver: SchemaDriver): string {
  return `datasource db {
  provider = "${driver}"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

${BETTER_AUTH_PRISMA_MODELS}
// Add your resource models here
// Example:
// model Example {
//   id        Int      @id @default(autoincrement())
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }
`
}

/**
 * Prisma 6 schema. Always `url = env("DATABASE_URL")`.
 * Never interpolates credentials. Never writes a user-project `.template`.
 * Includes Better Auth Prisma-adapter models (session/account/verification).
 */
export function emitSchema(options: { driver: SchemaDriver; template?: string }): string {
  const driver = options.driver

  if (options.template) {
    return options.template
      .replace(/\{\{DATABASE_DRIVER\}\}/g, driver)
      .replace(/url\s*=\s*"\{\{DATABASE_URL\}\}"/g, 'url      = env("DATABASE_URL")')
      .replace(/\{\{DATABASE_URL\}\}/g, 'env("DATABASE_URL")')
      .replace(/\n?\s*previewFeatures\s*=\s*\[[^\]]*\]/g, "")
  }

  return fallbackSchema(driver)
}

export function schemaWritesTemplatePath(relativePath: string): boolean {
  return relativePath.endsWith(".template") || relativePath.includes("schema.prisma.template")
}
