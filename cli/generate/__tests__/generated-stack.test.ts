import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { isBetterAuthPrismaSchema } from "../better-auth-schema"
import { emitPrismaClient, PRISMA_CLIENT_RELATIVE_PATH } from "../emit-prisma-client"
import { emitResource } from "../emit-resource"
import { emitSchema } from "../emit-schema"
import { parsePrismaSchema } from "../parse-prisma"
import { nextMajor } from "../stack"
import {
  copyAuthTemplate,
  copyBaseTemplate,
  copyConfigTemplate,
  type TemplateVariables,
} from "../../utils/files"
import { updatePackageJson } from "../../utils/dependencies"

const TEMPLATES_DIR = path.join(process.cwd(), "templates")
const PKG_TEMPLATE = readFileSync(
  path.join(TEMPLATES_DIR, "config", "package.json.template"),
  "utf-8"
)
const PROXY_SOURCE = readFileSync(path.join(TEMPLATES_DIR, "auth", "proxy.ts"), "utf-8")
const LOGIN_SOURCE = readFileSync(
  path.join(TEMPLATES_DIR, "auth", "components", "login-form.tsx"),
  "utf-8"
)
const AUTH_SERVER_SOURCE = readFileSync(
  path.join(TEMPLATES_DIR, "auth", "lib", "auth.ts"),
  "utf-8"
)

const VARS: TemplateVariables = {
  APP_NAME: "QA App",
  PROJECT_NAME: "qa-app",
  SHADPANEL_VERSION: "1.5.0",
  BETTER_AUTH_SECRET: "test-secret",
  AUTH: true,
  GOOGLE: true,
  GITHUB: true,
  CREDENTIALS: true,
}

function walkFiles(dir: string, prefix = ""): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const rel = prefix ? `${prefix}/${entry}` : entry
    const abs = path.join(dir, entry)
    if (statSync(abs).isDirectory()) {
      out.push(...walkFiles(abs, rel))
    } else {
      out.push(rel.replace(/\\/g, "/"))
    }
  }
  return out
}

