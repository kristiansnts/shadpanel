# Laravel-Style Database Migrations for Prisma

This project includes a custom CLI tool that brings Laravel's elegant migration workflow to Prisma, solving common pain points like shadow database requirements.

## 🎯 Why This Tool?

### The Problem

Prisma's default `migrate dev` command has limitations:
- ❌ Requires a shadow database (not available on Prisma Cloud, many hosting providers)
- ❌ Can fail with "relation already exists" errors
- ❌ Doesn't work well with existing databases
- ❌ Not intuitive for developers coming from Laravel

### The Solution

Our Laravel-style migration CLI:
- ✅ Works **without** shadow databases
- ✅ Creates **incremental** migration files (like Laravel)
- ✅ Only runs **new** migrations (skips already-applied)
- ✅ Automatically generates **SQL** from schema changes
- ✅ Simple, familiar commands: `make`, `run`, `status`

---

## 🚀 Quick Start

### 1. Edit Your Schema

```prisma
// prisma/schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  avatar    String?  // ← Add new field
}
```

### 2. Create Migration

```bash
npm run migrate:make add_avatar_to_users
```

Output:
```
⚙ Generating migration...
✓ Migration created: 20251102123456_add_avatar_to_users
  Location: prisma/migrations/20251102123456_add_avatar_to_users/migration.sql

Next steps:
  1. Review the migration file
  2. Run: npm run migrate:run
```

### 3. Review Generated SQL

```bash
cat prisma/migrations/20251102123456_add_avatar_to_users/migration.sql
```

```sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatar" TEXT;
```

### 4. Apply Migration

```bash
npm run migrate:run
```

Output:
```
⚙ Applying migrations...
✓ Migrations applied successfully
⚙ Generating Prisma Client...
✓ Done!
```

### 5. Check Status

```bash
npm run migrate:status
```

Output:
```
⚙ Checking migration status...
4 migrations found in prisma/migrations
Database schema is up to date!
```

---

## 📚 Available Commands

### `npm run migrate:make <name>`

**Create a new migration file**

```bash
# Examples:
npm run migrate:make create_users_table
npm run migrate:make add_profile_to_users
npm run migrate:make create_posts_and_comments
```

**What it does:**
1. Compares your `schema.prisma` with the current database state
2. Generates SQL for the differences
3. Creates a timestamped migration file
4. Ready to review and apply

**Options:**
```bash
# Create an empty migration (for custom SQL)
npm run migrate:make custom_indexes --empty
```

---

### `npm run migrate:run`

**Apply all pending migrations**

```bash
npm run migrate:run
```

**What it does:**
1. Reads all migrations in `prisma/migrations/`
2. Checks which ones are already applied
3. Runs only the new/pending migrations
4. Generates Prisma Client
5. Updates migration history in database

**Safe to run multiple times** - Already applied migrations are skipped!

---

### `npm run migrate:status`

**Check migration status**

```bash
npm run migrate:status
```

**Shows:**
- Total number of migrations
- Which migrations are pending
- Whether database is in sync

---

### `npm run db:push` *(Development Only)*

**Quick sync without migrations**

```bash
npm run db:push
```

**Use this when:**
- Rapid prototyping
- Don't need migration history
- Local development only

**⚠️ Don't use in production!**

---

### `npm run db:generate`

**Regenerate Prisma Client**

```bash
npm run db:generate
```

Runs `prisma generate` to update your Prisma Client after schema changes.

---

## 💡 Complete Workflow Examples

### Example 1: Creating a Blog System

```bash
# Step 1: Create users table
# Edit schema.prisma to add User model
npm run migrate:make create_users_table
npm run migrate:run

# Step 2: Add posts table
# Edit schema.prisma to add Post model
npm run migrate:make create_posts_table
npm run migrate:run

# Step 3: Add categories
# Edit schema.prisma to add Category model
npm run migrate:make create_categories_table
npm run migrate:run

# Step 4: Add OAuth support
# Edit schema.prisma to add googleId, githubId to User
npm run migrate:make add_oauth_to_users
npm run migrate:run

# Check everything
npm run migrate:status
```

### Example 2: Modifying Existing Tables

```bash
# Add new field to existing table
# Edit User model in schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  phone     String?  // ← New field
}

# Create and apply migration
npm run migrate:make add_phone_to_users
npm run migrate:run
```

### Example 3: Custom SQL Migration

```bash
# Create empty migration
npm run migrate:make add_custom_indexes --empty

# Edit the migration file manually
# prisma/migrations/XXXXXX_add_custom_indexes/migration.sql
-- Create custom index
CREATE INDEX CONCURRENTLY idx_users_email_lower 
ON "User" (LOWER(email));

# Apply it
npm run migrate:run
```

---

