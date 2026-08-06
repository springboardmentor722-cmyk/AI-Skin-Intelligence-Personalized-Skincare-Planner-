import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function SeveritySlider({
  concernId,
  title,
  imageSrc,
  value = 5,
  onChange
}) {
  const getSeverityLabel = (val) => {
    if (val <= 1) return { label: "Minimal", color: "text-slate-600", bg: "bg-slate-100 border-slate-200" };
    if (val <= 3) return { label: "Mild", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
    if (val <= 6) return { label: "Moderate", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
    if (val <= 8) return { label: "High", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
    return { label: "Severe", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" };
  };

  const severityInfo = getSeverityLabel(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-white/85 backdrop-blur-md rounded-[22px] p-6 border border-amber-900/10 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl p-1.5 bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-900/5 flex items-center justify-center shrink-0">
            {imageSrc ? (
              <img src={imageSrc} alt={title} className="w-full h-full object-contain" />
            ) : (
              <Activity className="w-6 h-6 text-emerald-600" />
            )}
          </div>
          <div>
            <h4 className="text-base font-bold text-amber-950">{title}</h4>
            <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${severityInfo.bg} ${severityInfo.color} mt-0.5`}>
              {severityInfo.label}
            </span>
          </div>
        </div>

        {/* Value Indicator Pill */}
        <motion.div
          key={value}
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-end"
        >
          <div className="text-2xl font-extrabold text-amber-950 font-mono tracking-tight flex items-baseline gap-1">
            <span>{value}</span>
            <span className="text-xs text-amber-900/40 font-sans font-normal">/ 10</span>
          </div>
        </motion.div>
      </div>

      {/* Range Slider Control */}
      <div className="relative pt-2 pb-1">
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={value}
          onChange={(e) => onChange(concernId, parseInt(e.target.value, 10))}
          className="w-full h-3 bg-amber-900/10 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />

        <div className="flex justify-between text-[10px] font-medium text-amber-900/50 mt-2 px-1">
          <span>0 (Minimal)</span>
          <span>3 (Mild)</span>
          <span>5 (Moderate)</span>
          <span>8 (High)</span>
          <span>10 (Severe)</span>
        </div>
      </div>
    </motion.div>
  );
}
