import { describe, expect, it } from "vitest"
import { findModelName, parsePrismaSchema, parseRelationAttribute } from "../parse-prisma"

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
`

describe("parsePrismaSchema", () => {
  it("parses enums, scalars, and relation heuristics", () => {
    const { enums, models } = parsePrismaSchema(POST_SCHEMA)
    expect(enums.Status).toEqual(["DRAFT", "PUBLISHED"])
    expect(models.Post).toBeDefined()

    const byName = Object.fromEntries(models.Post.map((f) => [f.name, f]))
    expect(byName.id.isId).toBe(true)
    expect(byName.title.type).toBe("String")
    expect(byName.views.type).toBe("Int")
    expect(byName.published.default).toBe("false")
    expect(byName.publishedAt.required).toBe(false)
    expect(byName.status.isEnum).toBe(true)
    expect(byName.author.isRelation).toBe(true)
    expect(byName.authorId.isRelation).toBe(false)
    expect(byName.authorId.type).toBe("Int")
  })

  it("classifies belongsTo, hasMany, and implicit M2M (DMMF-like)", () => {
    const { models } = parsePrismaSchema(POST_SCHEMA)
    const post = Object.fromEntries(models.Post.map((f) => [f.name, f]))
    const user = Object.fromEntries(models.User.map((f) => [f.name, f]))
    const tag = Object.fromEntries(models.Tag.map((f) => [f.name, f]))

    expect(post.author.relationKind).toBe("belongsTo")
    expect(post.author.relationFromFields).toEqual(["authorId"])
    expect(post.authorId.isForeignKey).toBe(true)
    expect(post.tags.relationKind).toBe("manyToMany")
    expect(post.tags.isList).toBe(true)

    expect(user.posts.relationKind).toBe("hasMany")
    expect(user.posts.isList).toBe(true)
    expect(tag.posts.relationKind).toBe("manyToMany")
  })

  it("classifies list types as relations", () => {
    const { models } = parsePrismaSchema(POST_SCHEMA)
    const posts = models.User.find((f) => f.name === "posts")
    expect(posts?.isRelation).toBe(true)
  })

  it("finds models by singular or plural name", () => {
    const { models } = parsePrismaSchema(POST_SCHEMA)
    expect(findModelName(models, "Post")).toBe("Post")
    expect(findModelName(models, "posts")).toBe("Post")
    expect(findModelName(models, "missing")).toBeUndefined()
  })
})

describe("parseRelationAttribute", () => {
  it("reads fields, references, and optional relation name", () => {
    expect(
      parseRelationAttribute(
        "author User @relation(fields: [authorId], references: [id])"
      )
    ).toEqual({
      relationFromFields: ["authorId"],
      relationToFields: ["id"],
    })
    expect(
      parseRelationAttribute(
        'parent Category? @relation("Tree", fields: [parentId], references: [id])'
      )
    ).toEqual({
      relationName: "Tree",
      relationFromFields: ["parentId"],
      relationToFields: ["id"],
    })
  })
})
