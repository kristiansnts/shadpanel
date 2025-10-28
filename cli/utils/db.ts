import fs from "fs-extra"
import path from "path"

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
 * Generate Prisma schema from template
 */
export async function generatePrismaSchema(projectDir?: string): Promise<void> {
  const baseDir = projectDir || process.cwd()
  const templatePath = path.join(baseDir, 'prisma', 'schema.prisma.template')
  const outputPath = path.join(baseDir, 'prisma', 'schema.prisma')

  // Get database configuration
  const driver = getDriver()
  const url = getUrl()

  console.log(`📊 Database Driver: ${driver}`)
  console.log(`🔗 Database URL: ${url.substring(0, 20)}...`)

  // Check if template exists
  if (!(await fs.pathExists(templatePath))) {
    console.warn(`⚠️  Template file not found: ${templatePath}`)
    console.log('Creating default template...')

    // Create a basic template
    const defaultTemplate = `datasource db {
  provider = "{{DATABASE_DRIVER}}"
  url      = "{{DATABASE_URL}}"
}

generator client {
  provider = "prisma-client-js"
}

// Add your models here
`
    await fs.ensureDir(path.dirname(templatePath))
    await fs.writeFile(templatePath, defaultTemplate)
  }

  // Read the template
  let schemaContent = await fs.readFile(templatePath, 'utf-8')

  // Replace placeholders
  schemaContent = schemaContent
    .replace(/\{\{DATABASE_DRIVER\}\}/g, driver)
    .replace(/\{\{DATABASE_URL\}\}/g, url)

  // Write the generated schema
  await fs.ensureDir(path.dirname(outputPath))
  await fs.writeFile(outputPath, schemaContent)

  console.log(`✅ Generated: ${outputPath}`)
}
