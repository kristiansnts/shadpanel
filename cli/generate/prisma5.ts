/** Prisma 5-era previewFeatures that Prisma 6.18 must not re-emit. */
export const PRISMA5_PREVIEW_FEATURES = [
  "jsonProtocol",
  "filterJson",
  "interactiveTransactions",
  "referentialIntegrity",
] as const

export type Prisma5Input = {
  packageJson?: {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  schema?: string
  templateContent?: string
}

function majorFromSpec(spec: string | undefined): number | null {
  if (!spec) return null
  const match = spec.match(/(\d+)/)
  return match ? Number(match[1]) : null
}

function packageLooksLikePrisma5(packageJson: Prisma5Input["packageJson"]): boolean {
  if (!packageJson) return false
  const specs = [
    packageJson.dependencies?.prisma,
    packageJson.dependencies?.["@prisma/client"],
    packageJson.devDependencies?.prisma,
    packageJson.devDependencies?.["@prisma/client"],
  ]
  return specs.some((spec) => majorFromSpec(spec) === 5)
}

function schemaHasPrisma5PreviewFeatures(schema: string | undefined): boolean {
  if (!schema) return false
  return PRISMA5_PREVIEW_FEATURES.some((feature) => {
    const re = new RegExp(`previewFeatures\\s*=\\s*\\[[^\\]]*\\b${feature}\\b`, "i")
    return re.test(schema)
  })
}

function isLegacyUrlTemplate(content: string | undefined): boolean {
  if (!content) return false
  return content.includes("{{DATABASE_URL}}")
}

/**
 * Detect a Prisma 5 (or 1.3.1 leftover template) project.
 * Callers must still emit Prisma 6 — never a Prisma 5 schema.
 */
export function looksLikePrisma5(input: Prisma5Input): boolean {
  return prisma5Warnings(input).length > 0
}

export function prisma5Warnings(input: Prisma5Input): string[] {
  const warnings: string[] = []

  if (packageLooksLikePrisma5(input.packageJson)) {
    warnings.push(
      "This project pins prisma / @prisma/client major 5. ShadPanel 1.4.0 emits Prisma 6.18 only."
    )
  }

  if (schemaHasPrisma5PreviewFeatures(input.schema)) {
    warnings.push(
      `Existing schema uses Prisma 5 previewFeatures (${PRISMA5_PREVIEW_FEATURES.join(", ")}). They will not be re-emitted.`
    )
  }

  if (isLegacyUrlTemplate(input.templateContent) || isLegacyUrlTemplate(input.schema)) {
    warnings.push(
      "Found a 1.3.1-style schema.prisma.template with {{DATABASE_URL}} placeholders. That file is obsolete; ShadPanel writes prisma/schema.prisma with url = env(\"DATABASE_URL\")."
    )
  }

  return warnings
}

export function warnPrisma5(warnings: string[], log?: (message: string) => void): void {
  for (const warning of warnings) {
    log?.(warning)
    console.error(warning)
  }
}
