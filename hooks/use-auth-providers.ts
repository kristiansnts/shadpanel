import { useState, useEffect } from 'react'

export interface AuthProvider {
  id: string
  name: string
  icon: React.ReactNode
  enabled: boolean
  type: 'oauth' | 'credentials'
}

export interface AuthProvidersConfig {
  google: boolean
  github: boolean
  credentials: boolean
}

const defaultConfig: AuthProvidersConfig = {
  google: true,
  github: true,
  credentials: true,
}

export function useAuthProviders() {
  const [config, setConfig] = useState<AuthProvidersConfig>(defaultConfig)

  // Load config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('auth-providers-config')
    if (saved) {
      try {
        const parsedConfig = JSON.parse(saved)
        setConfig({ ...defaultConfig, ...parsedConfig })
      } catch (error) {
        console.error('Failed to parse auth providers config:', error)
      }
    }
  }, [])

  // Save config to localStorage when it changes
  const updateConfig = (newConfig: Partial<AuthProvidersConfig>) => {
    const updatedConfig = { ...config, ...newConfig }
    setConfig(updatedConfig)
    localStorage.setItem('auth-providers-config', JSON.stringify(updatedConfig))
  }

  const enableProvider = (provider: keyof AuthProvidersConfig) => {
    updateConfig({ [provider]: true })
  }

  const disableProvider = (provider: keyof AuthProvidersConfig) => {
    updateConfig({ [provider]: false })
  }

  const toggleProvider = (provider: keyof AuthProvidersConfig) => {
    updateConfig({ [provider]: !config[provider] })
  }

  const getEnabledProviders = (): (keyof AuthProvidersConfig)[] => {
    return Object.entries(config)
      .filter(([, enabled]) => enabled)
      .map(([provider]) => provider as keyof AuthProvidersConfig)
  }

  return {
    config,
    updateConfig,
    enableProvider,
    disableProvider,
    toggleProvider,
    getEnabledProviders,
  }
}