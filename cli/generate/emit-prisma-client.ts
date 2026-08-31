/**
 * User-project `lib/prisma.ts`. Default export must match
 * `import prisma from '@/lib/prisma'`.
 */
export function emitPrismaClient(): string {
  return `import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default prisma
`
}

export const PRISMA_CLIENT_RELATIVE_PATH = "lib/prisma.ts"
