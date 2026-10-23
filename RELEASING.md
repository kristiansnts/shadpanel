# Releasing ShadPanel

Manual steps for publishing a version. The [Release workflow](.github/workflows/release.yml) runs **only** when a maintainer pushes a `v*` tag. It does not publish from merges to `main`.

## Prerequisites

- `package.json` `version` matches the intended release (e.g. `1.6.1`).
- `CHANGELOG.md` has a top entry for that version (Keep a Changelog).
- CI on `main` is green (`npm ci` → `npm test` → `npm run build:cli`).
- Repo secret `NPM_TOKEN` is set (npm automation/granular token with publish access to `shadpanel`).
- You will **not** push to `main` as part of tagging if release commits already landed via PR.

## Publish 1.6.1

From a clean checkout of `main` at the 1.6.1 release commit (after this prep PR is merged):

```bash
# 1) Confirm version
node -p "require('./package.json').version"   # → 1.6.1
git status                                    # clean

# 2) Create and push the release tag (this triggers .github/workflows/release.yml)
git tag -a v1.6.1 -m "ShadPanel 1.6.1"
git push origin v1.6.1
```

The workflow will:

1. Fail if the tag is not `v` + `package.json` version.
2. Run tests and `build:cli`.
3. `npm publish --provenance --access public` using `NPM_TOKEN`.
4. Create a GitHub Release whose body is the matching `CHANGELOG.md` section.

Do **not** run `npm publish` locally unless the workflow is unavailable; prefer the tagged workflow for provenance.

## Optional: backfill tags for 1.4.0–1.5.0

npm never received 1.4.0–1.5.0 (latest is still `1.3.1`). GitHub tags also stop at `v1.3.1`. If you want compare links and history to resolve, tag the merge commits on `main` (annotated tags, no workflow publish needed if you already skipped those npm versions — or only push `v1.6.0` if you do not want older tags):

```bash
# On main, after fetching:
git tag -a v1.4.0 682df6552c0726029fd778d3d315063cab8b19fd -m "ShadPanel 1.4.0"
git tag -a v1.4.1 6e56872b0a6d3791da655955c9f6aec6fa135847 -m "ShadPanel 1.4.1"
git tag -a v1.5.0 d00adb4aed9fced4ebedfa92556f7afc55a77dc2 -m "ShadPanel 1.5.0"

# Push tags that should NOT publish to npm (workflow publishes on any v* tag).
# Either push them before enabling NPM_TOKEN, or temporarily disable the Release
# workflow / use a dry-run, OR skip backfill and only push v1.6.0.
#
# Safer backfill (no npm publish): push tags only after confirming the Release
# job cannot publish those versions (they are not in package.json at those
# commits — package.json at those SHAs already had 1.4.0 / 1.4.1 / 1.5.0).
# Pushing v1.4.0 at the 1.4.0 commit WILL trigger the workflow if release.yml
# exists on that commit. release.yml is new in 1.6.0, so tags at older commits
# will not run this workflow (GitHub uses the workflow file from the tagged SHA).

git push origin v1.4.0 v1.4.1 v1.5.0
```

Because `release.yml` lands with 1.6.0, tags at older SHAs do not include that workflow and will not auto-publish.

## Deprecate `create-shadpanel-next`

The legacy scaffolder on npm should point people at `shadpanel init`:

```bash
npm deprecate create-shadpanel-next@"*" "Package no longer supported. Use: npx shadpanel@latest init <name>"
```

Only maintainers with publish access to `create-shadpanel-next` can run this. Do this once; it is not part of the tag workflow.

## Prisma pin

Keep Prisma at **6.18.0** in the CLI (`cli/utils/prisma-cli.ts` `PRISMA_PIN` and `db init` install commands). Do not float to npm `prisma@latest` (may resolve to an 8.x RC).

## Smoke-test before tagging (recommended)

```bash
npm ci
npm test
npm run build:cli
npm pack
# Install the tarball in a temp dir, then:
#   shadpanel init smoke-app --yes --use-npm --no-demos --disable-git
#   cd smoke-app
#   shadpanel db init --yes --driver sqlite --use-npm
#   # add a Post model to prisma/schema.prisma, then:
#   shadpanel db generate
#   shadpanel resource Post
#   npm run build
```

## Checklist

- [ ] Version + CHANGELOG + compare links updated
- [ ] Optional backfill tags `v1.4.0` / `v1.4.1` / `v1.5.0`
- [ ] `git tag -a v1.6.1` + `git push origin v1.6.1`
- [ ] Confirm GitHub Actions “Release” job published npm + GitHub Release
- [ ] Confirm `npm view shadpanel version` → `1.6.1`
- [ ] Optionally `npm deprecate create-shadpanel-next@*`
