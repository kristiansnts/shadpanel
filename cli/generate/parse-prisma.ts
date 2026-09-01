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

export type RelationKind = "belongsTo" | "hasMany" | "manyToMany"

export type Field = {
  name: string
  type: string
  required: boolean
  isId: boolean
  isRelation: boolean
  isEnum: boolean
  default?: string
  isList?: boolean
  isForeignKey?: boolean
  relationKind?: RelationKind
  relationFromFields?: string[]
  relationToFields?: string[]
  relationName?: string
}

export function parseRelationAttribute(line: string): {
  relationName?: string
  relationFromFields?: string[]
  relationToFields?: string[]
} {
  const match = line.match(/@relation\s*\((.*)\)/)
  if (!match) return {}
  const args = match[1]
  const nameMatch = args.match(/"([^"]+)"/)
  const fieldsMatch = args.match(/fields:\s*\[([^\]]*)\]/)
  const refsMatch = args.match(/references:\s*\[([^\]]*)\]/)
  const splitIds = (raw?: string) =>
    raw
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  const relationFromFields = splitIds(fieldsMatch?.[1])
  const relationToFields = splitIds(refsMatch?.[1])
  return {
    relationName: nameMatch?.[1],
    ...(relationFromFields?.length ? { relationFromFields } : {}),
    ...(relationToFields?.length ? { relationToFields } : {}),
  }
}

function sameRelationName(a?: string, b?: string): boolean {
  return (a || undefined) === (b || undefined)
}

/**
 * DMMF-like classification from parsed fields:
 * - belongsTo: this side owns `fields: [...]` (n:1 FK)
 * - manyToMany: both sides are lists without `fields`
 * - hasMany: list (or 1:1 inverse) without `fields`, opposite of a belongsTo
 */
export function classifyRelations(models: Record<string, Field[]>): void {
  for (const fields of Object.values(models)) {
    for (const field of fields) {
      field.isForeignKey = false
    }
  }

  for (const [modelName, fields] of Object.entries(models)) {
    for (const field of fields) {
      if (!field.isRelation) continue

      if (field.relationFromFields?.length) {
        field.relationKind = "belongsTo"
        for (const fkName of field.relationFromFields) {
          const fk = fields.find((f) => f.name === fkName)
          if (fk) fk.isForeignKey = true
        }
        continue
      }

      if (!field.isList && !field.relationFromFields?.length) {
        // 1:1 inverse (non-FK side) — view as a 0–1 related record, not a form input
        field.relationKind = "hasMany"
        continue
      }

      const related = models[field.type] || []
      const backs = related.filter(
        (f) =>
          f.isRelation &&
          f.type === modelName &&
          sameRelationName(f.relationName, field.relationName) &&
          !(modelName === field.type && f.name === field.name)
      )
      const implicitManyToMany = backs.some(
        (f) => f.isList && !f.relationFromFields?.length
      )
      field.relationKind = implicitManyToMany ? "manyToMany" : "hasMany"
    }
  }
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
      const stripped = ftypeRaw.replace(/\?$/, "")
      const isList = stripped.endsWith("[]")
      const ftype = stripped.replace(/\[\]$/, "")
      const isId = /@id\b/.test(line)
      const defaultMatch = line.match(/@default\(([^)]+)\)/)
      const isEnum = !!enums[ftype]
      const isRelation = !SCALAR_TYPES.has(ftype) && !isEnum
      const relation = isRelation ? parseRelationAttribute(line) : {}

      fields.push({
        name: fname,
        type: ftype,
        required,
        isId,
        isRelation,
        isEnum,
        isList,
        isForeignKey: false,
        default: defaultMatch ? defaultMatch[1] : undefined,
        ...relation,
      })
    }
    models[modelName] = fields
  }

  classifyRelations(models)
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

export function idFieldName(fields: Field[] | undefined): string {
  if (!fields?.length) return "id"
  return fields.find((f) => f.isId)?.name || fields.find((f) => f.name === "id")?.name || "id"
}
