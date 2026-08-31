/**
 * Better Auth + Prisma adapter core models (Prisma 6).
 *
 * Verified against Better Auth 1.7 Prisma CLI snapshot (User / Session /
 * Account / Verification). Account.issuer + unique (issuer, accountId) are
 * required by Better Auth 1.7 — this is not the NextAuth Prisma/JWT adapter
 * (no sessionToken, no VerificationToken).
 *
 * Plugin tables (TwoFactor, username) are omitted on purpose.
 */
export const BETTER_AUTH_PRISMA_MODELS = `// Better Auth (Prisma adapter) — required by email/password and OAuth sessions
model User {
  id            String    @id
  name          String
  email         String
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]

  @@unique([email])
  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([token])
  @@index([userId])
  @@map("session")
}

model Account {
  id                    String    @id
  issuer                String
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@unique([issuer, accountId], map: "account_issuer_accountId_uidx")
  @@index([userId])
  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
  @@map("verification")
}
`

/**
 * True when schema looks like Better Auth's Prisma adapter, not NextAuth's.
 */
export function isBetterAuthPrismaSchema(schema: string): boolean {
  const hasSessionModel = /model\s+Session\b/.test(schema)
  const hasSessionTokenField = /model\s+Session[\s\S]*?\btoken\s+String/.test(schema)
  const hasAccount = /model\s+Account\b/.test(schema)
  const hasVerification = /model\s+Verification\b/.test(schema)
  const nextAuthJwt =
    /model\s+VerificationToken\b/.test(schema) ||
    /sessionToken/.test(schema) ||
    /providerAccountId/.test(schema)
  return (
    hasSessionModel &&
    hasSessionTokenField &&
    hasAccount &&
    hasVerification &&
    !nextAuthJwt
  )
}
