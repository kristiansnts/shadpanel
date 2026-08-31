# ShadPanel

> Generate admin CRUD from a Prisma model — `shadpanel resource`

**ShadPanel** is a CLI that scaffolds Next.js admin panels with authentication, form builders, data tables, and 50+ UI components based on [shadcn/ui](https://ui.shadcn.com). The hero path is **resource generation**: define a model, run one command, get list/create/edit pages.

```bash
# After db init + a Post model in prisma/schema.prisma
shadpanel resource Post
```

That writes list, create, and edit screens under `/admin/dashboard/posts`, plus server actions that import `@/lib/prisma`.

## Quick Start

```bash
# 1. Scaffold a Next.js 15 + NextAuth v4 app
npx shadpanel@latest init my-app
# or, if installed globally:
shadpanel init my-app

cd my-app

# 2. Prisma 6 (writes prisma/schema.prisma, lib/prisma.ts, prisma/seed.ts)
shadpanel db init

# 3. Add models in prisma/schema.prisma, then:
shadpanel db migrate make add_posts
shadpanel db migrate run

# 4. Generate the admin resource
shadpanel resource Post
```

`npx create-shadpanel-next` is **deprecated**. Use `npx shadpanel@latest init <name>` (or global `shadpanel init`).

This will:

- ✅ Scaffold a Next.js 15 + React 19 + NextAuth.js v4 admin app
- ✅ Write Prisma 6 `schema.prisma` with `url = env("DATABASE_URL")` (no user-project `.template`)
- ✅ Emit `lib/prisma.ts` (PrismaClient singleton) and a `prisma/seed.ts` stub
- ✅ Generate list/create/edit pages from scalar fields (String, Int, Boolean, DateTime, enum)
- ✅ Skip existing files on re-run (use `--force` to overwrite)

Relation object fields are skipped in 1.4.0. Foreign-key scalars (`authorId`, `roleId`) stay number/string inputs.

## Features

- 🎨 **50+ UI Components** - Complete shadcn/ui component library
- 📝 **Form Builder** - Filament-inspired declarative forms with validation
- 📊 **Data Table** - Powerful tables with sorting, searching, and pagination
- 🔐 **Authentication** - NextAuth.js v4 with Google, GitHub, and credentials
- 🗃️ **Resource generator** - `shadpanel resource` from a Prisma model
- 🎯 **TypeScript First** - Full type safety and IntelliSense support
- 🌙 **Dark Mode Ready** - Built-in theme support
- 📱 **Responsive** - Mobile-friendly sidebar and layouts

## Usage

### Installation

```bash
# Install globally (recommended)
npm install -g shadpanel

# Or use with npx (no installation needed)
npx shadpanel@latest init my-app
```

### Create New Project

```bash
# Initialize a new project
shadpanel init my-app

# Merge into an existing Next.js project
shadpanel init .

# Check version
shadpanel --version

# Get help
shadpanel --help
```

### Generate a resource

```bash
# From a model named Post in prisma/schema.prisma
shadpanel resource Post

# Re-run is skip-if-exists (exit 0). Overwrite with:
shadpanel resource Post --force

# Preview without writing
shadpanel resource Post --dry-run
```

Create/edit widgets:

| Prisma type | Widget |
|---|---|
| `String` | `FormInput` (`email` / `password` by field name) |
| `Int` / `Float` / `Decimal` | `FormInput` numeric |
| `Boolean` | `FormCheckbox` |
| `DateTime` | `FormDateTimePicker` |
| enum | `FormSelect` |
| relation objects | skipped |
| FK scalars (`authorId`, `roleId`) | scalar input, not `FormSelect` |

### Merging with Existing Projects

ShadPanel can merge into existing Next.js projects, preserving your existing files:

```bash
cd my-existing-nextjs-app
shadpanel init .
```

When merging:

- ✅ **Existing files are preserved** - Your layout, pages, and components won't be overwritten
- ✅ **Only adds new files** - Only ShadPanel components and utilities are added
- ✅ **Safe merge** - You'll be prompted before any changes are made
- ✅ **Perfect for components-only** - Use `--components-only` to add just the UI library

### Database Commands

```bash
# Initialize database configuration
shadpanel db init

# Generate Prisma Client (does not rewrite schema.prisma)
shadpanel db generate

# Migrations
shadpanel db migrate make <name>    # Create a new migration from schema diff
shadpanel db migrate run            # Apply pending migrations
shadpanel db migrate status         # Show migration status

# Push schema to database (no migration files)
shadpanel db push

# Pull schema from existing database
shadpanel db pull

# Open Prisma Studio
shadpanel db studio

# Seed database (edit prisma/seed.ts)
shadpanel db seed

# Reset database
shadpanel db reset
```

### Database Workflow

After `shadpanel db init`:

1. Edit `.env` with real credentials
2. Define models in `prisma/schema.prisma`
3. `shadpanel db migrate make <name>`
4. `shadpanel db migrate run`
5. `shadpanel resource <Model>`

For development without migrations:

1. Edit `prisma/schema.prisma`
2. Run `shadpanel db push`

### Example Project Structure

```
my-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       └── posts/              # from: shadpanel resource Post
│   │           ├── page.tsx
│   │           ├── create/page.tsx
│   │           └── edit/[id]/page.tsx
│   └── api/auth/[...nextauth]/route.ts
├── components/ui/
├── lib/
│   ├── utils.ts
│   └── prisma.ts                   # PrismaClient singleton (db init / resource)
├── prisma/
│   ├── schema.prisma               # Prisma 6, url = env("DATABASE_URL")
│   └── seed.ts                     # stub — add your own data
├── config/menu.ts
├── package.json
└── tsconfig.json
```

## What You Get

### Form Builder Example

```tsx
'use client'

import { Form, FormInput, FormSelect, FormSection } from '@/components/ui'
import { Button } from '@/components/ui'

export default function UserForm() {
  return (
    <Form
      initialValues={{ name: '', email: '', role: 'user' }}
      onSubmit={(values) => console.log(values)}
    >
      <FormSection title="User Information" description="Enter user details">
        <FormInput accessor="name" label="Name" required />
        <FormInput accessor="email" label="Email" type="email" required />
        <FormSelect
          accessor="role"
          label="Role"
          options={[
            { label: 'User', value: 'user' },
            { label: 'Admin', value: 'admin' },
          ]}
        />
      </FormSection>
      <Button type="submit">Submit</Button>
    </Form>
  )
}
```

**Note**: The `Form` component includes default padding (`px-8 pb-8`) and spacing (`space-y-6`) automatically.

### Data Table Example

```tsx
'use client'

import { Table, TableTextColumn, TableActionsColumn, TableAction } from '@/components/ui'
import { Edit, Trash } from 'lucide-react'

export default function UsersTable({ users }) {
  return (
    <Table data={users}>
      <TableTextColumn accessor="name" header="Name" sortable searchable />
      <TableTextColumn accessor="email" header="Email" searchable />
      <TableTextColumn accessor="role" header="Role" sortable />
      <TableActionsColumn>
        <TableAction icon={Edit} label="Edit" onClick={(row) => handleEdit(row)} />
        <TableAction icon={Trash} label="Delete" onClick={(row) => handleDelete(row)} />
      </TableActionsColumn>
    </Table>
  )
}
```

### Authentication Example

```tsx
import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function AuthButton() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div>
        <p>Welcome, {session.user?.email}</p>
        <Button onClick={() => signOut()}>Sign Out</Button>
      </div>
    )
  }

  return <Button onClick={() => signIn()}>Sign In</Button>
}
```

## Available Components

### UI Components
`Button`, `Badge`, `Card`, `Input`, `Label`, `Select`, `Checkbox`, `Switch`, `Textarea`, `Dialog`, `DropdownMenu`, `Popover`, `Tooltip`, `Tabs`, `Separator`, `Skeleton`, `Alert`, `Breadcrumb`, `Calendar`, `Sheet`, `Sidebar`

### Form Builder Components
**Main Component**: `Form` - Includes automatic padding (`px-8 pb-8`) and spacing (`space-y-6`)

**Form Fields**: `FormInput`, `FormTextarea`, `FormCheckbox`, `FormToggle`, `FormSelect`, `FormTagsInput`, `FormDatePicker`, `FormDateTimePicker`, `FormFileUpload`, `FormKeyValue`, `FormMarkdownEditor`, `FormRichEditor`

**Layout Components**: `FormGrid`, `FormSection`, `FormFieldset`, `FormTabs`, `FormGroup`, `FormPlaceholder`

### Data Table Components
**Main Component**: `Table` - Declarative data table with built-in features

**Column Types**: `TableTextColumn`, `TableImageColumn`, `TableSelectColumn`, `TableActionsColumn`

**Actions**: `TableAction` - Define row actions with icons and variants

### Utilities
`cn` (classnames utility), `useIsMobile` (responsive hook), `Toaster` (notifications)

## Development

```bash
cd my-app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your admin panel.

## Component Naming Conventions

ShadPanel uses **prefixed naming** for form and table components:

### Form Components
- ✅ `FormInput`, `FormSelect`, `FormTextarea`, `FormCheckbox`, `FormToggle`
- ✅ `FormSection`, `FormGrid`

### Table Components
- ✅ `Table`, `TableTextColumn`, `TableSelectColumn`, `TableImageColumn`
- ✅ `TableActionsColumn`, `TableAction`

## Requirements

- **Node.js** 18.0.0 or higher
- **Next.js** 15.0.0 or higher
- **React** 19.0.0 or higher

## Tech Stack

- [Next.js 15](https://nextjs.org) - React framework
- [React 19](https://react.dev) - UI library
- [NextAuth.js v4](https://next-auth.js.org) - Authentication
- [Tailwind CSS v4](https://tailwindcss.com) - Styling
- [Prisma 6](https://www.prisma.io) - Database ORM
- [shadcn/ui](https://ui.shadcn.com) - Base components
- [TypeScript](https://www.typescriptlang.org) - Type safety

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE for details

## Author

**Your Name** ([@kristiansnts](https://github.com/kristiansnts))
- Email: epafroditus.kristian@gmail.com
- GitHub: https://github.com/kristiansnts/shadpanel

## Acknowledgments

Built with and inspired by:

- [shadcn/ui](https://ui.shadcn.com) by [@shadcn](https://twitter.com/shadcn)
- [Filament](https://filamentphp.com) for form builder inspiration
- The Next.js and React communities

---

**⭐ Star this repo if you find it useful!**

**📦 NPM Package**: [shadpanel](https://www.npmjs.com/package/shadpanel)
