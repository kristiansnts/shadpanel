# create-shadpanel-next (deprecated)

> **Deprecated.** Use the main CLI instead:
>
> ```bash
> npx shadpanel@latest init my-app
> ```
>
> Or install globally and run `shadpanel init <name>`. This package is no longer the supported path.

`create-shadpanel-next` used to scaffold a Next.js 15 / React 19 / NextAuth.js v4 admin panel. New projects should use `shadpanel init` (Next.js 16 + Better Auth), then `shadpanel db init` and `shadpanel resource <Model>`.

## What this used to do

Historically this package ran an interactive scaffolder (`npx create-shadpanel-next@latest my-app`) with the same installation types as `shadpanel init` (full panel, auth components, components only).

If you still invoke it, it prints a deprecation warning and continues the old init flow. Prefer `npx shadpanel@latest init <name>`.

## Requirements (historical)

- **Node.js** 18.x or higher
- **Package Manager**: npm, pnpm, yarn, or bun

## Technology stack (historical)

- **Framework**: Next.js 15 (App Router)
- **React**: v19
- **Authentication**: NextAuth.js v4
- **Styling**: Tailwind CSS v4

## Documentation

See the [ShadPanel repository](https://github.com/kristiansnts/shadpanel) and root README for the current `shadpanel init` / `db init` / `resource` path.

## License

MIT
