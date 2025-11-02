const text = `Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "db.prisma.io:5432"

4 migrations found in prisma/migrations
Your local migration history and the migrations table from your database are different:

The last common migration is: 20251102181751_create_user_post_relation

The migration have not yet been applied:
20251102182141_alter_post_table_add_imageurl

The migrations from the database are not found locally in prisma/migrations:
20251102104429_create_users_table
20251102104500_create_posts_table
20251102104530_add_oauth_fields
20251102175806_add_user_profile_table`;

function parseStatus(text) {
  const fullText = text
  const lines = text.split(/\r?\n/)
  let lastCommon = null
  let inPending = false
  let inDbOnly = false
  let pending = []
  let dbOnly = []
  let totalMigrations = 0

  for (const raw of lines) {
    const line = raw.trim()
    console.log(`Processing: "${line}", inPending=${inPending}, inDbOnly=${inDbOnly}`)
    if (!line) continue

    const totalMatch = line.match(/^(\d+)\s+migrations?\s+found/i)
    if (totalMatch) {
      totalMigrations = parseInt(totalMatch[1], 10)
    }

    if (line.startsWith("The last common migration is:")) {
      lastCommon = line.replace("The last common migration is:", "").trim()
      inPending = false
      inDbOnly = false
      continue
    }
    if (line.match(/migration.*have not yet been applied/i)) {
      console.log("  -> Setting inPending=true")
      inPending = true
      inDbOnly = false
      continue
    }
    if (line.match(/migrations from the database are not found locally/i)) {
      console.log("  -> Setting inDbOnly=true")
      inDbOnly = true
      inPending = false
      continue
    }

    if (/^\d{14}_/.test(line)) {
      console.log(`  -> Found migration: ${line}`)
      if (inPending) {
        pending.push(line)
      } else if (inDbOnly) {
        dbOnly.push(line)
      }
    }
  }

  return { lastCommon, pending, dbOnly, totalMigrations, text: fullText }
}

const result = parseStatus(text)
console.log("\nResult:", JSON.stringify(result, null, 2))
