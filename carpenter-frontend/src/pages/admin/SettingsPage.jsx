import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layout/AdminLayout'

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    'hero.title': '',
    'hero.subtitle': '',
    'contact.phone': '',
    'contact.email': '',
    'seo.description': ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings')
      if (data.data && Object.keys(data.data).length > 0) {
        setSettings(prev => ({ ...prev, ...data.data }))
      }
    } catch (error) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/settings', settings)
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-bold text-on-surface mb-2">CMS Settings</h1>
          <p className="font-body text-on-surface-variant">Update public-facing website content dynamically.</p>
        </div>

        {loading ? (
          <div className="animate-pulse bg-surface-container-low h-96 rounded-2xl"></div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8 bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20">
            
            {/* Homepage Section */}
            <div>
              <h2 className="font-headline text-xl text-primary mb-4 border-b border-outline-variant/30 pb-2">Homepage content</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Hero Title</label>
                  <input 
                    type="text" 
                    name="hero.title" 
                    value={settings['hero.title']} 
                    onChange={handleChange}
                    className="w-full bg-surface-container-high border-none rounded px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="E.g., Handcrafted Excellence"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Hero Subtitle</label>
                  <textarea 
                    name="hero.subtitle" 
                    value={settings['hero.subtitle']} 
                    onChange={handleChange}
                    className="w-full bg-surface-container-high border-none rounded px-4 py-2 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                    placeholder="E.g., Discover bespoke furniture tailored to your space."
                  />
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div>
              <h2 className="font-headline text-xl text-primary mb-4 border-b border-outline-variant/30 pb-2">Contact Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Support Phone</label>
                  <input 
                    type="text" 
                    name="contact.phone" 
                    value={settings['contact.phone']} 
                    onChange={handleChange}
                    className="w-full bg-surface-container-high border-none rounded px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Support Email</label>
                  <input 
                    type="email" 
                    name="contact.email" 
                    value={settings['contact.email']} 
                    onChange={handleChange}
                    className="w-full bg-surface-container-high border-none rounded px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SEO Section */}
            <div>
              <h2 className="font-headline text-xl text-primary mb-4 border-b border-outline-variant/30 pb-2">SEO Metadata</h2>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Global Meta Description</label>
                <textarea 
                  name="seo.description" 
                  value={settings['seo.description']} 
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border-none rounded px-4 py-2 focus:ring-2 focus:ring-primary outline-none h-20 resize-none"
                />
              </div>
            </div>

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
