import React, { useState } from 'react';
import { Sun, Moon, Sparkles, Check } from 'lucide-react';

interface RoutinePlannerViewProps {
  onNavigate: (view: string) => void;
}

export const RoutinePlannerView: React.FC<RoutinePlannerViewProps> = ({ onNavigate }) => {
  const [toast, setToast] = useState(false);

  const morningSteps = [
    { step: 1, title: 'Gentle Cleanser', desc: 'Hydrating Gel Cleanser' },
    { step: 2, title: 'Antioxidant Serum', desc: 'Vitamin C 15% Serum' },
    { step: 3, title: 'Moisturizer', desc: 'Lightweight Ceramide Cream' },
    { step: 4, title: 'Sun Protection', desc: 'Sun Veil Broad Spectrum SPF 50+' },
  ];

  const eveningSteps = [
    { step: 1, title: 'Double Cleanse', desc: 'Gentle Cleansing Oil & Gel' },
    { step: 2, title: 'Targeted Treatment', desc: 'Niacinamide 10% + Zinc' },
    { step: 3, title: 'Nourishing Night Cream', desc: 'Moon Milk Restorative Cream' },
  ];

  const handleSave = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">04 — ROUTINE GENERATOR</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mt-1">
          Personalized Routine <em className="italic text-purple-600 font-serif">Generator</em>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Custom morning and evening rituals tailored to your skin assessment, climate, and daily schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Morning Column */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-amber-600 border-b border-slate-100 pb-3">
            <Sun className="w-5 h-5" />
            <div>
              <h2 className="font-serif text-lg font-bold text-slate-900">Morning Ritual</h2>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Protect & Prepare</p>
            </div>
          </div>

          <div className="space-y-3">
            {morningSteps.map((s) => (
              <div key={s.step} className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center">
                  {s.step}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">{s.title}</p>
                  <p className="text-[11px] text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evening Column */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-indigo-600 border-b border-slate-100 pb-3">
            <Moon className="w-5 h-5" />
            <div>
              <h2 className="font-serif text-lg font-bold text-slate-900">Evening Ritual</h2>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Repair & Rejuvenate</p>
            </div>
          </div>

          <div className="space-y-3">
            {eveningSteps.map((s) => (
              <div key={s.step} className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-800 text-xs font-bold flex items-center justify-center">
                  {s.step}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">{s.title}</p>
                  <p className="text-[11px] text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-purple-900 font-medium">
          ✦ Your routine evolves automatically as your skin health score updates.
        </p>
        <button
          onClick={handleSave}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-6 py-3 rounded-xl transition shadow-md shadow-purple-600/20 whitespace-nowrap"
        >
          Save routine preferences →
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> Routine preferences saved!
        </div>
      )}
    </div>
  );
};
