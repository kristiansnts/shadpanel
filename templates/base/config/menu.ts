import { LucideIcon, House } from "lucide-react"

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

// Default menu configuration
// You can modify this array to customize what appears in the sidebar
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
  ],
}
