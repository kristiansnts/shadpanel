# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-09-01

Brief **BR-20260901-1**. **Resource 2.0** for `shadpanel resource`. Stack unchanged: **Next.js 16**, **Better Auth**, **Prisma 6.18**. Not Prisma 7, not 2FA, not per-resource policies, not M2M RBAC.

### Added

- belongsTo (n:1) on create/edit → `FormSelect` of related records. Label is the first of `name` / `title` / `email` / `label` string scalars on the related model, else `id` (e.g. `Post.author`, not a raw numeric `authorId` input).
- hasMany and implicit M2M on the generated view/show page → a list of related records (e.g. `User.posts`, `Post.tags`). Relation fields are not dropped.
- View page at `view/[id]` plus a list-row View action.

### Changed

- Covered FK scalars (`authorId` when `author` is a belongsTo) are skipped on forms; the relation `FormSelect` writes the FK.
- A lone `User.roleId` scalar stays a numeric/string input. A belongsTo `Role` `FormSelect` for a single FK is emitted only when `Role` is a related model — not many-to-many permissions.

### Unchanged

- Enums stay static `FormSelect`.
- Skip-if-exists default; `--force` overwrites; `--dry-run` still previews.
- `resource` without `prisma/schema.prisma` errors `Prisma not initialized` (exit 2, no crash).
- M2M is view-list only (no M2M `FormSelect` on create/edit).

## [1.5.0] - 2026-08-31

Brief **BR-20260831-1**. Stack upgrade for **new generated apps only**. Apps already scaffolded on 1.4.0 are not migrated.

Current stack: **Next.js 16**, **React 19**, **Better Auth**, **Prisma 6.18**. Not Resource 2.0, not Prisma 7, not an automatic upgrade of existing 1.4.0 apps.

### Added

- `shadpanel init` (auth on) emits a Next.js 16 app with Better Auth (`better-auth`), `lib/auth.ts`, `lib/auth-client.ts`, and `app/api/auth/[...all]/route.ts`.
- Next.js 16 `proxy.ts` (Node runtime) redirects unauthenticated `/admin/dashboard` requests to login. NextAuth `middleware.ts` is not generated.
- `db init` Prisma 6 schema includes Better Auth `User` / `Session` / `Account` / `Verification` models (Prisma adapter, including Better Auth 1.7 `Account.issuer`).
- Credentials (email/password) sign-in and sign-up via Better Auth. Google/GitHub OAuth stay wired through `.env.example` when selected at init.

### Changed

- Generated `package.json` pins `next` ^16 and `eslint-config-next` ^16. `next-auth` is not a generated dependency.
- Unauthenticated dashboard access is gated by `proxy.ts` + Better Auth `auth.api.getSession`, not NextAuth middleware.
- README / current-stack docs: Next 16 + Better Auth. Do not treat Next 15 or NextAuth v4 as the current generator stack.

### Fixed

- Resource generation is unchanged on the new stack: `import prisma from '@/lib/prisma'` and `lib/prisma.ts` still exist. FK scalars stay plain inputs (no Resource 2.0 relation widgets).

### Removed

- NextAuth.js v4 from generated templates (`[...nextauth]`, `next-auth` dependency, NextAuth JWT session callbacks).

## [1.4.1] - 2026-08-31

Post-1.4.0 QA fixes. No stack change, no Resource 2.0, no Better Auth.

### Fixed

- `shadpanel init --no-demos` (and `--skip-demos`) skips demo pages. Commander sets `demos: false` for `--no-demos`; the generator previously looked only at `noDemos` and still logged `[ok] Demo pages added`.
- `prisma generate` (and other Prisma CLI shells) use `node_modules/.bin/prisma` when present, otherwise `npx --yes prisma@6.18.0`. Unpinned `npx prisma` no longer prompts for Prisma 8.

## [1.4.0] - 2026-08-31

Hygiene + docs release on the current templates: **Next.js 15**, **React 19**, **NextAuth.js v4**, **Prisma 6.18**. Not a stack upgrade and not Resource 2.0.

### Added

- `db init` and `resource` emit `lib/prisma.ts` (PrismaClient singleton, `export default prisma`) so generated actions resolve `@/lib/prisma`.
- `db init` writes `prisma/schema.prisma` (Prisma 6, `url = env("DATABASE_URL")`), `prisma/seed.ts`, and `package.json` `prisma.seed`.
- CLI-package-only template at `templates/prisma/` (never copied into the user project as `.template`).
- Scalar widgets on create/edit: String → `FormInput`, Int/Float/Decimal → numeric `FormInput`, Boolean → `FormCheckbox`, DateTime → `FormDateTimePicker`, enum → `FormSelect`.
- Skip-if-exists write policy with `--force` overwrite and `--dry-run`.
- Prisma 5 detection: warn on stderr, still emit Prisma 6. Never emit Prisma 5.
- Vitest suite + GitHub Actions CI (`npm test` → `vitest run`).
- This changelog (starts at 1.4.0).

### Changed

- `resource` no longer exits because a target file exists; it skips and continues (exit 0).
- `db generate` only runs `prisma generate` (client). It does not rewrite `schema.prisma` from a template.
- `db push --regenerate` re-copies from the **CLI** Prisma 6 template and honors skip-if-exists unless `--force`.
- README hero is `shadpanel resource`. Stack versions match templates. Migrate docs stay `make` / `run` / `status`.
- `create-shadpanel-next` documented as deprecated; use `shadpanel init`.

### Fixed

- Generated resources no longer import a `lib/prisma` module that the CLI never wrote.
- `db init` no longer writes `prisma/schema.prisma.template` into the app.
- `db pull` next-step copy uses `shadpanel db generate` (space, not colon).

### Removed

- Root `cli.cjs` leftover scaffolder that claimed Next.js 14.

### Security

- New seed, schema, and Prisma client files do not include sample passwords.
- Pre-existing demo login credentials in auth templates are unchanged (not rewritten in 1.4.0).

### Breaking (CLI)

- `db generate` no longer interpolates `{{DATABASE_URL}}` from a user-project `.template` into `schema.prisma`. Edit `prisma/schema.prisma` and use `env("DATABASE_URL")`.
- Re-running `resource` without `--force` leaves existing pages in place instead of failing the run.
