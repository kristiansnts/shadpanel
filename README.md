# ShadPanel

> Next.js Admin Panel CLI - Create complete admin panels instantly

**ShadPanel** is a CLI tool that scaffolds complete Next.js admin panels with authentication, form builders, data tables, and 50+ UI components based on [shadcn/ui](https://ui.shadcn.com).

## Quick Start

Create a new admin panel in seconds:

```bash
# Using the main CLI (recommended)
shadpanel init my-app

# Or directly with create-shadpanel-next
npx create-shadpanel-next my-app
```

### Database Setup (Optional)

After creating your project, you can easily set up Prisma for database management:

```bash
cd my-app
shadpanel db init
```

This will:
- ✅ Prompt you to choose your database (MySQL, PostgreSQL, SQLite, or MongoDB)
- ✅ Create `.env` file with database configuration
- ✅ Set up Prisma schema template
- ✅ Install Prisma packages
- ✅ Ready to define your models and run migrations

This will:
- ✅ Set up complete Next.js 15 project structure
- ✅ Configure Tailwind CSS v4 and TypeScript
- ✅ Add NextAuth.js authentication with OAuth providers
- ✅ Include Form Builder with validation
- ✅ Add Data Table with sorting, filtering, and pagination
- ✅ Set up responsive sidebar navigation
- ✅ Include 50+ pre-configured UI components
- ✅ Add demo pages and examples

## Features

- 🎨 **50+ UI Components** - Complete shadcn/ui component library
- 📝 **Form Builder** - Filament-inspired declarative forms with validation
- 📊 **Data Table** - Powerful tables with sorting, searching, and pagination
- 🔐 **Authentication** - NextAuth.js with Google, GitHub, and credentials
- 🎯 **TypeScript First** - Full type safety and IntelliSense support
- 🌙 **Dark Mode Ready** - Built-in theme support
- 📱 **Responsive** - Mobile-friendly sidebar and layouts
- ⚡ **Zero Config** - Works out of the box
- 🏷️ **Consistent Naming** - All form and table components use prefixed naming to avoid conflicts

## Usage

### Installation

```bash
# Install globally (recommended)
npm install -g shadpanel

# Or use with npx (no installation needed)
npx shadpanel init my-app
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

### Merging with Existing Projects

ShadPanel can merge into existing Next.js projects, preserving your existing files:

```bash
# Navigate to your existing Next.js project
cd my-existing-nextjs-app

# Initialize ShadPanel (will prompt for merge confirmation)
shadpanel init .

# Or specify a directory name
shadpanel init my-app
```

When merging:
- ✅ **Existing files are preserved** - Your layout, pages, and components won't be overwritten
- ✅ **Only adds new files** - Only ShadPanel components and utilities are added
- ✅ **Safe merge** - You'll be prompted before any changes are made
- ✅ **Perfect for components-only** - Use `--components-only` to add just the UI library

Example workflow:
```bash
# Already have a Next.js app
cd my-app

# Add ShadPanel components only (keeps your existing structure)
shadpanel init . --components-only

# This will skip your existing:
# - app/page.tsx (your home page)
# - app/layout.tsx (your root layout)
# - package.json (your dependencies)
# And only add new:
# - components/ui/* (ShadPanel components)
# - lib/utils.ts (utility functions)
# - hooks/* (React hooks)
```

### Database Commands

ShadPanel includes powerful database management commands powered by Prisma:

```bash
# Initialize database configuration
shadpanel db init

# Generate Prisma Client
shadpanel db generate

# Run migrations
shadpanel db migrate [name]

# Push schema to database (no migration files)
shadpanel db push

# Pull schema from existing database
shadpanel db pull

# Open Prisma Studio
shadpanel db studio

# Seed database
shadpanel db seed

# Reset database
shadpanel db reset
```

### Database Workflow

After initializing your database with `shadpanel db init`, you can:

1. Define your models in `prisma/schema.prisma`
2. Run `shadpanel db migrate [name]` to create and apply migrations
3. Use `shadpanel db generate` to update the Prisma Client

For development without migrations:
1. Edit `prisma/schema.prisma` with your changes
2. Run `shadpanel db push` to update the database schema directly

### Example Project Structure

After running the CLI, you'll get:

```
my-app/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles with Tailwind
│   ├── admin/
│   │   ├── layout.tsx          # Admin layout with auth
│   │   ├── login/page.tsx      # Login page
│   │   ├── signup/page.tsx     # Signup page
│   │   └── dashboard/
│   │       ├── layout.tsx      # Dashboard with sidebar
│   │       ├── page.tsx        # Dashboard home
│   │       └── users/page.tsx  # Users management
│   └── api/
│       └── auth/[...nextauth]/ # NextAuth.js API routes
│           └── route.ts
├── components/
│   ├── ui/                     # 50+ shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── sidebar.tsx
│   │   ├── form-builder/       # Form builder components
│   │   └── data-table/         # Data table components
│   ├── app-sidebar.tsx         # Sidebar navigation
│   ├── providers.tsx           # App providers wrapper
│   ├── login-form.tsx          # Login form component
│   ├── signup-form.tsx         # Signup form component
│   └── auth-provider-config.tsx
├── contexts/
│   ├── panel-context.tsx       # Panel state management
│   └── auth-providers-context.tsx
├── hooks/
│   ├── use-mobile.ts           # Responsive hooks
│   └── use-auth-providers.ts   # Auth state management
├── lib/
│   └── utils.ts                # Utility functions
├── types/
│   └── next-auth.d.ts          # TypeScript definitions
├── config/
│   └── menu.ts                 # Sidebar menu config
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── .gitignore
└── README.md
```

## What You Get

### Form Builder Example

Build forms declaratively with automatic validation and styling:

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

Create powerful data tables with sorting, filtering, and pagination:

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

**Features**: Built-in sorting, global search, column filtering, pagination, row selection, and bulk actions.

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

After installation, run:

```bash
cd my-app

npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see your admin panel.

## Component Naming Conventions

ShadPanel uses **prefixed naming** for all form and table components to avoid naming conflicts with native HTML elements and other UI libraries:

### Form Components
All form-related components are prefixed with `Form`:
- ✅ `FormInput` - Text input fields
- ✅ `FormSelect` - Dropdown selects
- ✅ `FormTextarea` - Multi-line text areas
- ✅ `FormCheckbox` - Checkboxes
- ✅ `FormToggle` - Toggle switches
- ✅ `FormSection` - Form sections with titles
- ✅ `FormGrid` - Responsive grid layouts

### Table Components
All data table components are prefixed with `Table`:
- ✅ `Table` - Main data table component (replaces `DataTable`)
- ✅ `TableTextColumn` - Text columns with sorting/filtering
- ✅ `TableSelectColumn` - Checkbox selection column
- ✅ `TableImageColumn` - Image columns
- ✅ `TableActionsColumn` - Row actions menu
- ✅ `TableAction` - Individual action items

### Benefits
- 🚫 **No Conflicts** - Won't clash with native HTML or other libraries
- 🎯 **Clear Intent** - Easy to identify form/table-specific components
- 💡 **Better DX** - Improved autocomplete and IntelliSense
- 🔄 **Consistent** - Same naming pattern across all components

## Requirements

- **Node.js** 18.0.0 or higher
- **Next.js** 14.0.0 or higher
- **React** 18.0.0 or higher

## Tech Stack

- [Next.js 14](https://nextjs.org) - React framework
- [React 18](https://react.dev) - UI library
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [shadcn/ui](https://ui.shadcn.com) - Base components
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Prisma](https://www.prisma.io) - Database ORM


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

**📦 NPM Package**: [create-shadpanel-next](https://www.npmjs.com/package/create-shadpanel-next)
