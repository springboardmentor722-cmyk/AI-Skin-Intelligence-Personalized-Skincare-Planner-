import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function Stepper({ currentStep, totalSteps = 8, steps = [] }) {
  return (
    <div className="w-full max-w-5xl mx-auto mb-6 px-2">
      {/* Step Numbers & Labels Grid */}
      <div className="flex items-center justify-between relative">
        {/* Background Progress Line */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-amber-900/10 -z-0 rounded-full" />
        <motion.div
          className="absolute top-4 left-0 h-1 bg-gradient-to-r from-emerald-500 to-amber-600 -z-0 rounded-full"
          animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        {steps.map((st, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={idx} className="flex flex-col items-center z-10">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : isActive
                    ? "bg-gradient-to-tr from-amber-600 to-emerald-600 text-white ring-4 ring-emerald-500/20 shadow-lg shadow-amber-900/10 scale-110"
                    : "bg-white border-2 border-amber-900/15 text-amber-900/50"
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
              </motion.div>
              <span
                className={`text-[10px] sm:text-[11px] font-semibold mt-2 hidden sm:block transition-colors ${
                  isActive ? "text-amber-950 font-bold" : isDone ? "text-emerald-800" : "text-amber-900/40"
                }`}
              >
                {st.shortName || st.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
