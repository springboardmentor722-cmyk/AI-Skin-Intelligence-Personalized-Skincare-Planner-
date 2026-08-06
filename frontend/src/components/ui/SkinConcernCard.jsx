import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle, Sparkles, Sliders } from "lucide-react";

/**
 * Premium Clinical Dermatology Skin Concern Card Component.
 * Reusable visual card featuring high-res dermatology close-up images,
 * 1-line descriptions, selection checkmarks, hover zoom animations,
 * severity range sliders with dynamic color gradients (Green->Yellow->Orange->Red),
 * and bonus typical symptoms breakdown.
 */
const SkinConcernCard = ({
  concern,
  isSelected = false,
  severity = 5,
  onToggle,
  onSeverityChange
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate severity badge color & label
  const getSeverityInfo = (val) => {
    if (val <= 3) {
      return {
        label: "Low / Mild",
        colorClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        thumbColor: "#10B981",
        gradient: "linear-gradient(to right, #10B981, #34D399)"
      };
    }
    if (val <= 6) {
      return {
        label: "Moderate",
        colorClass: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        thumbColor: "#F59E0B",
        gradient: "linear-gradient(to right, #10B981, #F59E0B)"
      };
    }
    if (val <= 8) {
      return {
        label: "High",
        colorClass: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        thumbColor: "#F97316",
        gradient: "linear-gradient(to right, #F59E0B, #F97316)"
      };
    }
    return {
      label: "Severe",
      colorClass: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      thumbColor: "#EF4444",
      gradient: "linear-gradient(to right, #F97316, #EF4444)"
    };
  };

  const severityInfo = getSeverityInfo(severity);

  const handleKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle(concern.id);
    }
  };

  return (
    <motion.div
      layout
      tabIndex={0}
      role="checkbox"
      aria-checked={isSelected}
      aria-label={`Select ${concern.title} skin concern. ${concern.description}`}
      onKeyDown={handleKeyDown}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={() => onToggle(concern.id)}
      className={`group relative rounded-[20px] overflow-hidden border cursor-pointer select-none transition-all duration-300 flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-teal-400 ${
        isSelected
          ? "border-teal-400 ring-2 ring-teal-400/30 bg-teal-950/40 dark:bg-teal-950/60 shadow-[0_12px_30px_rgba(20,184,166,0.25)]"
          : "border-slate-800 bg-slate-900/80 hover:border-teal-500/50 hover:bg-slate-900 hover:shadow-[0_10px_25px_rgba(20,184,166,0.15)]"
      }`}
    >
      {/* Top Clinical Image Container with Zoom & Skeleton Loader */}
      <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-slate-950">
        {/* Skeleton pulse while image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Loading Image...
            </span>
          </div>
        )}

        <img
          src={concern.image}
          alt={concern.alt || concern.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Gradient Overlay for clinical text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Checkbox Selection Badge (Top Right) */}
        <div
          className={`absolute top-3 right-3 w-7 h-7 rounded-xl border flex items-center justify-center transition-all duration-300 shadow-md ${
            isSelected
              ? "bg-gradient-to-r from-teal-400 to-blue-500 border-teal-300 text-slate-950 scale-110 shadow-teal-500/40"
              : "border-white/30 bg-slate-950/60 backdrop-blur-md text-transparent group-hover:border-white/60"
          }`}
        >
          <motion.div
            initial={false}
            animate={{ scale: isSelected ? 1 : 0.6, opacity: isSelected ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Check className="w-4 h-4 stroke-[3]" />
          </motion.div>
        </div>

        {/* Concern Title Badge overlay on image */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <span className="text-white font-extrabold text-sm sm:text-base tracking-tight drop-shadow-md">
            {concern.title}
          </span>
        </div>
      </div>

      {/* Card Body Content */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        {/* 1-Line Description */}
        <p className="text-xs text-slate-400 font-medium line-clamp-1 leading-relaxed">
          {concern.description}
        </p>

        {/* Typical Symptoms (Bonus breakdown when selected) */}
        <AnimatePresence>
          {isSelected && concern.symptoms && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-1.5 pt-2 border-t border-slate-800/80"
            >
              <span className="text-[10px] font-extrabold text-teal-300 uppercase tracking-wider block">
                Typical Symptoms
              </span>
              <div className="flex flex-wrap gap-1.5">
                {concern.symptoms.map((sym, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded-md"
                  >
                    • {sym}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Severity Slider (Appears upon Selection) */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()} // Prevent card toggle when adjusting slider
              className="pt-3 border-t border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300 text-[11px] font-bold flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-teal-400" /> Severity (0–10)
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${severityInfo.colorClass}`}
                >
                  {severity}/10 ({severityInfo.label})
                </span>
              </div>

              {/* Slider Track with Color Gradient (Green -> Yellow -> Orange -> Red) */}
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={severity}
                  aria-label={`${concern.title} severity grade out of 10`}
                  onChange={(e) => onSeverityChange(concern.id, Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-400"
                  style={{
                    background: severityInfo.gradient
                  }}
                />
              </div>

              <div className="flex justify-between text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                <span>Low (0)</span>
                <span>Moderate (5)</span>
                <span>High (10)</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SkinConcernCard;
