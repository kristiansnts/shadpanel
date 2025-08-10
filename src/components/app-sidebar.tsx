import * as React from "react"
import {  
  IconApps,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useNavigation } from "@/contexts/navigation-context"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { activeItem, setActiveItem } = useNavigation()
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className={activeItem === "Dashboard" ? "bg-slate-200 text-black" : ""} 
                  tooltip="Dashboard"
                >
                  <a 
                    href="#" 
                    className="font-medium"
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveItem("Dashboard")
                    }}
                  >
                    <IconApps className="h-4 w-4" />
                    <span>Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
