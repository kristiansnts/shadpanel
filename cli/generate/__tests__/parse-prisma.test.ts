import { describe, expect, it } from "vitest"
import { findModelName, parsePrismaSchema } from "../parse-prisma"

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
model User {
  id    Int    @id @default(autoincrement())
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