describe("generated stack (BR-20260831-1) — fails if Next 15 / NextAuth v4 remain", () => {
  it("package.json.template is Next major 16 with Better Auth and no next-auth", () => {
    const pkg = JSON.parse(PKG_TEMPLATE.replace(/\{\{PROJECT_NAME\}\}/g, "qa-app"))
    expect(nextMajor(pkg.dependencies.next)).toBe(16)
    expect(pkg.dependencies["next-auth"]).toBeUndefined()
    expect(pkg.dependencies["better-auth"]).toBeTruthy()
    expect(nextMajor(pkg.devDependencies["eslint-config-next"])).toBe(16)
    expect(JSON.stringify(pkg)).not.toMatch(/next-auth/)
  })

  it("auth templates ship proxy.ts (Node) and drop NextAuth middleware / [...nextauth]", () => {
    expect(existsSync(path.join(TEMPLATES_DIR, "auth", "proxy.ts"))).toBe(true)
    expect(existsSync(path.join(TEMPLATES_DIR, "auth", "middleware.ts"))).toBe(false)
    expect(existsSync(path.join(process.cwd(), "templates", "middleware.ts"))).toBe(false)
    expect(
      existsSync(path.join(TEMPLATES_DIR, "auth", "app", "api", "auth", "[...nextauth]", "route.ts"))
    ).toBe(false)
    expect(
      existsSync(path.join(TEMPLATES_DIR, "auth", "app", "api", "auth", "[...all]", "route.ts"))
    ).toBe(true)

    expect(PROXY_SOURCE).toMatch(/export async function proxy/)
    expect(PROXY_SOURCE).not.toMatch(/export (async )?function middleware/)
    expect(PROXY_SOURCE).not.toMatch(/export const runtime/)
    expect(PROXY_SOURCE).not.toMatch(/runtime:\s*['"]edge['"]/)
    expect(PROXY_SOURCE).toMatch(/auth\.api\.getSession/)
    expect(PROXY_SOURCE).toMatch(/\/admin\/login/)
    expect(PROXY_SOURCE).toMatch(/Node/)
  })

  it("credentials login uses Better Auth signIn.email and does not mint a session on error", () => {
    expect(LOGIN_SOURCE).toContain('from "@/lib/auth-client"')
    expect(LOGIN_SOURCE).not.toContain("next-auth")
    expect(LOGIN_SOURCE).toContain("signIn.email")
    expect(LOGIN_SOURCE).toContain("if (signInError)")
    expect(LOGIN_SOURCE).toContain("setError('Invalid credentials')")
    const errorBlock = LOGIN_SOURCE.slice(
      LOGIN_SOURCE.indexOf("if (signInError)"),
      LOGIN_SOURCE.indexOf("router.push")
    )
    expect(errorBlock).toContain("return")
    expect(errorBlock).not.toContain("router.push")
  })

  it("Better Auth server config uses the Prisma adapter, not a NextAuth JWT adapter", () => {
    expect(AUTH_SERVER_SOURCE).toContain('from "better-auth/adapters/prisma"')
    expect(AUTH_SERVER_SOURCE).toContain("prismaAdapter")
    expect(AUTH_SERVER_SOURCE).toContain("emailAndPassword")
    expect(AUTH_SERVER_SOURCE).not.toContain("next-auth")
    expect(AUTH_SERVER_SOURCE).not.toContain("CredentialsProvider")
    expect(AUTH_SERVER_SOURCE).not.toContain("jwt(")
  })
})

describe("init + db init + resource on the new stack", () => {
  const dirs: string[] = []

  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
  })

  it("copying templates produces Next 16 + Better Auth files and no NextAuth middleware", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "shadpanel-stack-"))
    dirs.push(dir)

    await copyBaseTemplate(TEMPLATES_DIR, dir, VARS)
    await copyConfigTemplate(TEMPLATES_DIR, dir, VARS)
    await copyAuthTemplate(TEMPLATES_DIR, dir, VARS)
    await updatePackageJson(dir, { authentication: true })

    const files = walkFiles(dir)
    expect(files).toContain("proxy.ts")
    expect(files).not.toContain("middleware.ts")
    expect(files.some((f) => f.includes("[...nextauth]"))).toBe(false)
    expect(files.some((f) => f.includes("[...all]/route.ts") || f.endsWith("[...all]/route.ts"))).toBe(
      true
    )
    expect(files).toContain("lib/auth.ts")
    expect(files).toContain("lib/auth-client.ts")

    const pkg = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf-8"))
    expect(nextMajor(pkg.dependencies.next)).toBe(16)
    expect(pkg.dependencies["next-auth"]).toBeUndefined()
    expect(pkg.dependencies["better-auth"]).toBeTruthy()

    const proxy = readFileSync(path.join(dir, "proxy.ts"), "utf-8")
    expect(proxy).toMatch(/export async function proxy/)
    expect(proxy).not.toMatch(/export const runtime/)
    expect(proxy).not.toMatch(/runtime:\s*['"]edge['"]/)

    const envExample = readFileSync(path.join(dir, ".env.example"), "utf-8")
    expect(envExample).toContain("BETTER_AUTH_SECRET=")
    expect(envExample).toContain("GOOGLE_CLIENT_ID=")
    expect(envExample).toContain("GITHUB_CLIENT_ID=")
    expect(envExample).not.toContain("NEXTAUTH_")
  })

  it("db schema emit has Better Auth Session model; resource still imports prisma", () => {
    const schema = emitSchema({ driver: "postgresql" })
    expect(isBetterAuthPrismaSchema(schema)).toBe(true)

    const nextAuthAdapter = `
model Session {
  id           String   @id
  sessionToken String   @unique
  userId       String
  expires      DateTime
}
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
}
`
    expect(isBetterAuthPrismaSchema(nextAuthAdapter)).toBe(false)
    expect(schema).toMatch(/model\s+Session/)
    expect(schema).toMatch(/token\s+String/)
    expect(schema).toMatch(/model\s+Account/)
    expect(schema).toMatch(/model\s+Verification/)
    expect(schema).not.toContain("model VerificationToken")
    expect(schema).not.toContain("sessionToken")
    expect(schema).not.toContain("providerAccountId")
    expect(schema).toContain('provider = "prisma-client-js"')

    const { enums, models } = parsePrismaSchema(`
model Post {
  id    Int    @id @default(autoincrement())
  title String
  authorId Int
}
`)
    const resourceFiles = emitResource({
      modelName: "Post",
      fields: models.Post,
      enums,
      resourceName: "Post",
    })
    const actions = resourceFiles.find((f) => f.relativePath.endsWith("actions.ts"))
    expect(actions?.content).toContain("import prisma from '@/lib/prisma'")
    expect(emitPrismaClient()).toContain("export default prisma")
    expect(PRISMA_CLIENT_RELATIVE_PATH).toBe("lib/prisma.ts")

    const create = resourceFiles.find((f) => f.relativePath.endsWith("create/page.tsx"))
    expect(create?.content).toContain("accessor='authorId'")
    expect(create?.content).not.toMatch(/authorId[\s\S]{0,80}FormSelect/)
  })

  it("updatePackageJson with auth off still strips next-auth", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "shadpanel-noauth-"))
    dirs.push(dir)
    await copyConfigTemplate(TEMPLATES_DIR, dir, { ...VARS, AUTH: false })
    await updatePackageJson(dir, { authentication: false })
    const pkg = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf-8"))
    expect(pkg.dependencies["next-auth"]).toBeUndefined()
    expect(pkg.dependencies["better-auth"]).toBeUndefined()
    expect(nextMajor(pkg.dependencies.next)).toBe(16)
  })
})
