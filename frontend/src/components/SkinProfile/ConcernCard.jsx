import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function ConcernCard({
  id,
  title,
  shortDescription,
  imageSrc,
  isSelected,
  onToggle
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onToggle(id)}
      className={`relative cursor-pointer rounded-[22px] p-5 transition-all duration-300 flex items-start gap-4 ${
        isSelected
          ? "bg-white/95 ring-2 ring-amber-500 shadow-lg shadow-amber-900/10 border-transparent"
          : "bg-white/70 hover:bg-white/90 border border-amber-900/10 shadow-sm hover:shadow-md"
      } backdrop-blur-md overflow-hidden group`}
    >
      {/* SVG Icon / Illustration Box */}
      <div className="w-16 h-16 shrink-0 rounded-2xl p-2 bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-900/5 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
        <img src={imageSrc} alt={title} className="w-full h-full object-contain" />
      </div>

      {/* Content Info */}
      <div className="flex-1 text-left">
        <div className="flex items-center justify-between pr-6">
          <h4 className="text-base font-bold text-amber-950 group-hover:text-amber-700 transition-colors">
            {title}
          </h4>
        </div>
        <p className="text-xs text-amber-900/65 mt-1 leading-relaxed line-clamp-2">
          {shortDescription}
        </p>
      </div>

      {/* Check Icon Badge Top Right */}
      <div className="absolute top-4 right-4">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSelected
              ? "bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/30 scale-100"
              : "border-2 border-amber-900/20 bg-white/40 group-hover:border-amber-400 scale-90"
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>

      {/* Selection Glow Effect */}
      {isSelected && (
        <div className="absolute inset-0 bg-amber-500/5 pointer-events-none rounded-[22px]" />
      )}
    </motion.div>
  );
}
