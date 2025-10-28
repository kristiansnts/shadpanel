'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { MenuConfig, defaultMenuConfig } from '@/config/menu'

interface PanelContextType {
  menuConfig: MenuConfig
  setMenuConfig: (config: MenuConfig) => void
  resetMenuConfig: () => void
}

const PanelContext = createContext<PanelContextType | undefined>(undefined)

export function PanelProvider({ children }: { children: React.ReactNode }) {
  const [menuConfig, setMenuConfigState] = useState<MenuConfig>(defaultMenuConfig)

  // Load menu config from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('panel-menu-config')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setMenuConfigState(parsed)
      } catch (error) {
        console.error('Failed to parse stored menu config:', error)
      }
    }
  }, [])

  // Save menu config to localStorage whenever it changes
  const setMenuConfig = (config: MenuConfig) => {
    setMenuConfigState(config)
    localStorage.setItem('panel-menu-config', JSON.stringify(config))
  }

  // Reset to default menu config
  const resetMenuConfig = () => {
    setMenuConfigState(defaultMenuConfig)
    localStorage.removeItem('panel-menu-config')
  }

  return (
    <PanelContext.Provider value={{ menuConfig, setMenuConfig, resetMenuConfig }}>
      {children}
    </PanelContext.Provider>
  )
}

export function usePanelMenu() {
  const context = useContext(PanelContext)
  if (context === undefined) {
    throw new Error('usePanelMenu must be used within a PanelProvider')
  }
  return context
}
