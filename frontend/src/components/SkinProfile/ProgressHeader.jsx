import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Sparkles, ShieldCheck } from "lucide-react";

export default function ProgressHeader({ currentStep, totalSteps, stepTitles, onBack }) {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4">
      {/* Top Controls & Badge Header */}
      <div className="flex items-center justify-between mb-4">
        {currentStep > 1 ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-900/80 bg-white/70 hover:bg-white backdrop-blur-md rounded-full shadow-sm hover:shadow transition-all duration-200 border border-amber-900/10 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-900 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>AI Clinical Onboarding</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-amber-900/60 uppercase">
            Step {currentStep} of {totalSteps}
          </span>
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
        </div>
      </div>

      {/* Title & Subtitle for Active Step */}
      <div className="text-center my-6">
        <motion.h1
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-3xl sm:text-4xl font-serif font-bold text-amber-950 tracking-tight"
        >
          {stepTitles[currentStep - 1]?.title || "Skin Intelligence"}
        </motion.h1>
        <motion.p
          key={`sub-${currentStep}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="text-sm sm:text-base text-amber-900/70 mt-1 max-w-lg mx-auto"
        >
          {stepTitles[currentStep - 1]?.subtitle}
        </motion.p>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-2.5 bg-amber-900/10 rounded-full overflow-hidden backdrop-blur-sm p-0.5 border border-white/60">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 via-rose-400 to-amber-600 rounded-full shadow-sm"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        {stepTitles.map((st, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;

          return (
            <div key={idx} className="flex flex-col items-center">
              <div
                className={`text-[11px] font-medium transition-colors duration-200 truncate ${
                  isActive
                    ? "text-amber-900 font-bold"
                    : isDone
                    ? "text-amber-700/80"
                    : "text-amber-900/40"
                }`}
              >
                {st.shortName}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
