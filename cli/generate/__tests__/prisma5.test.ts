import { describe, expect, it } from "vitest"
import { emitSchema, schemaWritesTemplatePath } from "../emit-schema"
import { looksLikePrisma5, prisma5Warnings } from "../prisma5"

describe("emitSchema", () => {
  it("emits Prisma 6 with env DATABASE_URL and no credentials", () => {
    const schema = emitSchema({ driver: "postgresql" })
    expect(schema).toContain('url      = env("DATABASE_URL")')
    expect(schema).toContain('provider = "postgresql"')
    expect(schema).toContain('provider = "prisma-client-js"')
    expect(schema).not.toContain("{{DATABASE_URL}}")
    expect(schema).not.toContain("{{DATABASE_DRIVER}}")
    expect(schema).not.toMatch(/mysql:\/\/.*:password@/)
    expect(schema).not.toContain("previewFeatures")
    expect(schema).toMatch(/model\s+Session/)
    expect(schema).toMatch(/token\s+String/)
    expect(schemaWritesTemplatePath("prisma/schema.prisma")).toBe(false)
    expect(schemaWritesTemplatePath("prisma/schema.prisma.template")).toBe(true)
  })

  it("never returns a Prisma 5 previewFeatures block", () => {
    const schema = emitSchema({
      driver: "mysql",
      template: `datasource db {
  provider = "{{DATABASE_DRIVER}}"
  url      = "{{DATABASE_URL}}"
}
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["jsonProtocol"]
}
`,
    })
    expect(schema).not.toContain("previewFeatures")
    expect(schema).toContain('env("DATABASE_URL")')
    expect(schema).not.toContain("{{DATABASE_URL}}")
  })
})

describe("looksLikePrisma5", () => {
  it("is true for prisma 5.22.0 and jsonProtocol previewFeatures", () => {
    expect(
      looksLikePrisma5({
        packageJson: { dependencies: { prisma: "5.22.0" } },
      })
    ).toBe(true)

    expect(
      looksLikePrisma5({
        schema: `generator client {\n  provider = "prisma-client-js"\n  previewFeatures = ["jsonProtocol"]\n}`,
      })
    ).toBe(true)
  })

  it("is false for a clean Prisma 6.18 schema", () => {
    expect(
      looksLikePrisma5({
        packageJson: {
          dependencies: { "@prisma/client": "6.18.0" },
          devDependencies: { prisma: "6.18.0" },
        },
        schema: emitSchema({ driver: "postgresql" }),
      })
    ).toBe(false)
  })

  it("warns on leftover {{DATABASE_URL}} templates", () => {
    const warnings = prisma5Warnings({
      templateContent: 'url = "{{DATABASE_URL}}"',
    })
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings.join(" ")).toContain("{{DATABASE_URL}}")
  })
})
