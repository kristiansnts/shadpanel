import { useState, useEffect, ReactNode } from 'react'
import { AuthContext } from './auth-context-definition'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ email: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('userData')
    
    if (token && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simple mock authentication with admin credentials
    if (email === 'admin@shadpanel.com' && password === 'admin') {
      const token = 'mock-token'
      const userData = { email }
      
      localStorage.setItem('authToken', token)
      localStorage.setItem('userData', JSON.stringify(userData))
      
      setIsAuthenticated(true)
      setUser(userData)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  )
}

