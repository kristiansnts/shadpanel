import { describe, expect, it } from "vitest"
import { emitPrismaClient, PRISMA_CLIENT_RELATIVE_PATH } from "../emit-prisma-client"
import { emitResource } from "../emit-resource"
import { emitSchema } from "../emit-schema"
import { emitSeed, SEED_RELATIVE_PATH } from "../emit-seed"
import { assertResolvableGraph, collectImports } from "../import-graph"
import { parsePrismaSchema } from "../parse-prisma"

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

describe("init + one-model resource import graph", () => {
  it("emits a resolvable @/ and relative import graph", () => {
    const schema = POST_SCHEMA.includes("datasource")
      ? POST_SCHEMA
      : `${emitSchema({ driver: "postgresql" })}\n${POST_SCHEMA}`

    const { enums, models } = parsePrismaSchema(schema)
    const resourceFiles = emitResource({
      modelName: "Post",
      fields: models.Post,
      enums,
      resourceName: "Post",
    })

    const files: Record<string, string> = {
      "prisma/schema.prisma": schema,
      [PRISMA_CLIENT_RELATIVE_PATH]: emitPrismaClient(),
      [SEED_RELATIVE_PATH]: emitSeed(),
      "components/ui/index.ts": "export {}\n",
      "tsconfig.json": JSON.stringify({
        compilerOptions: { paths: { "@/*": ["./*"] } },
      }),
    }
    for (const file of resourceFiles) {
      files[file.relativePath] = file.content
    }

    expect(files[PRISMA_CLIENT_RELATIVE_PATH]).toContain("export default prisma")
    expect(
      resourceFiles.find((f) => f.relativePath.endsWith("actions.ts"))?.content
    ).toContain("import prisma from '@/lib/prisma'")

    assertResolvableGraph(files)

    const create = resourceFiles.find((f) => f.relativePath.endsWith("create/page.tsx"))
    expect(create?.content).toContain("FormDateTimePicker")
    expect(create?.content).toContain("FormSelect")
    expect(create?.content).toContain("FormCheckbox")
    expect(create?.content).not.toContain("accessor='author'")
    expect(create?.content).toContain("accessor='authorId'")
    expect(create?.content).not.toMatch(/authorId[\s\S]{0,80}FormSelect/)
  })

  it("fails when the prisma client file is omitted from the emit set", () => {
    const { enums, models } = parsePrismaSchema(POST_SCHEMA)
    const resourceFiles = emitResource({
      modelName: "Post",
      fields: models.Post,
      enums,
      resourceName: "Post",
    })
    const files: Record<string, string> = {
      "components/ui/index.ts": "export {}\n",
    }
    for (const file of resourceFiles) {
      files[file.relativePath] = file.content
    }

    expect(() => assertResolvableGraph(files)).toThrow(/@\/lib\/prisma/)
  })

  it("collects both quote styles", () => {
    expect(collectImports(`import x from '@/lib/prisma'\nimport y from "next/cache"`)).toEqual([
      "@/lib/prisma",
      "next/cache",
    ])
  })
})
