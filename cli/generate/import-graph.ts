const ALLOWED_EXTERNALS = new Set([
  "react",
  "react-dom",
  "next",
  "next/cache",
  "next/navigation",
  "next/headers",
  "next/link",
  "next/image",
  "better-auth",
  "better-auth/react",
  "better-auth/next-js",
  "better-auth/adapters/prisma",
  "better-auth/cookies",
  "@prisma/client",
  "lucide-react",
  "sonner",
])

const IMPORT_RE = /from\s+['"]([^'"]+)['"]/g

export function collectImports(source: string): string[] {
  const specifiers: string[] = []
  let match
  const re = new RegExp(IMPORT_RE.source, "g")
  while ((match = re.exec(source))) {
    specifiers.push(match[1])
  }
  return specifiers
}

export function isAllowedExternal(specifier: string): boolean {
  if (ALLOWED_EXTERNALS.has(specifier)) return true
  if (specifier.startsWith("next/")) return true
  return false
}

function extensionCandidates(base: string): string[] {
  if (/\.(ts|tsx|js|jsx)$/.test(base)) return [base]
  return [
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
    `${base}/index.js`,
  ]
}

/**
 * Resolve `@/x` or a relative specifier against a set of emitted relative paths.
 * Throws if the specifier is a project import with no matching file.
 */
export function assertResolvableImport(
  specifier: string,
  emittedFiles: string[]
): void {
  if (isAllowedExternal(specifier)) return

  const normalizedFiles = emittedFiles.map((f) => f.replace(/\\/g, "/"))

  let base: string
  if (specifier.startsWith("@/")) {
    base = specifier.slice(2)
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    throw new Error(
      `assertResolvableImport cannot resolve relative specifier "${specifier}" without a from-file. Use assertResolvableGraph.`
    )
  } else {
    throw new Error(`Unresolvable import: ${specifier}`)
  }

  const candidates = extensionCandidates(base)
  const found = candidates.some((c) => normalizedFiles.includes(c))
  if (!found) {
    throw new Error(
      `Unresolvable import: ${specifier} (looked for ${candidates.join(", ")} in emitted files)`
    )
  }
}

function resolveRelative(fromFile: string, specifier: string): string {
  const fromDir = fromFile.replace(/\\/g, "/").split("/").slice(0, -1)
  const parts = specifier.split("/")
  for (const part of parts) {
    if (part === "." || part === "") continue
    if (part === "..") fromDir.pop()
    else fromDir.push(part)
  }
  return fromDir.join("/")
}

export function assertResolvableGraph(
  files: Record<string, string>,
  options?: { allowedMissing?: string[] }
): void {
  const emitted = Object.keys(files).map((f) => f.replace(/\\/g, "/"))
  const allowedMissing = new Set(options?.allowedMissing || [])

  for (const [filePath, content] of Object.entries(files)) {
    if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) continue
    for (const specifier of collectImports(content)) {
      if (isAllowedExternal(specifier)) continue
      if (allowedMissing.has(specifier)) continue

      if (specifier.startsWith("@/")) {
        assertResolvableImport(specifier, emitted)
        continue
      }

      if (specifier.startsWith("./") || specifier.startsWith("../")) {
        const resolved = resolveRelative(filePath, specifier)
        const candidates = extensionCandidates(resolved)
        const found = candidates.some((c) => emitted.includes(c))
        if (!found) {
          throw new Error(
            `Unresolvable import: ${specifier} from ${filePath} (resolved ${resolved})`
          )
        }
        continue
      }

      throw new Error(`Unresolvable import: ${specifier} from ${filePath}`)
    }
  }
}
