export const SEED_RELATIVE_PATH = "prisma/seed.ts"
export const PRISMA_SEED_COMMAND = "npx tsx prisma/seed.ts"
export const TSX_DEV_DEP = "^4.20.0"

/**
 * Stub seed. No sample users, emails, or passwords.
 */
export function emitSeed(): string {
  return `import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Add seed data here.
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
`
}

export type PackageJsonLike = {
  prisma?: { seed?: string; [key: string]: unknown }
  devDependencies?: Record<string, string>
  [key: string]: unknown
}

/**
 * Add `prisma.seed` without clobbering other package.json keys.
 * If `prisma.seed` already exists, leave it alone.
 */
export function patchPrismaSeedConfig(pkg: PackageJsonLike): {
  pkg: PackageJsonLike
  changed: boolean
} {
  if (pkg.prisma?.seed) {
    return { pkg, changed: false }
  }

  return {
    pkg: {
      ...pkg,
      prisma: {
        ...(pkg.prisma || {}),
        seed: PRISMA_SEED_COMMAND,
      },
    },
    changed: true,
  }
}

export function ensureTsxDevDependency(pkg: PackageJsonLike): {
  pkg: PackageJsonLike
  changed: boolean
} {
  if (pkg.devDependencies?.tsx) {
    return { pkg, changed: false }
  }

  return {
    pkg: {
      ...pkg,
      devDependencies: {
        ...(pkg.devDependencies || {}),
        tsx: TSX_DEV_DEP,
      },
    },
    changed: true,
  }
}