## 📁 Migration File Structure

```
prisma/migrations/
├── 20251102104429_create_users_table/
│   └── migration.sql
├── 20251102104500_create_posts_table/
│   └── migration.sql
├── 20251102104530_add_oauth_fields/
│   └── migration.sql
├── 20251102175806_add_user_profile_table/
│   └── migration.sql
└── migration_lock.toml
```

**Migration naming:**
- Format: `YYYYMMDDHHMMSS_descriptive_name`
- Example: `20251102175806_add_user_profile_table`
- Sorted chronologically
- Applied in order

---

## 🔄 How It Works

### Under the Hood

1. **Schema Diffing**
   ```bash
   npx prisma migrate diff \
     --from-schema-datasource schema.prisma \
     --to-schema-datamodel schema.prisma \
     --script
   ```
   Compares current database state with your Prisma schema.

2. **Migration File Creation**
   - Generates timestamp: `20251102175806`
   - Creates directory: `prisma/migrations/{timestamp}_{name}/`
   - Writes SQL: `migration.sql`

3. **Migration Deployment**
   ```bash
   npx prisma migrate deploy
   ```
   - Reads `_prisma_migrations` table
   - Applies only unapplied migrations
   - Updates migration history
   - **No shadow database needed!**

4. **Client Generation**
   ```bash
   npx prisma generate
   ```
   Updates TypeScript types for your Prisma Client.

---

## 🆚 Comparison: Prisma Default vs Laravel-Style

| Feature | `prisma migrate dev` | Our CLI Tool |
|---------|---------------------|--------------|
| **Shadow Database** | Required ❌ | Not needed ✅ |
| **Prisma Cloud Compatible** | No ❌ | Yes ✅ |
| **Laravel-like Commands** | No ❌ | Yes ✅ |
| **Auto SQL Generation** | Yes ✅ | Yes ✅ |
| **Incremental Migrations** | Yes ✅ | Yes ✅ |
| **Manual SQL Support** | Limited | Full ✅ |
| **Works with Existing DBs** | Sometimes ⚠️ | Yes ✅ |
| **Simple Commands** | `migrate dev` | `make`, `run`, `status` ✅ |

---

## 🐛 Troubleshooting

### "No schema changes detected"

**Problem:** Running `migrate:make` says no changes found.

**Solutions:**
```bash
# 1. Your schema matches the database (no migration needed)
npm run migrate:status

# 2. Create empty migration for custom SQL
npm run migrate:make custom_changes --empty

# 3. Use db:push for quick sync (dev only)
npm run db:push
```

### "Migration failed to apply"

**Problem:** Migration SQL has errors.

**Solutions:**
```bash
# 1. Check the migration SQL file
cat prisma/migrations/XXXXX_migration_name/migration.sql

# 2. Fix the SQL manually
# Edit the file directly

# 3. Re-run migration
npm run migrate:run
```

### "Relation already exists"

**Problem:** Database already has tables from old migrations.

**Solutions:**
```bash
# Option 1: Mark migration as applied (if DB is correct)
npx prisma migrate resolve --applied MIGRATION_NAME

# Option 2: Reset database (DESTROYS ALL DATA!)
npx prisma migrate reset --force

# Option 3: Use our tool (handles this better)
npm run migrate:make fix_schema
npm run migrate:run
```

---

## 🎯 Best Practices

### ✅ DO:

- **Review SQL before applying**
  ```bash
  cat prisma/migrations/XXXXX_name/migration.sql
  ```

- **Use descriptive migration names**
  ```bash
  ✅ npm run migrate:make add_avatar_and_bio_to_users
  ❌ npm run migrate:make update_users
  ```

- **Commit migrations to version control**
  ```bash
  git add prisma/migrations/
  git commit -m "Add user profiles migration"
  ```

- **Test migrations locally first**

### ❌ DON'T:

- **Don't modify applied migrations** - Create a new migration instead
- **Don't use `db:push` in production** - Use `migrate:run` instead
- **Don't skip reviewing SQL** - Always check what will be executed
- **Don't delete migration files** - Your database tracks them

---

## 🔐 Production Deployment

**Deployment command:**
```bash
npm install && npm run migrate:run && npm run build
```

**Example GitHub Actions:**
```yaml
- name: Install dependencies
  run: npm install

- name: Run migrations
  run: npm run migrate:run
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}

- name: Build application
  run: npm run build
```

---

## 🎉 Summary

**Three simple commands:**

```bash
# 1. Create migration
npm run migrate:make add_new_feature

# 2. Apply migrations  
npm run migrate:run

# 3. Check status
npm run migrate:status
```

**That's it!** No shadow database required, works everywhere, Laravel-style simplicity.

Enjoy hassle-free database migrations! 🚀
