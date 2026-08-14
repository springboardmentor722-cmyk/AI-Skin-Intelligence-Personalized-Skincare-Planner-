import React, { useEffect, useRef } from 'react'

// Set this to your OAuth 2.0 Client ID from Google Cloud Console.
// See README section "Setting up Google OAuth2 login" for how to create one.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function GoogleSignInButton({ onCredential }) {
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const renderButton = () => {
      if (!window.google || !buttonRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      })
    }

    if (window.google) {
      renderButton()
    } else {
      // The GSI script loads async in index.html; poll briefly until it's ready.
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval)
          renderButton()
        }
      }, 200)
      return () => clearInterval(interval)
    }
  }, [onCredential])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="text-xs text-ink-faint text-center border border-dashed border-stone-200 rounded-xl py-3">
        Google login not configured. Set <code>VITE_GOOGLE_CLIENT_ID</code> in the frontend environment.
      </div>
    )
  }

  return <div ref={buttonRef} className="flex justify-center" />
}
