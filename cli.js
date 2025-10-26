#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectName = process.argv[2] || 'my-shadpanel-app';

console.log(`Creating a new shadpanel Next.js app in ${projectName}...`);

// Create project directory
const projectPath = path.join(process.cwd(), projectName);
if (fs.existsSync(projectPath)) {
  console.error(`Error: Directory ${projectName} already exists.`);
  process.exit(1);
}

fs.mkdirSync(projectPath, { recursive: true });

// Create package.json
const packageJson = {
  name: projectName,
  version: '0.1.0',
  private: true,
  scripts: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    lint: 'next lint'
  },
  dependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    next: '^14.0.0'
  },
  devDependencies: {
    '@types/node': '^20.0.0',
    '@types/react': '^18.0.0',
    '@types/react-dom': '^18.0.0',
    typescript: '^5.0.0'
  }
};

fs.writeFileSync(
  path.join(projectPath, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Create tsconfig.json
const tsConfig = {
  compilerOptions: {
    target: 'es5',
    lib: ['dom', 'dom.iterable', 'esnext'],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    forceConsistentCasingInFileNames: true,
    noEmit: true,
    esModuleInterop: true,
    module: 'esnext',
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: 'preserve',
    incremental: true,
    plugins: [
      {
        name: 'next'
      }
    ],
    paths: {
      '@/*': ['./src/*']
    }
  },
  include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
  exclude: ['node_modules']
};

fs.writeFileSync(
  path.join(projectPath, 'tsconfig.json'),
  JSON.stringify(tsConfig, null, 2)
);

// Create next.config.js
const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig
`;

fs.writeFileSync(path.join(projectPath, 'next.config.js'), nextConfig);

// Create .gitignore
const gitignore = `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;

fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);

// Create src directory structure
fs.mkdirSync(path.join(projectPath, 'src', 'app'), { recursive: true });

// Create app/page.tsx
const pageTsx = `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Welcome to Shadpanel</h1>
      <p className="text-lg text-gray-600">
        Start building your Next.js app with shadcn/ui components
      </p>
    </main>
  )
}
`;

fs.writeFileSync(path.join(projectPath, 'src', 'app', 'page.tsx'), pageTsx);

// Create app/layout.tsx
const layoutTsx = `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shadpanel App',
  description: 'Created with create-shadpanel-next',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`;

fs.writeFileSync(path.join(projectPath, 'src', 'app', 'layout.tsx'), layoutTsx);

// Create app/globals.css
const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
`;

fs.writeFileSync(path.join(projectPath, 'src', 'app', 'globals.css'), globalsCss);

// Create README.md
const readme = `# ${projectName}

This is a [Next.js](https://nextjs.org/) project bootstrapped with \`create-shadpanel-next\`.

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js and shadcn/ui:

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
`;

fs.writeFileSync(path.join(projectPath, 'README.md'), readme);

console.log('\nSuccess! Created', projectName, 'at', projectPath);
console.log('\nInside that directory, you can run several commands:');
console.log('\n  npm run dev');
console.log('    Starts the development server.');
console.log('\n  npm run build');
console.log('    Builds the app for production.');
console.log('\n  npm start');
console.log('    Runs the built app in production mode.');
console.log('\nWe suggest that you begin by typing:');
console.log('\n  cd', projectName);
console.log('  npm install');
console.log('  npm run dev');
console.log('\nHappy coding!');
