# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
