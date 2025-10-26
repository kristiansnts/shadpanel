'use client'

import React, { createContext, useContext } from 'react'
import { useAuthProviders, AuthProvidersConfig } from '@/hooks/use-auth-providers'

interface AuthProvidersContextType {
  config: AuthProvidersConfig
  updateConfig: (newConfig: Partial<AuthProvidersConfig>) => void
  enableProvider: (provider: keyof AuthProvidersConfig) => void
  disableProvider: (provider: keyof AuthProvidersConfig) => void
  toggleProvider: (provider: keyof AuthProvidersConfig) => void
  getEnabledProviders: () => (keyof AuthProvidersConfig)[]
}

const AuthProvidersContext = createContext<AuthProvidersContextType | undefined>(undefined)

export function AuthProvidersProvider({ children }: { children: React.ReactNode }) {
  const authProviders = useAuthProviders()

  return (
    <AuthProvidersContext.Provider value={authProviders}>
      {children}
    </AuthProvidersContext.Provider>
  )
}

export function useAuthProvidersContext() {
  const context = useContext(AuthProvidersContext)
  if (context === undefined) {
    throw new Error('useAuthProvidersContext must be used within an AuthProvidersProvider')
  }
  return context
}