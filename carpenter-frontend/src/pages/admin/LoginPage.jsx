import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock, User, Loader2, Eye, EyeOff } from 'lucide-react'
import logo from '/assets/furnix-logo.png'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim()) {
      toast.error('Please enter username and password')
      return
    }

    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Access Granted')
      navigate('/admin/dashboard')
    } catch (err) {
      toast.error('Invalid Credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-container-lowest px-4">
      <Link to="/" className="mb-10 block">
        <img src={logo} alt="Furnix" className="h-20 md:h-25 w-auto object-contain mx-auto" />
      </Link>

      <div className="w-full max-w-[440px] bg-white border border-outline-variant/30 p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
        
        <div className="text-center mb-10">
          <h1 className="font-headline text-2xl text-on-surface mb-2 tracking-tight">Admin Portal</h1>
          <p className="font-body text-xs text-on-surface-variant uppercase tracking-[0.2em]">Secure Access Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-body text-on-surface-variant mb-1">Username</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="Admin username"
                className="w-full bg-surface-container-low border border-outline-variant/50 pl-11 pr-4 py-3.5 rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-body text-base transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-body text-on-surface-variant mb-1">Password</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full bg-surface-container-low border border-outline-variant/50 pl-11 pr-12 py-3.5 rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-body text-base transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl bg-primary hover:bg-primary/95 text-on-primary font-body font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <span className="material-symbols-outlined text-[20px]">login</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-body uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            Authorized Personnel Only
          </div>
        </div>
      </div>

      <Link to="/" className="mt-10 font-body text-on-surface-variant hover:text-primary transition-colors text-sm uppercase tracking-widest flex items-center gap-2">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Return to Gallery
      </Link>
    </div>
  )
}

export default LoginPage
