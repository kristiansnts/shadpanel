"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconSun, IconCheck } from "@tabler/icons-react"

export function DarkModeToggle() {
  const [theme, setTheme] = useState("Light")

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    if (newTheme === "Dark") {
      document.documentElement.classList.add('dark')
    } else if (newTheme === "Light") {
      document.documentElement.classList.remove('dark')
    } else {
      // System - detect system preference
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <IconSun className="h-4 w-4" />
          <span className="sr-only">Theme selector</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem onClick={() => handleThemeChange("Light")} className="flex items-center justify-between">
          Light
          {theme === "Light" && <IconCheck className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("Dark")} className="flex items-center justify-between">
          Dark
          {theme === "Dark" && <IconCheck className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("System")} className="flex items-center justify-between">
          System
          {theme === "System" && <IconCheck className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}