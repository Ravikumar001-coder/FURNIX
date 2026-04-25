import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form,    setForm]    = useState({ username: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.username.trim() || !form.password.trim()) {
      setError('Please enter username and password')
      return
    }

    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/admin/dashboard')
    } catch (err) {
      setError('INVALID USERNAME OR PASSWORD. PLEASE TRY AGAIN.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-on-surface flex items-center justify-center p-6 overflow-hidden">
      <div className="pointer-events-none absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        <div className="text-center mb-10">
          <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 300" }}>
            weekend
          </span>
          <h1 className="mt-3 font-headline italic text-primary text-5xl tracking-tight">The Artisanal Atelier</h1>
          <p className="mt-1 font-body text-on-surface-variant uppercase tracking-[0.22em] text-sm">Admin Portal</p>
        </div>

        <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant/35 shadow-[0_12px_28px_-10px_rgba(27,28,25,0.15)] overflow-hidden">
          <div className="h-1 w-full bg-primary" />

          <form onSubmit={handleSubmit} className="p-10 space-y-7">
            <div>
              <label className="font-headline text-[30px] leading-none text-on-surface block mb-3">Username</label>
              <div className="flex items-center gap-3 bg-surface-container-high rounded-sm px-4 py-3.5 border border-transparent focus-within:border-outline">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">person</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full bg-transparent border-none outline-none font-body text-base placeholder:text-on-surface-variant/70 text-on-surface"
                />
              </div>
            </div>

            <div>
              <label className="font-headline text-[30px] leading-none text-on-surface block mb-3">Password</label>
              <div className="flex items-center gap-3 bg-surface-container-high rounded-sm px-4 py-3.5 border border-transparent focus-within:border-outline">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">lock</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-transparent border-none outline-none font-body text-base placeholder:text-on-surface-variant/70 text-on-surface"
                />
              </div>
            </div>

            {error && <p className="text-error text-sm font-body">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-body text-2xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Signing In...' : 'Sign In'}
              {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
            </button>
          </form>
        </div>

        <Link to="/" className="mt-10 font-body text-on-surface-variant hover:text-primary transition-colors text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Return to Store
        </Link>
      </div>
    </div>
  )
}

export default LoginPage
