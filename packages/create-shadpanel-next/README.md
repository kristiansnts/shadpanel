# create-shadpanel-next

Create a new Next.js admin panel with ShadPanel - a complete admin panel toolkit with authentication, form builders, data tables, and 50+ UI components.

## Usage

### Interactive Mode (Recommended)

Create a new ShadPanel project with a single command:

```bash
npx create-shadpanel-next@latest my-admin-panel
```

Or use your preferred package manager:

```bash
# npm
npx create-shadpanel-next@latest my-app

# pnpm
pnpm create shadpanel-next my-app

# yarn
yarn create shadpanel-next my-app

# bun
bunx create-shadpanel-next my-app
```

### Non-Interactive Mode

Use CLI flags to skip prompts and automate project setup:

```bash
# Create with all defaults
npx create-shadpanel-next@latest my-app --yes

# Custom configuration
npx create-shadpanel-next@latest my-app --use-pnpm --full-panel --google --github

# Components only with npm
npx create-shadpanel-next@latest my-app --components-only --use-npm --skip-install
```

### CLI Options

#### Project Configuration

- `--yes` - Use defaults for all options without prompting

**Note:** ShadPanel is TypeScript-only. All projects are created with TypeScript support.

#### Package Manager

- `--use-npm` - Use npm as package manager
- `--use-pnpm` - Use pnpm as package manager (default if available)
- `--use-yarn` - Use yarn as package manager
- `--use-bun` - Use bun as package manager

#### Installation Type

- `--full-panel` - Install full admin panel with authentication (default)
- `--auth-components` - Install authentication + components only
- `--components-only` - Install UI components only

#### Authentication

- `--no-auth` - Skip authentication setup
- `--credentials` - Include email/password authentication (default)
- `--google` - Include Google OAuth provider
- `--github` - Include GitHub OAuth provider

#### Other Options

- `--no-demos` - Skip demo pages
- `--skip-install` - Skip installing packages
- `--disable-git` - Skip initializing a git repository
- `-e, --example <name>` - Bootstrap with a specific example (future feature)

### Examples

#### Full panel with Google & GitHub OAuth

```bash
npx create-shadpanel-next@latest my-app --full-panel --google --github --use-pnpm
```

#### Components only without installation

```bash
npx create-shadpanel-next@latest my-components --components-only --skip-install
```

#### Auth components with specific providers

```bash
npx create-shadpanel-next@latest my-app --auth-components --google --credentials
```

### Legacy Command

You can also use the `init` subcommand (all flags work the same):

```bash
npx create-shadpanel-next@latest init my-admin-panel
```

## What's Included

ShadPanel provides everything you need to build a modern admin panel:

### 🎨 UI Components (50+)
- Built on **shadcn/ui** and **Radix UI** primitives
- Fully customizable with **Tailwind CSS v4**
- Dark mode support out of the box
- Responsive design

### 🔐 Authentication
- **NextAuth.js** integration
- Multiple providers support:
  - Google OAuth
  - GitHub OAuth
  - Email/Password (Credentials)
- Protected routes
- Session management

### 📋 Form Builder
- Dynamic form generation
- Multiple field types (text, email, select, checkbox, etc.)
- Built-in validation
- Easy to extend

### 📊 Data Tables
- Powered by **TanStack Table**
- Sorting, filtering, and pagination
- Row selection
- Customizable columns

### 🎯 Features
- Admin dashboard layout
- Sidebar navigation
- User management
- Demo pages and examples
- TypeScript support
- ESLint configuration
- Git initialization

## Installation Types

During setup, you can choose from different installation types:

1. **Full Panel**: Complete admin panel with all features
2. **Components Only**: Just the UI components
3. **Auth Components**: Authentication components only

## Requirements

- **Node.js** 18.x or higher
- **Package Manager**: npm, pnpm, yarn, or bun

## Technology Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Build Tool**: Turbopack
- **React**: v19
- **TypeScript**: v5
- **Authentication**: NextAuth.js v4
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS v4
- **Tables**: TanStack Table v8
- **Icons**: Lucide React

## After Installation

Once your project is created, navigate to the directory and start the development server:

```bash
cd my-admin-panel
npm run dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000)

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your authentication provider credentials:
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` (if using Google OAuth)
   - `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` (if using GitHub OAuth)

### Demo Credentials

For testing, you can use the hardcoded demo credentials (development only):
- Email: `admin@example.com`
- Password: `admin123`

**Note**: Remove these before deploying to production!

## Project Structure

```
my-admin-panel/
├── app/
│   ├── admin/               # Admin dashboard routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── login/          # Login page
│   │   └── signup/         # Signup page
│   ├── api/
│   │   └── auth/           # NextAuth API routes
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── app-sidebar.tsx     # Dashboard sidebar
│   └── login-form.tsx      # Auth forms
├── lib/
│   └── utils.ts            # Utility functions
├── hooks/                  # Custom React hooks
├── contexts/               # React contexts
└── public/                 # Static assets
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Documentation

For more detailed documentation, visit the [ShadPanel repository](https://github.com/kristiansnts/shadpanel).

## License

MIT

## Support

For issues, questions, or contributions, please visit our [GitHub repository](https://github.com/kristiansnts/shadpanel).
