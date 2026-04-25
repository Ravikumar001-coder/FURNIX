import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'

const CustomerLoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const emailInputRef = useRef(null)

  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/account')
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = useCallback(async (googleToken) => {
    setLoading(true)
    setErrorMsg('')
    try {
      await googleLogin(googleToken)
      toast.success('Successfully authenticated with Google!')
      navigate('/account')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to authenticate with Google'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [googleLogin, navigate])

  return (
    <div className="pt-24 pb-20 px-4 min-h-screen flex flex-col items-center justify-center bg-surface-container-lowest">
      <Link to="/" className="mb-8 block">
        <h2 className="font-headline italic text-primary text-4xl tracking-tight text-center">Furnix</h2>
      </Link>

      <div className="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant/30 p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="text-center mb-8">
          <h1 className="font-headline text-2xl text-on-surface mb-2">Welcome back</h1>
          <p className="font-body text-sm text-on-surface-variant">Access your workspace</p>
        </div>

        <div className="space-y-3 mb-6">
          <GoogleSignInButton onCredential={handleGoogleCredential} text="continue_with" />
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant/50"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-body">
            <span className="px-3 bg-surface-container-lowest text-on-surface-variant/70">Or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="bg-error-container/20 text-error text-sm font-body p-3 rounded-lg border border-error-container text-center">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-body text-on-surface-variant mb-1.5">Email address</label>
            <input
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/50 px-4 py-3 rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-body text-base transition-all"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-body text-on-surface-variant">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/50 px-4 py-3 pr-12 rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-body text-base transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-on-primary py-3.5 rounded-xl font-body font-medium transition-all shadow-sm disabled:opacity-70 mt-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4 text-sm font-body text-on-surface-variant">
          <Link to="/forgot-password" className="hover:text-primary transition-colors">Forgot password?</Link>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/70 mt-2">
            <Lock size={12} />
            <span>Secure login • Data encrypted</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center font-body text-sm text-on-surface-variant">
        New here? <Link to="/register" className="text-primary hover:underline font-medium">Create account</Link>
      </div>
    </div>
  )
}

export default CustomerLoginPage
