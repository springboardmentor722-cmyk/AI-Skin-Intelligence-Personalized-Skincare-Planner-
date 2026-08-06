import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft } from "lucide-react";

export default function AssessmentFooter({
  currentStep,
  totalSteps = 8,
  canProceed,
  loading,
  onNext,
  onBack,
  statusText
}) {
  return (
    <div className="w-full max-w-5xl mx-auto mt-8 pt-4 flex items-center justify-between border-t border-amber-900/10">
      <div className="flex items-center gap-3">
        {currentStep > 1 && currentStep < totalSteps && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-900/80 bg-white/70 hover:bg-white backdrop-blur-md rounded-full shadow-sm border border-amber-900/10 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}
        <span className="text-xs text-amber-900/50 font-medium hidden sm:inline-block">
          {statusText}
        </span>
      </div>

      <button
        onClick={onNext}
        disabled={loading || !canProceed}
        className={`flex items-center gap-2.5 px-8 py-3.5 rounded-full font-semibold text-sm shadow-lg transition-all duration-300 cursor-pointer ${
          canProceed && !loading
            ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 hover:from-emerald-700 hover:to-amber-700 text-white shadow-emerald-900/20 hover:shadow-xl hover:scale-[1.02]"
            : "bg-amber-900/20 text-amber-900/40 cursor-not-allowed shadow-none"
        }`}
      >
        <span>
          {currentStep === 6
            ? (loading ? "Submitting Assessment..." : "Submit & Run AI Analysis")
            : currentStep === 7
            ? "Opening User Dashboard..."
            : "Next Step"}
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
