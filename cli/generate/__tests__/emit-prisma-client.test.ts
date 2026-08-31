import { describe, expect, it } from "vitest"
import { emitPrismaClient, PRISMA_CLIENT_RELATIVE_PATH } from "../emit-prisma-client"
import { emitResource } from "../emit-resource"
import { parsePrismaSchema } from "../parse-prisma"
import { assertResolvableImport } from "../import-graph"

const ONE_FIELD = `
model Post {
  id    Int    @id @default(autoincrement())
  title String
}
`

describe("emitPrismaClient + resource import", () => {
  it("emits a PrismaClient singleton with export default prisma", () => {
    const source = emitPrismaClient()
    expect(source).toContain("PrismaClient")
    expect(source).toContain("export const prisma")
    expect(source).toContain("export default prisma")
    expect(source).not.toMatch(/admin123|DATABASE_URL|password/i)
  })

  it("resource actions import @/lib/prisma", () => {
    const { enums, models } = parsePrismaSchema(ONE_FIELD)
    const files = emitResource({
      modelName: "Post",
      fields: models.Post,
      enums,
      resourceName: "Post",
    })
    const actions = files.find((f) => f.relativePath.endsWith("actions.ts"))
    expect(actions?.content).toContain("import prisma from '@/lib/prisma'")
  })

  it("fails CI if actions import @/lib/prisma without emitting lib/prisma.ts", () => {
    const { enums, models } = parsePrismaSchema(ONE_FIELD)
    const files = emitResource({
      modelName: "Post",
      fields: models.Post,
      enums,
      resourceName: "Post",
    })
    const emittedPaths = files.map((f) => f.relativePath)

    expect(() => assertResolvableImport("@/lib/prisma", emittedPaths)).toThrow(
      /Unresolvable import: @\/lib\/prisma/
    )

    const withClient = [...emittedPaths, PRISMA_CLIENT_RELATIVE_PATH]
    expect(() => assertResolvableImport("@/lib/prisma", withClient)).not.toThrow()
  })

  it("locks the helper with a negative fixture that only emits actions.ts", () => {
    expect(() =>
      assertResolvableImport("@/lib/prisma", ["app/admin/dashboard/posts/actions.ts"])
    ).toThrow(/Unresolvable import/)
  })
})
