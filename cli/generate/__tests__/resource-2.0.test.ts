import { describe, expect, it } from "vitest"
import { emitResource } from "../emit-resource"
import { parsePrismaSchema } from "../parse-prisma"

const SCHEMA = `
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
`

function emit(modelName: string) {
  const { enums, models } = parsePrismaSchema(SCHEMA)
  return emitResource({
    modelName,
    fields: models[modelName],
    enums,
    models,
    resourceName: modelName,
  })
}

function file(files: ReturnType<typeof emitResource>, suffix: string) {
  const found = files.find((f) => f.relativePath.endsWith(suffix))
  expect(found, `missing ${suffix}`).toBeDefined()
  return found!.content
}

describe("Resource 2.0 emit (BR-20260901-1)", () => {
  it("Post create/edit use a belongsTo FormSelect of authors, not a raw authorId input", () => {
    const files = emit("Post")
    const create = file(files, "create/page.tsx")
    const edit = file(files, "edit/[id]/page.tsx")
    const actions = file(files, "actions.ts")

    for (const source of [create, edit]) {
      expect(source).toContain("FormSelect accessor='authorId'")
      expect(source).toContain("label='Author'")
      expect(source).toContain("options={userOptions}")
      expect(source).toContain("getUserOptions")
      expect(source).toContain("r.name")
      expect(source).not.toContain("FormInput accessor='authorId'")
      expect(source).not.toMatch(/FormInput accessor='authorId'[\s\S]{0,60}numeric/)
      expect(source).not.toContain("accessor='tags'")
      expect(source).not.toContain("FormSelect accessor='tags'")
    }

    expect(create).toContain("FormSelect accessor='status'")
    expect(create).toContain("DRAFT")
    expect(create).toContain("PUBLISHED")

    expect(actions).toContain("export async function getUserOptions")
    expect(actions).toContain("prisma.user.findMany")
    expect(actions).toContain("include: { author: true, tags: true }")
  })

  it("User view lists hasMany posts and does not drop the relation", () => {
    const files = emit("User")
    const view = file(files, "view/[id]/page.tsx")
    const create = file(files, "create/page.tsx")
    const list = file(files, "page.tsx")

    expect(view).toContain("data-relation='posts'")
    expect(view).toContain("data-relation-kind='hasMany'")
    expect(view).toContain("row.posts")
    expect(view).toContain("No posts")
    expect(view).toContain("item.title")

    expect(create).not.toContain("FormSelect accessor='posts'")
    expect(create).not.toContain("accessor='posts'")

    expect(list).toContain("view/")
    expect(list).toContain("label='View'")
  })

  it("Post view lists M2M tags and does not silently drop them", () => {
    const files = emit("Post")
    const view = file(files, "view/[id]/page.tsx")
    const create = file(files, "create/page.tsx")

    expect(view).toContain("data-relation='tags'")
    expect(view).toContain("data-relation-kind='manyToMany'")
    expect(view).toContain("row.tags")
    expect(view).toContain("No tags")
    expect(create).not.toContain("FormSelect accessor='tags'")
  })

  it("does not emit a User.roles M2M when roleId is a lone scalar", () => {
    const schema = `
model User {
  id     Int    @id @default(autoincrement())
  email  String
  roleId Int
}
`
    const { enums, models } = parsePrismaSchema(schema)
    const files = emitResource({
      modelName: "User",
      fields: models.User,
      enums,
      models,
      resourceName: "User",
    })
    const create = file(files, "create/page.tsx")
    const view = file(files, "view/[id]/page.tsx")
    expect(create).toContain("FormInput accessor='roleId'")
    expect(create).toContain("numeric")
    expect(create).not.toContain("FormSelect accessor='roleId'")
    expect(view).not.toContain("data-relation='roles'")
    expect(view).not.toContain("manyToMany")
  })
})
