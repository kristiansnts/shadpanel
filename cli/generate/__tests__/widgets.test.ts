import { describe, expect, it } from "vitest"
import { parsePrismaSchema } from "../parse-prisma"
import { mapScalarWidget, pickRelationLabelField } from "../widgets"

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
  tags      Tag[]
}
model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String
  posts Post[]
}
model Tag {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}
model Role {
  id    Int    @id @default(autoincrement())
  title String
  users User[]
}
`

const CASES: Array<{
  name: string
  kind: string
  reason?: string
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
  {
    name: "author",
    kind: "FormSelect",
    jsxIncludes: ["FormSelect", "accessor='authorId'", "label='Author'", "userOptions"],
    jsxExcludes: ["FormInput", "numeric"],
  },
  { name: "authorId", kind: "skip", reason: "fk", jsxExcludes: ["FormInput", "FormSelect"] },
  { name: "tags", kind: "skip", reason: "manyToMany" },
]

describe("mapScalarWidget", () => {
  const { enums, models } = parsePrismaSchema(POST_SCHEMA)
  const ctx = { models, modelName: "Post" }
  const byName = Object.fromEntries(models.Post.map((f) => [f.name, f]))

  it.each(CASES)("$name → $kind", ({ name, kind, reason, jsxIncludes, jsxExcludes }) => {
    const widget = mapScalarWidget(byName[name], enums, ctx)
    expect(widget.kind).toBe(kind)
    if (reason) expect(widget.reason).toBe(reason)
    for (const snippet of jsxIncludes || []) {
      expect(widget.jsx).toContain(snippet)
    }
    for (const snippet of jsxExcludes || []) {
      expect(widget.jsx).not.toContain(snippet)
    }
  })

  it("maps belongsTo to FormSelect of related records, not a raw FK FormInput", () => {
    const widget = mapScalarWidget(byName.author, enums, ctx)
    expect(widget.kind).toBe("FormSelect")
    expect(widget.accessor).toBe("authorId")
    expect(widget.relation?.kind).toBe("belongsTo")
    expect(widget.relation?.labelField).toBe("name")
    expect(widget.jsx).toContain("FormSelect")
    expect(widget.jsx).not.toContain("FormInput")
    expect(widget.jsx).not.toContain("numeric")

    const fk = mapScalarWidget(byName.authorId, enums, ctx)
    expect(fk.kind).toBe("skip")
    expect(fk.reason).toBe("fk")
  })

  it("maps hasMany to a view-list skip (not a create/edit FormSelect)", () => {
    const posts = models.User.find((f) => f.name === "posts")!
    const widget = mapScalarWidget(posts, enums, { models, modelName: "User" })
    expect(widget.kind).toBe("skip")
    expect(widget.reason).toBe("hasMany")
    expect(widget.relation?.kind).toBe("hasMany")
    expect(widget.jsx).not.toContain("FormSelect")
  })

  it("maps M2M to a view-list skip (not a create/edit FormSelect)", () => {
    const tags = mapScalarWidget(byName.tags, enums, ctx)
    expect(tags.kind).toBe("skip")
    expect(tags.reason).toBe("manyToMany")
    expect(tags.jsx).not.toContain("FormSelect")
  })

  it("keeps enum FormSelect static (unchanged)", () => {
    const widget = mapScalarWidget(byName.status, enums, ctx)
    expect(widget.kind).toBe("FormSelect")
    expect(widget.jsx).toContain("DRAFT")
    expect(widget.jsx).toContain("PUBLISHED")
    expect(widget.jsx).toContain("options={[")
    expect(widget.relation).toBeUndefined()
  })

  it("leaves a lone roleId scalar as FormInput, not a Role M2M picker", () => {
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
    expect(roleId.jsx).toContain("FormInput")
    expect(roleId.jsx).toContain("numeric")
    expect(roleId.jsx).not.toContain("FormSelect")
    expect(roleId.relation).toBeUndefined()
  })

  it("maps a belongsTo Role to a single FormSelect (not M2M RBAC)", () => {
    const schema = `
model User {
  id     Int  @id
  role   Role @relation(fields: [roleId], references: [id])
  roleId Int
}
model Role {
  id    Int    @id
  name  String
  users User[]
}
`
    const parsed = parsePrismaSchema(schema)
    const role = parsed.models.User.find((f) => f.name === "role")!
    const widget = mapScalarWidget(role, parsed.enums, {
      models: parsed.models,
      modelName: "User",
    })
    expect(widget.kind).toBe("FormSelect")
    expect(widget.accessor).toBe("roleId")
    expect(widget.relation?.kind).toBe("belongsTo")
    expect(widget.relation?.relatedModel).toBe("Role")
    expect(widget.jsx).not.toContain("multiple")
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

describe("pickRelationLabelField", () => {
  it("picks the first of name/title/email/label string scalars, else id", () => {
    const { models } = parsePrismaSchema(POST_SCHEMA)
    expect(pickRelationLabelField(models.User)).toBe("name")
    expect(pickRelationLabelField(models.Tag)).toBe("name")
    expect(pickRelationLabelField(models.Role)).toBe("title")
    expect(
      pickRelationLabelField([
        { name: "id", type: "Int", required: true, isId: true, isRelation: false, isEnum: false },
        { name: "email", type: "String", required: true, isId: false, isRelation: false, isEnum: false },
      ])
    ).toBe("email")
    expect(
      pickRelationLabelField([
        { name: "id", type: "Int", required: true, isId: true, isRelation: false, isEnum: false },
      ])
    ).toBe("id")
  })
})
