import React, { createContext, useContext, useMemo, useState } from 'react'
import { clearAuthToken, setAuthToken } from '@utc/api-client'
import {
  createSession,
  destroySession,
  getSession,
  isAuthenticated as checkIsAuthenticated,
  normalizeUser,
} from '@utc/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const session = getSession()
  const [user, setUser] = useState(session.user)

  const loginAsUtcTeam = () => {
    const normalizedUser = normalizeUser({
      userId: 'UTC001',
      name: 'UTC Team Demo',
      role: 'utc_team',
    })

    const token = 'mock-utc-team-token'

    createSession({
      user: normalizedUser,
      token,
    })

    setAuthToken(token)
    setUser(normalizedUser)
  }

  const loginAsInvestor = () => {
    const normalizedUser = normalizeUser({
      userId: 'INV001',
      name: 'Investor Demo',
      role: 'investor',
    })

    const token = 'mock-investor-token'

    createSession({
      user: normalizedUser,
      token,
    })

    setAuthToken(token)
    setUser(normalizedUser)
  }

  const logout = () => {
    destroySession()
    clearAuthToken()
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: checkIsAuthenticated(user),
      loginAsUtcTeam,
      loginAsInvestor,
      logout,
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}