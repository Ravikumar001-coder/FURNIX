import axios from 'axios'
import {
  API_BASE_URL,
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

const readToken = () => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    return token
  }

  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY)
  if (legacyToken) {
    localStorage.setItem(TOKEN_KEY, legacyToken)
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    return legacyToken
  }

  return null
}

const persistAuthData = (authData = {}) => {
  if (authData.token) {
    localStorage.setItem(TOKEN_KEY, authData.token)
  }
  localStorage.setItem(USER_KEY, JSON.stringify(normalizeUser(authData)))
}

const clearAuthStorage = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
  localStorage.removeItem(LEGACY_USER_KEY)
}

const getLoginRedirectPath = () => {
  return window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login'
}

const isRefreshRequest = (config) => config?.url?.includes('/auth/refresh')
const isDirectAuthRequest = (config) => {
  const url = config?.url || ''
  return url.includes('/auth/login')
    || url.includes('/auth/register')
    || url.includes('/auth/google')
    || url.includes('/auth/social-login')
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let requestQueue = []

const processQueue = (error, token = null) => {
  requestQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
      return
    }
    resolve(token)
  })
  requestQueue = []
}

api.interceptors.request.use(
  (config) => {
    const token = readToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const statusCode = error.response?.status

    if (statusCode === 401 && !originalRequest?._retry && !isRefreshRequest(originalRequest) && !isDirectAuthRequest(originalRequest)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          requestQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshResponse = await refreshClient.post('/auth/refresh')
        const authData = refreshResponse.data?.data

        if (!authData?.token) {
          throw new Error('No access token returned from refresh endpoint')
        }

        persistAuthData(authData)
        processQueue(null, authData.token)

        originalRequest.headers.Authorization = `Bearer ${authData.token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuthStorage()

        const target = getLoginRedirectPath()
        if (window.location.pathname !== target) {
          window.location.href = target
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
