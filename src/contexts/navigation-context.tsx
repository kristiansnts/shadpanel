"use client"

import * as React from "react"

type NavigationContextProps = {
  activeItem: string
  setActiveItem: (item: string) => void
}

const NavigationContext = React.createContext<NavigationContextProps | null>(null)

export function useNavigation() {
  const context = React.useContext(NavigationContext)
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider.")
  }
  return context
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeItem, setActiveItem] = React.useState("Dashboard")

  const contextValue = React.useMemo<NavigationContextProps>(
    () => ({
      activeItem,
      setActiveItem,
    }),
    [activeItem, setActiveItem]
  )

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  )
}