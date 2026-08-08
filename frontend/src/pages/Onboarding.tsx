import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [skinType, setSkinType] = useState('Combination');
  const [concerns, setConcerns] = useState<string[]>(['Acne']);

  const skinTypes = ['Dry', 'Oily', 'Combination', 'Sensitive', 'Normal'];
  const concernList = ['Acne & Breakouts', 'Fine Lines & Wrinkles', 'Hyperpigmentation', 'Redness & Rosacea', 'Uneven Texture', 'Dark Circles'];

  const toggleConcern = (item: string) => {
    if (concerns.includes(item)) {
      setConcerns(concerns.filter((c) => c !== item));
    } else {
      setConcerns([...concerns, item]);
    }
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span className="font-serif font-bold text-xl text-white">DermaAI Onboarding</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
            Step {step} of 2
          </span>
        </div>

        {step === 1 ? (
          <div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">What is your skin type?</h2>
            <p className="text-sm text-slate-400 mb-6">Select the option that best describes your baseline skin state.</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {skinTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSkinType(type)}
                  className={`p-4 rounded-2xl border text-left font-semibold text-sm transition cursor-pointer ${
                    skinType === type
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">Select your primary concerns</h2>
            <p className="text-sm text-slate-400 mb-6">Choose any skin goals or areas you want to target.</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {concernList.map((item) => (
                <button
                  key={item}
                  onClick={() => toggleConcern(item)}
                  className={`p-4 rounded-2xl border text-left font-semibold text-sm transition cursor-pointer flex items-center justify-between ${
                    concerns.includes(item)
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{item}</span>
                  {concerns.includes(item) && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </button>
              ))}
            </div>
            <button
              onClick={handleFinish}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              Complete Setup
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
