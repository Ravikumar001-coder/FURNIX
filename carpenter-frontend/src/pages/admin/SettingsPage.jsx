import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layout/AdminLayout'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { DEFAULT_SITE_SETTINGS, SETTINGS_FORM_SECTIONS } from '../../utils/siteSettings'

const renderField = (field, value, onChange) => {
  if (field.type === 'textarea') {
    return (
      <textarea
        name={field.key}
        value={value}
        onChange={onChange}
        className="w-full bg-surface-container-high border-none rounded px-4 py-2 focus:ring-2 focus:ring-primary outline-none min-h-[92px] resize-y"
      />
    )
  }

  return (
    <input
      type={field.type || 'text'}
      name={field.key}
      value={value}
      onChange={onChange}
      className="w-full bg-surface-container-high border-none rounded px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
    />
  )
}

const SettingsPage = () => {
  const { settings, loading, saveSettings } = useSiteSettings()
  const [formSettings, setFormSettings] = useState(DEFAULT_SITE_SETTINGS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFormSettings(prev => ({ ...prev, ...settings }))
  }, [settings])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormSettings(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const saved = await saveSettings(formSettings)
      setFormSettings(saved)
      toast.success('Settings saved successfully')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save settings'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-bold text-on-surface mb-2">Settings and CMS</h1>
          <p className="font-body text-on-surface-variant">
            Manage brand, contact, business profile, social proof, and SEO metadata from one place.
          </p>
        </div>

        {loading ? (
          <div className="animate-pulse bg-surface-container-low h-96 rounded-2xl" />
        ) : (
          <form onSubmit={handleSave} className="space-y-8 bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20">
            {SETTINGS_FORM_SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="font-headline text-xl text-primary mb-4 border-b border-outline-variant/30 pb-2">
                  {section.title}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {section.fields.map((field) => (
                    <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-on-surface mb-1">{field.label}</label>
                      {renderField(field, formSettings[field.key] || '', handleChange)}
                      <p className="mt-1 text-[11px] text-on-surface-variant">{field.key}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <div className="flex justify-end pt-4 border-t border-outline-variant/30">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-on-primary px-6 py-2 rounded font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  )
}

export default SettingsPage
