import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { tokenStorage } from '../../lib/token-storage'
import { fetchCurrentUser, logout as logoutRequest, type CurrentUser } from './api/auth-api'

interface AuthContextValue {
  user: CurrentUser | undefined
  isLoading: boolean
  isAuthenticated: boolean
  signIn: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [hasTokens, setHasTokens] = useState(() => tokenStorage.get() !== null)

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    enabled: hasTokens,
    retry: false,
  })

  const signIn = () => setHasTokens(true)

  const signOut = async () => {
    const tokens = tokenStorage.get()
    if (tokens) {
      await logoutRequest(tokens.refresh_token).catch(() => {
        // best-effort : on efface la session locale même si l'appel échoue
      })
    }
    tokenStorage.clear()
    setHasTokens(false)
    queryClient.removeQueries({ queryKey: ['auth', 'me'] })
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading: hasTokens && isLoading, isAuthenticated: hasTokens && !!user, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
