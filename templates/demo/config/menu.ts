import {
  LucideIcon,
  House,
  Table,
  FileEdit,
  Bell,
} from "lucide-react"

export interface MenuItem {
  title: string
  url?: string
  icon?: LucideIcon
  isActive?: boolean
  items?: MenuItem[]
}

export interface MenuConfig {
  navMain: MenuItem[]
}

// Menu configuration with demo pages
// Extends the default menu to include ShadPanel component demos
export const defaultMenuConfig: MenuConfig = {
  navMain: [
    {
      title: "{{APP_NAME}}",
      items: [
        {
          title: "Dashboard",
          url: "/admin/dashboard",
          icon: House,
        },
      ],
    },
    {
      title: "Component Demos",
      items: [
        {
          title: "Table Builder Demo",
          url: "/admin/dashboard/table-demo",
          icon: Table,
        },
        {
          title: "Form Builder Demo",
          url: "/admin/dashboard/form-demo",
          icon: FileEdit,
        },
        {
          title: "Notification Demo",
          url: "/admin/dashboard/notification-demo",
          icon: Bell,
        },
      ],
    },
  ],
}
