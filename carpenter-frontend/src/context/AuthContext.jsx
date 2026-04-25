import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

const toUser = (payload = {}) => ({
  username: payload.username,
  role: payload.role,
  fullName: payload.fullName || payload.username,
  profilePicture: payload.profilePicture || null,
  provider: payload.provider || 'LOCAL',
})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      if (!authService.isAuthenticated()) {
        if (mounted) {
          setLoading(false)
        }
        return
      }

      try {
        const currentUser = await authService.fetchCurrentUser()
        if (mounted) {
          setUser(currentUser)
        }
      } catch {
        authService.logoutLocal()
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [])

  const login = async (username, password) => {
    const data = await authService.login(username, password)
    const nextUser = await authService.fetchCurrentUser().catch(() => toUser(data))
    setUser(nextUser)
    return data
  }

  const register = async (userData) => {
    const data = await authService.register(userData)
    const nextUser = await authService.fetchCurrentUser().catch(() => toUser(data))
    setUser(nextUser)
    return data
  }

  const googleLogin = async (googleToken) => {
    const data = await authService.googleLogin(googleToken)
    const nextUser = await authService.fetchCurrentUser().catch(() => toUser(data))
    setUser(nextUser)
    return data
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  const updateProfile = async (profileData) => {
    const updatedUser = await authService.updateProfile(profileData)
    setUser(updatedUser)
    return updatedUser
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        admin: user?.role === 'ROLE_ADMIN' ? user : null,
        login,
        register,
        googleLogin,
        logout,
        updateProfile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be inside AuthProvider')
  }
  return ctx
}
