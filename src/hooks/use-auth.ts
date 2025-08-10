import { useContext } from 'react'
import { AuthContext } from '../contexts/auth-context-definition'

export function useAuth() {
  return useContext(AuthContext)
}