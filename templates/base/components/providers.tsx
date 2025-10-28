'use client';

import { PanelProvider } from "@/contexts/panel-context"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <PanelProvider>
        {children}
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
        />
      </PanelProvider>
    </ThemeProvider>
  )
}
