import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function ImageCard({
  id,
  title,
  description,
  imageSrc,
  isSelected,
  onSelect,
  isMultiSelect = false,
  badgeText,
  children
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <motion.div
      role={isMultiSelect ? "checkbox" : "radio"}
      aria-checked={isSelected}
      aria-selected={isSelected}
      tabIndex={0}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(id)}
      onKeyDown={handleKeyDown}
      className={`relative cursor-pointer rounded-[24px] p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
        isSelected
          ? "bg-white/95 ring-2 ring-emerald-500 shadow-xl shadow-emerald-900/10 border-transparent"
          : "bg-white/75 hover:bg-white/95 border border-amber-900/10 shadow-sm hover:shadow-md"
      } backdrop-blur-md`}
    >
      {/* Top Badge & Checkmark Indicator */}
      <div className="flex items-center justify-between w-full mb-3 z-10">
        {badgeText ? (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {badgeText}
          </span>
        ) : (
          <span />
        )}

        {/* Selected Checkmark Badge */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSelected
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-100"
              : "border-2 border-amber-900/20 bg-white/50 group-hover:border-emerald-400 scale-90"
          }`}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Image Illustration Container with Micro-Zoom */}
      <div className="w-full h-36 mb-4 flex items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-amber-50/40 via-emerald-50/20 to-transparent group-hover:scale-105 transition-transform duration-300 ease-out">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-contain max-h-32 drop-shadow-sm transition-transform duration-300"
        />
      </div>

      {/* Content Section */}
      <div className="text-left mt-auto space-y-1">
        <h3 className="text-base font-bold text-amber-950 group-hover:text-emerald-950 transition-colors flex items-center gap-1.5">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-amber-900/70 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Children Custom Slots (e.g. Characteristics list) */}
      {children}

      {/* Selection Soft Green Glow */}
      {isSelected && (
        <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none rounded-[24px]" />
      )}
    </motion.div>
  );
}
