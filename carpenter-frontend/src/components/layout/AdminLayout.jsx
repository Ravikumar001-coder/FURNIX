import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const SIDEBAR_LINKS = [
  { label: 'Dashboard',          path: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Product Management', path: '/admin/products',  icon: 'chair' },
  { label: 'Order Queue',        path: '/admin/orders',    icon: 'receipt_long' },
  { label: 'Settings & CMS',     path: '/admin/settings',  icon: 'settings' },
]

const AdminLayout = ({ children }) => {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const isActive = (path) => path !== '#' && location.pathname.startsWith(path)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col md:flex-row overflow-hidden relative">

      {/* ── Mobile Header ────────────────────────────── */}
      <header className="md:hidden flex items-center justify-between p-4 bg-surface-container-low border-b border-outline-variant/20 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <img src="/logo.png" alt="Furnix" className="h-8 w-auto object-contain" />
        </div>
        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline text-sm font-bold">
          A
        </div>
      </header>

      {/* ── Mobile Drawer Overlay ────────────────────── */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── SideNavBar ─────────────────────────────── */}
      <nav className={`fixed inset-y-0 left-0 z-40 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 bg-surface-container-low text-on-surface font-body text-sm font-medium tracking-tight h-screen w-64 flex flex-col gap-2 p-6 shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out flex-shrink-0`}>
        
        {/* Mobile close button */}
        <button 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Brand */}
        <div className="mb-8 px-4 flex flex-col gap-2">
          <img src="/logo.png" alt="Furnix" className="h-10 w-auto object-contain self-start" />
          <p className="text-xs text-on-surface-variant mt-1">Managing the Craft</p>
        </div>

        {/* Nav links */}
        <ul className="flex flex-col gap-2 flex-1">
          {SIDEBAR_LINKS.map(({ label, path, icon }) => (
            <li key={path + label}>
              <button
                onClick={() => path !== '#' && navigate(path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                  isActive(path)
                    ? 'bg-primary text-on-primary shadow-lg'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1'
                }`}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={isActive(path) ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {icon}
                </span>
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* Sign out */}
        <div className="mt-auto px-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-on-surface-variant hover:bg-surface-container-high py-3 px-4 rounded-xl transition-colors duration-200 text-xs text-left"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Sign Out
          </button>
        </div>
      </nav>

      {/* ── Main Content Canvas ────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-background p-8 md:p-12 relative">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
