import { describe, expect, it } from "vitest"
import { parsePrismaSchema } from "../parse-prisma"
import { mapScalarWidget } from "../widgets"

const POST_SCHEMA = `
enum Status { DRAFT PUBLISHED }
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  views     Int
  published Boolean  @default(false)
  publishedAt DateTime?
  status    Status
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
}
`

const CASES: Array<{
  name: string
  kind: string
  jsxIncludes?: string[]
  jsxExcludes?: string[]
}> = [
  { name: "id", kind: "skip" },
  { name: "title", kind: "FormInput", jsxIncludes: ["FormInput", "type='text'", "required"] },
  { name: "views", kind: "FormInputNumeric", jsxIncludes: ["FormInput", "numeric"] },
  { name: "published", kind: "FormCheckbox", jsxIncludes: ["FormCheckbox"] },
  { name: "publishedAt", kind: "FormDateTimePicker", jsxIncludes: ["FormDateTimePicker"] },
  {
    name: "status",
    kind: "FormSelect",
    jsxIncludes: ["FormSelect", "DRAFT", "PUBLISHED"],
  },
  { name: "author", kind: "skip" },
  {
    name: "authorId",
    kind: "FormInputNumeric",
    jsxIncludes: ["FormInput", "numeric"],
    jsxExcludes: ["FormSelect"],
  },
]

describe("mapScalarWidget", () => {
  const { enums, models } = parsePrismaSchema(POST_SCHEMA)
  const byName = Object.fromEntries(models.Post.map((f) => [f.name, f]))

  it.each(CASES)("$name → $kind", ({ name, kind, jsxIncludes, jsxExcludes }) => {
    const widget = mapScalarWidget(byName[name], enums)
    expect(widget.kind).toBe(kind)
    for (const snippet of jsxIncludes || []) {
      expect(widget.jsx).toContain(snippet)
    }
    for (const snippet of jsxExcludes || []) {
      expect(widget.jsx).not.toContain(snippet)
    }
  })

  it("does not map FK scalars to FormSelect", () => {
    const roleId = mapScalarWidget(
      {
        name: "roleId",
        type: "Int",
        required: true,
        isId: false,
        isRelation: false,
        isEnum: false,
      },
      {}
    )
    expect(roleId.kind).toBe("FormInputNumeric")
    expect(roleId.jsx).not.toContain("FormSelect")
  })

  it("uses password input type without a default password value", () => {
    const widget = mapScalarWidget(
      {
        name: "password",
        type: "String",
        required: true,
        isId: false,
        isRelation: false,
        isEnum: false,
      },
      {}
    )
    expect(widget.jsx).toContain("type='password'")
    expect(widget.initialValue).toBe("''")
    expect(widget.initialValue).not.toMatch(/admin123|password/i)
  })

  it("maps Json to FormTextarea and Bytes to skip", () => {
    const json = mapScalarWidget(
      {
        name: "meta",
        type: "Json",
        required: false,
        isId: false,
        isRelation: false,
        isEnum: false,
      },
      {}
    )
    expect(json.kind).toBe("FormTextarea")

    const bytes = mapScalarWidget(
      {
        name: "blob",
        type: "Bytes",
        required: false,
        isId: false,
        isRelation: false,
        isEnum: false,
      },
      {}
    )
    expect(bytes.kind).toBe("skip")
    expect(bytes.reason).toBe("bytes")
    expect(bytes.jsx).toContain("Bytes field")
  })
})
