import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import {
  DEFAULT_SITE_SETTINGS,
  applySeoMetadata,
  mergeSiteSettings,
  normalizeSettingsForSave,
} from '../utils/siteSettings'

const SiteSettingsContext = createContext(null)

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS)
  const [loading, setLoading] = useState(true)

  const refreshSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/settings')
      const mergedSettings = mergeSiteSettings(data?.data || {})
      setSettings(mergedSettings)
      applySeoMetadata(mergedSettings)
      return mergedSettings
    } catch {
      const fallbackSettings = mergeSiteSettings({})
      setSettings(fallbackSettings)
      applySeoMetadata(fallbackSettings)
      return fallbackSettings
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSettings = useCallback(async (nextSettings) => {
    const normalizedSettings = normalizeSettingsForSave(nextSettings)
    await api.put('/settings', normalizedSettings)
    setSettings(normalizedSettings)
    applySeoMetadata(normalizedSettings)
    return normalizedSettings
  }, [])

  const getSetting = useCallback((key, fallback = '') => {
    const value = settings[key]
    return value !== undefined && value !== null ? value : fallback
  }, [settings])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  const value = useMemo(() => ({
    settings,
    loading,
    refreshSettings,
    saveSettings,
    getSetting,
  }), [settings, loading, refreshSettings, saveSettings, getSetting])

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext)
  if (!context) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider')
  }
  return context
}
