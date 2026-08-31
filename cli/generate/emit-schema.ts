export type SchemaDriver = "mysql" | "postgresql" | "sqlite" | "mongodb"

export const SCHEMA_RELATIVE_PATH = "prisma/schema.prisma"

/**
 * Prisma 6 schema. Always `url = env("DATABASE_URL")`.
 * Never interpolates credentials. Never writes a user-project `.template`.
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

  return `datasource db {
  provider = "${driver}"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Add your models here
// Example:
// model Example {
//   id        Int      @id @default(autoincrement())
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }
`
}

export function schemaWritesTemplatePath(relativePath: string): boolean {
  return relativePath.endsWith(".template") || relativePath.includes("schema.prisma.template")
}
