import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import prisma from "@/lib/prisma"

function prismaProvider(): "postgresql" | "mysql" | "sqlite" {
  const driver = process.env.DATABASE_DRIVER
  if (driver === "mysql") return "mysql"
  if (driver === "sqlite") return "sqlite"
  return "postgresql"
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: prismaProvider(),
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
{{#CREDENTIALS}}  emailAndPassword: {
    enabled: true,
  },
{{/CREDENTIALS}}  socialProviders: {
{{#GOOGLE}}    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
{{/GOOGLE}}{{#GITHUB}}    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
{{/GITHUB}}  },
  plugins: [nextCookies()],
})
