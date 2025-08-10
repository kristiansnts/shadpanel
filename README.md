# ShadPanel

A modern React admin panel built with shadcn/ui components, inspired by the elegant design patterns of FilamentPHP. ShadPanel provides a clean, accessible, and highly customizable foundation for building admin interfaces with TypeScript support.

![ShadPanel](./shadpanel.png)

## ✨ Features

- **🎨 Modern UI**: Built with shadcn/ui components for a consistent, beautiful interface
- **🌙 Dark Mode**: Full dark/light theme support with next-themes
- **📱 Responsive**: Mobile-first design that works on all devices
- **🧭 Smart Navigation**: Context-aware sidebar with collapsible icon mode
- **📊 Data Visualization**: Built-in charts with Recharts integration
- **🔧 Modular Components**: Clean, reusable UI components built with Radix primitives
- **🔒 Type Safe**: Full TypeScript support with strict type checking
- **⚡ Fast Routing**: File-based routing with TanStack Router
- **🎯 Accessibility**: WCAG compliant components with proper ARIA support
- **🛠️ Developer Experience**: Hot reload, ESLint, and modern build tools

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/shadpanel.git
cd shadpanel

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:5173` to see your admin panel in action.

## 🏗️ Project Structure

```
src/
├── app/                    # Application pages
│   └── dashboard/         # Dashboard-specific components
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── app-sidebar.tsx   # Main navigation sidebar
│   ├── site-header.tsx   # Header component
│   └── ...
├── contexts/             # React contexts
├── hooks/               # Custom React hooks
├── lib/                # Utilities and configurations
└── routes/             # TanStack Router routes
```

## 🎨 Built With

- **React 19** - Latest React with modern features
- **TypeScript** - Type-safe development
- **shadcn/ui** - High-quality, accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Router** - Type-safe routing
- **Tabler Icons** - Beautiful, consistent icon library
- **Recharts** - Composable charting library
- **Radix UI** - Low-level UI primitives
- **Lucide Icons** - Beautiful, customizable icons
- **next-themes** - Perfect dark mode support

## 📊 Features Overview

### Dashboard
- Interactive charts and data visualization
- Key metrics and KPI cards
- Real-time data updates
- Responsive grid layouts

### Navigation
- Collapsible sidebar navigation
- Breadcrumb support
- Active state management
- Mobile-friendly drawer navigation

### Theming
- Light and dark mode support
- Customizable color schemes
- Consistent design tokens
- Accessible color contrasts

## 🛠️ Development

### Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run ESLint
pnpm lint

# Generate route types
pnpm route:gen
```

### Customization

ShadPanel is designed to be highly customizable:

1. **Colors**: Modify `tailwind.config.js` and CSS variables in `src/index.css`
2. **Components**: All shadcn/ui components can be customized in `src/components/ui/`
3. **Layout**: Modify sidebar and header components for your brand
4. **Routing**: Add new routes in the `src/routes/` directory

## 📱 FilamentPHP Inspiration

ShadPanel takes inspiration from FilamentPHP's excellent admin panel design:

- **Clean, minimal interface** with focus on content
- **Consistent component patterns** across the application
- **Logical information hierarchy** for better user experience
- **Responsive design** that works on all devices
- **Accessible by default** with proper ARIA support

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the amazing component library
- [FilamentPHP](https://filamentphp.com/) for design inspiration
- [TanStack](https://tanstack.com/) for excellent developer tools
- [Radix UI](https://radix-ui.com/) for accessible primitives

## 📞 Support

- 📧 Email: epafroditus.kristian@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/kristiansnts/shadpanel/issues)

---

<p align="center">Made with ❤️ by the ShadPanel team</p>
