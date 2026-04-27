import api from './api'
import {
  TOKEN_KEY,
  USER_KEY,
  LEGACY_TOKEN_KEY,
  LEGACY_USER_KEY,
} from '../utils/constants'

const normalizeUser = (data = {}) => ({
  username: data.username,
  role: data.role,
  fullName: data.fullName || data.username,
  profilePicture: data.profilePicture || null,
  provider: data.provider || 'LOCAL',
})

const readStoredToken = () => {
  const currentToken = localStorage.getItem(TOKEN_KEY)
  if (currentToken) {
    return currentToken
  }

  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY)
  if (legacyToken) {
    localStorage.setItem(TOKEN_KEY, legacyToken)
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    return legacyToken
  }

  return null
}

const readStoredUser = () => {
  const currentUser = localStorage.getItem(USER_KEY)
  if (currentUser) {
    return currentUser
  }

  const legacyUser = localStorage.getItem(LEGACY_USER_KEY)
  if (legacyUser) {
    localStorage.setItem(USER_KEY, legacyUser)
    localStorage.removeItem(LEGACY_USER_KEY)
    return legacyUser
  }

  return null
}

const persistSession = (authData = {}) => {
  if (authData.token) {
    localStorage.setItem(TOKEN_KEY, authData.token)
  }

  const user = normalizeUser(authData)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return user
}

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
  localStorage.removeItem(LEGACY_USER_KEY)
}

export const authService = {

  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password })
    const authData = response.data.data
    persistSession(authData)
    return authData
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    const authData = response.data.data
    persistSession(authData)
    return authData
  },

  googleLogin: async (token) => {
    const response = await api.post('/auth/google', { token })
    const authData = response.data.data
    persistSession(authData)
    return authData
  },

  socialLogin: async (provider, token) => {
    if (provider === 'GOOGLE') {
      return authService.googleLogin(token)
    }
    throw new Error('Only Google login is supported')
  },

  fetchCurrentUser: async () => {
    const response = await api.get('/auth/me')
    const user = normalizeUser(response.data.data)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    return user
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/me', profileData)
    const user = normalizeUser(response.data.data)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    return user
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Clear session regardless of API errors.
    } finally {
      clearSession()
    }
  },

  whatsappRequestOtp: async (phoneNumber) => {
    const response = await api.post('/auth/whatsapp/request-otp', { phoneNumber })
    return response.data
  },

  whatsappVerifyOtp: async (phoneNumber, code) => {
    const response = await api.post('/auth/whatsapp/verify-otp', { phoneNumber, code })
    const authData = response.data.data
    persistSession(authData)
    return authData
  },

  logoutLocal: () => {
    clearSession()
  },

  getCurrentUser: () => {
    const user = readStoredUser()
    if (!user) {
      return null
    }

    try {
      return normalizeUser(JSON.parse(user))
    } catch {
      clearSession()
      return null
    }
  },

  getAccessToken: () => readStoredToken(),

  isAuthenticated: () => !!readStoredToken(),

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    })
    return response.data
  },
}
