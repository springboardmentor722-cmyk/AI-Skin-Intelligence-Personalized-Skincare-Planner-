import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck } from "lucide-react";

export default function AssessmentLayout({
  title,
  subtitle,
  badgeText = "Clinical Skincare Diagnostic",
  children
}) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        {badgeText && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-900 text-xs font-semibold tracking-wide mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>{badgeText}</span>
          </div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-amber-950 tracking-tight"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-xs sm:text-sm text-amber-900/70 leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* Grid Content Slot */}
      {children}
    </div>
  );
}
