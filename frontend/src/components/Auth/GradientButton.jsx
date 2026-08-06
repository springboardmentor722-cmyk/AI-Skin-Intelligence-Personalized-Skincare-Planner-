import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

export default function GradientButton({
  children = "Access Dashboard",
  type = "submit",
  onClick,
  disabled = false,
  loading = false,
  className = "",
  showArrow = true,
  ...props
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? {} : { scale: 1.01, y: -2 }}
      whileTap={disabled || loading ? {} : { scale: 0.99, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`group relative w-full h-[60px] rounded-[18px] text-white font-bold text-base tracking-wide shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-75 disabled:cursor-not-allowed overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(135deg, #1AA8A8 0%, #3B82F6 50%, #5B6DFF 100%)"
      }}
      {...props}
    >
      {/* Subtle shine highlight */}
      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-white" />
          <span>Accessing Dashboard...</span>
        </div>
      ) : (
        <>
          <span>{children}</span>
          {showArrow && (
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1.5" />
          )}
        </>
      )}
    </motion.button>
  );
}
