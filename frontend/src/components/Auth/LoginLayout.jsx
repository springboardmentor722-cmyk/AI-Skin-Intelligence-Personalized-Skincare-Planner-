import React from "react";
import heroBg from "../../assets/backgrounds/hero-bg.jpg";
import loginBg from "../../assets/backgrounds/login-bg.jpg";

/**
 * Centered SaaS Healthcare Login Layout Component.
 * Removes side hero promotional panels, focusing 100% on the centered login card
 * over a subtle blurred skincare background with gradient overlay.
 */
export default function LoginLayout({ children }) {
  const bgImg = loginBg || heroBg;

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans overflow-x-hidden select-none selection:bg-teal-500/20 selection:text-teal-600">
      {/* Full-Screen Subtle Blurred Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transform-gpu scale-105 filter blur-[6px]"
        style={{ backgroundImage: `url(${bgImg})` }}
        aria-hidden="true"
      />

      {/* Dark/Light Gradient Overlay for High Readability & Contrast */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950/75 via-slate-900/65 to-teal-950/70 backdrop-blur-sm pointer-events-none" />

      {/* Centered Login Card Container (Width: 460px – 520px, Rounded 24px) */}
      <div className="relative z-10 w-full max-w-[490px] my-auto">
        {children}
      </div>
    </div>
  );
}
