import React from "react";

export function GoogleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.02 0 12 0 7.35 0 3.39 2.67 1.47 6.56l3.89 3.02C6.31 6.89 8.94 5.04 12 5.04z" />
      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.62z" />
      <path fill="#FBBC05" d="M5.36 14.78a7.16 7.16 0 0 1 0-4.56L1.47 7.2a11.97 11.97 0 0 0 0 9.6l3.89-3.02z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.73-2.89c-1.04.7-2.37 1.11-4.23 1.11-3.06 0-5.69-1.85-6.64-4.54L1.47 17.8A11.96 11.96 0 0 0 12 24z" />
    </svg>
  );
}

export function AppleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05 1.88-3.08 1.88-1.03 0-1.36-.62-2.54-.62-1.19 0-1.56.61-2.54.62-1.03 0-2.22-1.02-3.21-1.97-2.02-1.95-3.56-5.5-3.56-8.83 0-5.28 3.44-8.08 6.83-8.08 1.07 0 2.08.38 2.74.38.66 0 1.91-.45 3.19-.45 1.34 0 2.58.49 3.39 1.28-3.07 1.81-2.57 5.86.5 7.1-1.19 2.87-2.74 5.75-4.47 7.77zM12.03 3.25c.57-.69.96-1.66.96-2.62 0-.13-.02-.26-.04-.38-.89.04-1.97.6-2.61 1.35-.54.62-.91 1.6-.91 2.53.02.13.04.25.07.35.95.07 1.96-.54 2.53-1.23z" />
    </svg>
  );
}

export default function SocialLoginButton({ provider = "Google", onClick, disabled = true }) {
  const isGoogle = provider.toLowerCase() === "google";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? `${provider} login coming soon` : `Sign in with ${provider}`}
      className="relative flex items-center justify-center gap-2.5 w-full h-[52px] px-4 rounded-[16px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm shadow-2xs transition-all duration-200 hover:border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      {isGoogle ? <GoogleIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <AppleIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-900" />}
      <span>{isGoogle ? "Google" : "Apple"}</span>
    </button>
  );
}
