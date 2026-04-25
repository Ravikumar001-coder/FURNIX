import { useEffect, useRef, useState } from 'react'

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let googleScriptPromise = null

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }

  if (googleScriptPromise) {
    return googleScriptPromise
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google script')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

const GoogleSignInButton = ({
  onCredential,
  text = 'continue_with',
  className = '',
}) => {
  const buttonRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    if (!clientId) {
      setError('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID.')
      return
    }

    const renderButton = () => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
        return
      }

      const width = buttonRef.current.parentElement?.offsetWidth
        ? Math.max(220, Math.min(400, buttonRef.current.parentElement.offsetWidth))
        : 320

      buttonRef.current.innerHTML = ''
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            onCredential(response.credential)
            return
          }
          setError('Google did not return a credential. Please try again.')
        },
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        type: 'standard',
        text,
        width,
      })
    }

    loadGoogleScript()
      .then(() => {
        setError('')
        renderButton()
      })
      .catch(() => {
        setError('Unable to load Google sign-in right now.')
      })

    return () => {
      cancelled = true
    }
  }, [onCredential, text])

  return (
    <div className={className}>
      <div ref={buttonRef} className="w-full flex justify-center" />
      {error ? (
        <p className="mt-2 text-xs text-error text-center font-body">{error}</p>
      ) : null}
    </div>
  )
}

export default GoogleSignInButton
