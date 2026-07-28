import { Sparkles, Heart, ArrowRight } from "lucide-react";
import StepIndicator from "./StepIndicator";

export default function WelcomeStep({ onStart, onSkip }) {
  return (
    <div className="text-center">
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-pink-200">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-semibold bg-gradient-to-r from-violet-700 to-pink-600 bg-clip-text text-transparent">
          Skin AI
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Your skin. Our science. Your glow.</p>
        <div className="flex items-center gap-2 text-gray-300 mt-3">
          <span className="w-6 h-px bg-gray-300" />
          <Heart className="w-3.5 h-3.5 text-pink-400" />
          <span className="w-6 h-px bg-gray-300" />
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-display font-semibold text-gray-800 mb-2 leading-snug">
        Let's personalize
        <br />
        your skincare journey
      </h2>
      <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
        Answer a few simple questions so our AI can create the perfect routine for you.
      </p>

      <div className="mb-8">
        <StepIndicator currentStep={0} />
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100 p-6 mb-6">
        <p className="text-6xl mb-2">🌸</p>
        <p className="text-sm font-medium text-gray-700">Let's start with you.</p>
        <p className="text-xs text-gray-500 mt-1">Beautiful skin begins with understanding.</p>
      </div>

      <button
        onClick={onStart}
        className="w-full rounded-full bg-gradient-to-r from-violet-600 to-pink-500 text-white font-medium py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-pink-200 hover:opacity-95 active:scale-[0.99] transition-all"
      >
        Start Assessment
        <ArrowRight className="w-4 h-4" />
      </button>

      <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 mt-4 underline-offset-2 hover:underline">
        Skip for now
      </button>
    </div>
  );
}