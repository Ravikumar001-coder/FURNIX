import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const emailInputRef = useRef(null)

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call for forgot password
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true)
      toast.success('Reset link sent to your email!')
    } catch (err) {
      toast.error('Failed to process request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-24 pb-20 px-4 min-h-screen flex flex-col items-center justify-center bg-surface-container-lowest">
      <Link to="/" className="mb-8 block">
        <h2 className="font-headline italic text-primary text-4xl tracking-tight text-center">Furnix</h2>
      </Link>

      <div className="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant/30 p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="text-center mb-8">
          <h1 className="font-headline text-2xl text-on-surface mb-2">Reset Password</h1>
          <p className="font-body text-sm text-on-surface-variant">
            {submitted ? 'Check your email inbox.' : 'Enter your email to receive a reset link.'}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-body text-on-surface-variant mb-1.5">Email address</label>
              <input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/50 px-4 py-3 rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-body text-base transition-all"
                required
                placeholder="you@example.com"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-on-primary py-3.5 rounded-xl font-body font-medium transition-all shadow-sm disabled:opacity-70 mt-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="bg-primary-container/20 text-primary p-4 rounded-xl font-body text-sm">
              We've sent a password reset link to <span className="font-semibold">{email}</span>. Please check your inbox and spam folder.
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="text-sm font-body text-on-surface-variant hover:text-primary transition-colors"
            >
              Try another email address
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center font-body text-sm text-on-surface-variant">
        Remembered your password? <Link to="/login" className="text-primary hover:underline font-medium">Back to login</Link>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
