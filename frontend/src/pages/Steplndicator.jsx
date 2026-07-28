import { Check } from "lucide-react";

const STEPS = [
  { number: 1, label: "Skin Profile" },
  { number: 2, label: "Concerns & Sensitivities" },
  { number: 3, label: "Lifestyle Habits" },
];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((step, idx) => {
        const isComplete = currentStep > step.number;
        const isActive = currentStep === step.number;
        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 w-16 sm:w-20">
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold shrink-0 transition-all ${
                  isComplete || isActive
                    ? "bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-md shadow-pink-200"
                    : "bg-white border-2 border-gray-200 text-gray-400"
                }`}
              >
                {isComplete ? <Check className="w-4 h-4" strokeWidth={3} /> : step.number}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] text-center leading-tight font-medium ${
                  isActive ? "text-violet-700" : isComplete ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-6 sm:w-10 -mt-5 rounded-full ${
                  currentStep > step.number ? "bg-gradient-to-r from-violet-600 to-pink-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}