import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function BrandHeader({
  logoText = "Skin Intelligence",
  subtitleText = "AI Personalized Skincare Planner"
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center gap-3.5 select-none"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#14b8a6] via-[#3b82f6] to-[#8b5cf6] flex items-center justify-center shadow-md shadow-teal-500/15 ring-2 ring-white/80 shrink-0">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div className="flex flex-col justify-center">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
          {logoText}
        </h2>
        <p className="text-[11px] font-semibold text-slate-700 tracking-wider uppercase mt-0.5">
          {subtitleText}
        </p>
      </div>
    </motion.div>
  );
}
