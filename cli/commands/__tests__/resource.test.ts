import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { runResource } from "../resource"

const SCHEMA = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Status { DRAFT PUBLISHED }
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  views     Int
  published Boolean  @default(false)
  status    Status
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
}
model User {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}
`

async function projectWithSchema(schema = SCHEMA) {
  const dir = await mkdtemp(path.join(tmpdir(), "shadpanel-resource-"))
  const { mkdir } = await import("node:fs/promises")
  await mkdir(path.join(dir, "prisma"), { recursive: true })
  await writeFile(path.join(dir, "prisma", "schema.prisma"), schema)
  return dir
}

describe("runResource command (BR-20260901-1)", () => {
  it("fails cleanly with Prisma not initialized when schema is missing (no crash)", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "shadpanel-no-prisma-"))
    const result = await runResource({
      name: "Post",
      projectPath: dir,
      skipMenu: true,
    })
    expect(result.exitCode).toBe(2)
    expect(result.error).toMatch(/Prisma not initialized/)
    expect(result.error).not.toMatch(/Cannot read|undefined is not|TypeError/)
  })

  it("skips existing files by default and overwrites with --force", async () => {
    const dir = await projectWithSchema()
    const first = await runResource({
      name: "Post",
      projectPath: dir,
      skipMenu: true,
    })
    expect(first.exitCode).toBe(0)
    expect(first.outcomes?.some((o) => o.outcome === "written")).toBe(true)

    const createPath = path.join(dir, "app/admin/dashboard/posts/create/page.tsx")
    await writeFile(createPath, "// user edited\n")

    const skipped = await runResource({
      name: "Post",
      projectPath: dir,
      skipMenu: true,
    })
    expect(skipped.exitCode).toBe(0)
    expect(skipped.outcomes?.find((o) => o.relativePath.endsWith("create/page.tsx"))?.outcome).toBe(
      "skipped"
    )
    expect(await readFile(createPath, "utf-8")).toBe("// user edited\n")

    const forced = await runResource({
      name: "Post",
      projectPath: dir,
      skipMenu: true,
      force: true,
    })
    expect(forced.exitCode).toBe(0)
    expect(forced.outcomes?.find((o) => o.relativePath.endsWith("create/page.tsx"))?.outcome).toBe(
      "overwritten"
    )
    const rewritten = await readFile(createPath, "utf-8")
    expect(rewritten).toContain("FormSelect accessor='authorId'")
    expect(rewritten).not.toBe("// user edited\n")
  })
})
