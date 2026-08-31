export const SCALAR_TYPES = new Set([
  "Int",
  "String",
  "Boolean",
  "DateTime",
  "Float",
  "Decimal",
  "Json",
  "Bytes",
])

export type Field = {
  name: string
  type: string
  required: boolean
  isId: boolean
  isRelation: boolean
  isEnum: boolean
  default?: string
}

export function parsePrismaSchema(content: string): {
  enums: Record<string, string[]>
  models: Record<string, Field[]>
} {
  const enums: Record<string, string[]> = {}
  const models: Record<string, Field[]> = {}

  // Start-of-line only so commented `// model` / `// enum` in templates are ignored.
  const enumRegex = /(?:^|\n)[ \t]*enum\s+(\w+)\s*\{([\s\S]*?)\}/g
  let m
  while ((m = enumRegex.exec(content))) {
    const name = m[1]
    const body = m[2]
    const values = body
      .split(/\n/)
      .flatMap((l) =>
        l
          .replace(/\/\/.*$/, "")
          .trim()
          .split(/\s+/)
      )
      .filter(Boolean)
    enums[name] = values
  }

  const modelRegex = /(?:^|\n)[ \t]*model\s+(\w+)\s*\{([\s\S]*?)\n[ \t]*\}/g
  while ((m = modelRegex.exec(content))) {
    const modelName = m[1]
    const body = m[2]
    const lines = body.split(/\n/)
    const fields: Field[] = []
    for (const raw of lines) {
      const line = raw.trim()
      if (!line || line.startsWith("//")) continue
      if (line.startsWith("@@")) continue
      const parts = line.split(/\s+/)
      const fname = parts[0]
      const ftypeRaw = parts[1]
      if (!fname || !ftypeRaw) continue
      const required = !ftypeRaw.endsWith("?")
      const ftype = ftypeRaw.replace(/\?$/, "")
      const isId = /@id\b/.test(line)
      const defaultMatch = line.match(/@default\(([^)]+)\)/)
      const isEnum = !!enums[ftype]
      // List types (`User[]`, `String[]`) are not scalar/enum → relation
      const isRelation = !SCALAR_TYPES.has(ftype) && !isEnum

      fields.push({
        name: fname,
        type: ftype,
        required,
        isId,
        isRelation,
        isEnum,
        default: defaultMatch ? defaultMatch[1] : undefined,
      })
    }
    models[modelName] = fields
  }

  return { enums, models }
}

export function findModelName(
  models: Record<string, Field[]>,
  name: string
): string | undefined {
  const provided = name.toLowerCase()
  const singular = provided.endsWith("s") && provided.length > 1 ? provided.slice(0, -1) : provided
  return Object.keys(models).find((m) => {
    const mLower = m.toLowerCase()
    return (
      mLower === provided ||
      mLower === singular ||
      mLower === (provided.endsWith("s") ? provided.slice(0, -1) : `${provided}s`)
    )
  })
}
