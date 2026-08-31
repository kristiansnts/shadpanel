import fs from "fs-extra"
import path from "path"
import { emitSchema, SCHEMA_RELATIVE_PATH } from "../generate/emit-schema"
import { writeFile, type WriteOutcome } from "../generate/write-policy"
import { getCliSchemaTemplate } from "../generate/cli-templates"

// Load environment variables from .env file if it exists
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8')
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)/)
        if (match) {
          const key = match[1].trim()
          const value = match[2].trim().replace(/^["']|["']$/g, '')
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      })
    }
  } catch (error) {
    // Silently fail if .env doesn't exist or can't be read
  }
}

// Load environment on import
loadEnv()

type DatabaseDriver = 'mysql' | 'postgresql' | 'sqlite' | 'mongodb'

interface DatabaseCredentials {
  host?: string
  port?: string
  database?: string
  username?: string
  password?: string
  schema?: string
}

/**
 * Get database driver from environment
 * Defaults to 'mysql' if DATABASE_DRIVER is not set
 */
export function getDriver(): DatabaseDriver {
  const driver = process.env.DATABASE_DRIVER as DatabaseDriver
  return driver || 'mysql'
}

/**
 * Get database URL from environment
 * Priority:
 * 1. Use DATABASE_URL if it exists
 * 2. Construct URL from individual DATABASE_* credentials
 * 3. Fall back to default SQLite for development
 */
export function getUrl(): string {
  // Priority 1: Use DATABASE_URL directly if provided
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // Priority 2: Construct from individual credentials
  const credentials: DatabaseCredentials = {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    schema: process.env.DATABASE_SCHEMA,
  }

  const constructedUrl = constructDatabaseUrl(getDriver(), credentials)
  if (constructedUrl) {
    return constructedUrl
  }

  // Priority 3: Fall back to SQLite for development
  console.warn('No DATABASE_URL or credentials found. Using SQLite fallback.')
  return 'file:./dev.db'
}

/**
 * Construct database URL from credentials based on driver type
 */
function constructDatabaseUrl(
  driver: DatabaseDriver,
  credentials: DatabaseCredentials
): string | null {
  const { host, database } = credentials

  // Check if we have enough credentials to construct a URL
  if (!host || !database) {
    return null
  }

  switch (driver) {
    case 'mysql':
      return buildMySQLUrl(credentials)

    case 'postgresql':
      return buildPostgreSQLUrl(credentials)

    case 'mongodb':
      return buildMongoDBUrl(credentials)

    case 'sqlite':
      // SQLite doesn't use host/port, just database path
      return `file:${database}`

    default:
      console.warn(`Unsupported driver: ${driver}`)
      return null
  }
}

/**
 * Build MySQL connection URL
 */
function buildMySQLUrl(credentials: DatabaseCredentials): string {
  const { host, port = '3306', database, username, password, schema } = credentials

  const auth = username && password ? `${username}:${password}@` : ''
  const schemaParam = schema ? `?schema=${schema}` : ''

  return `mysql://${auth}${host}:${port}/${database}${schemaParam}`
}

/**
 * Build PostgreSQL connection URL
 */
function buildPostgreSQLUrl(credentials: DatabaseCredentials): string {
  const { host, port = '5432', database, username, password, schema } = credentials

  const auth = username && password ? `${username}:${password}@` : ''
  const schemaParam = schema ? `?schema=${schema}` : ''

  return `postgresql://${auth}${host}:${port}/${database}${schemaParam}`
}

/**
 * Build MongoDB connection URL
 */
function buildMongoDBUrl(credentials: DatabaseCredentials): string {
  const { host, port = '27017', database, username, password } = credentials

  const auth = username && password ? `${username}:${password}@` : ''
  const authSource = username ? '?authSource=admin' : ''

  return `mongodb://${auth}${host}:${port}/${database}${authSource}`
}

/**
 * @deprecated 1.4.0 — do not interpolate DATABASE_URL into schema.prisma.
 * Use writePrismaSchema() which emits Prisma 6 with env("DATABASE_URL").
 */
export async function generatePrismaSchema(projectDir?: string): Promise<void> {
  const baseDir = projectDir || process.cwd()
  await writePrismaSchema(baseDir, getDriver(), { force: false })
}

/**
 * Write prisma/schema.prisma from the CLI Prisma 6 emitter.
 * Never reads or writes a user-project schema.prisma.template.
 * Never interpolates credentials into the schema.
 */
export async function writePrismaSchema(
  projectDir: string,
  driver: DatabaseDriver,
  options: { force?: boolean; dryRun?: boolean } = {}
): Promise<WriteOutcome> {
  const template = await getCliSchemaTemplate()
  const content = emitSchema({ driver, template })
  const outputPath = path.join(projectDir, SCHEMA_RELATIVE_PATH)

  return writeFile({
    path: outputPath,
    content,
    force: options.force,
    dryRun: options.dryRun,
  })
}
