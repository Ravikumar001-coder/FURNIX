import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Loader2, Phone, MessageSquare, X } from 'lucide-react'

const WhatsAppLoginModal = ({ isOpen, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [step, setStep] = useState('PHONE') // PHONE, OTP, PROFILE
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)

  const { whatsappRequestOtp, whatsappVerifyOtp, updateProfile } = useAuth()

  useEffect(() => {
    let interval
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  if (!isOpen) return null

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    setLoading(true)
    try {
      await whatsappRequestOtp(phoneNumber)
      toast.success('OTP sent successfully to WhatsApp!')
      setStep('OTP')
      setTimer(60)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      toast.error('Please enter 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      const data = await whatsappVerifyOtp(phoneNumber, otp)
      
      // If user has no name, go to profile completion
      if (!data.fullName || data.fullName.includes('@whatsapp.furnix.com') || data.fullName === phoneNumber) {
        setStep('PROFILE')
      } else {
        toast.success('Successfully logged in!')
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteProfile = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter your name')
      return
    }

    setLoading(true)
    try {
      await updateProfile({ fullName: name })
      toast.success('Profile completed! Welcome to Furnix.')
      onClose()
    } catch (err) {
      toast.error('Failed to update profile. You can do this later in settings.')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30">
        <div className="relative p-6 sm:p-8">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-surface-container-high rounded-full transition-colors"
          >
            <X size={20} className="text-on-surface-variant" />
          </button>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[#25D366]/10 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare size={32} className="text-[#25D366]" />
            </div>
            <h2 className="font-headline text-2xl text-on-surface">
              {step === 'PROFILE' ? 'Verified Successfully!' : 'WhatsApp Login'}
            </h2>
            <p className="font-body text-sm text-on-surface-variant mt-2">
              {step === 'PHONE' 
                ? 'We will send a 6-digit verification code to your WhatsApp' 
                : step === 'OTP'
                  ? `Enter the code sent to ${phoneNumber}`
                  : 'Welcome! Please tell us your name to finish setting up your account.'}
            </p>
          </div>

          {step === 'PHONE' ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-body font-medium text-on-surface-variant mb-2">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body font-medium text-on-surface-variant">+91</span>
                  <input
                    type="tel"
                    placeholder="Enter 10-12 digit number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    className="w-full bg-surface-container-low border border-outline-variant/50 pl-14 pr-4 py-3.5 rounded-xl text-on-surface focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366] outline-none font-body text-lg transition-all"
                    autoFocus
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || phoneNumber.length < 10}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-body font-bold text-sm uppercase tracking-widest transition-all shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Get OTP on WhatsApp'}
              </button>
            </form>
          ) : step === 'OTP' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-body font-medium text-on-surface-variant mb-2">Verification Code</label>
                <input
                  type="text"
                  placeholder="0 0 0 0 0 0"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-surface-container-low border border-outline-variant/50 px-4 py-4 rounded-xl text-on-surface focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366] outline-none font-body text-2xl tracking-[0.5em] text-center font-bold transition-all"
                  autoFocus
                  required
                />
              </div>
              
              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-body font-bold text-sm uppercase tracking-widest transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Verify & Login'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="text-on-surface-variant hover:text-primary font-body text-sm font-medium transition-colors"
                >
                  Change Phone Number
                </button>

                <div className="text-center">
                  {timer > 0 ? (
                    <span className="text-xs text-on-surface-variant font-body">Resend in {timer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-xs text-primary hover:underline font-body font-semibold"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCompleteProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-body font-medium text-on-surface-variant mb-2">Your Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ravi Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/50 px-4 py-3.5 rounded-xl text-on-surface focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366] outline-none font-body text-lg transition-all"
                  autoFocus
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-body font-bold text-sm uppercase tracking-widest transition-all shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Finish & Start Shopping'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default WhatsAppLoginModal
