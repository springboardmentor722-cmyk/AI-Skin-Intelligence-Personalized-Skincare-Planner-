import React from 'react';
import { FlaskConical, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

interface IngredientAnalyzerViewProps {
  onNavigate: (view: string) => void;
}

export const IngredientAnalyzerView: React.FC<IngredientAnalyzerViewProps> = () => {
  const ingredients = [
    { name: 'Niacinamide', status: 'Suitable', note: 'Balances oil, strengthens skin barrier, reduces dark spots.' },
    { name: 'Hyaluronic Acid', status: 'Suitable', note: 'Boosts hydration and supports a plump complexion.' },
    { name: 'Vitamin C', status: 'Suitable', note: 'Brightens uneven tone and provides antioxidant shield.' },
    { name: 'Salicylic Acid', status: 'Use Carefully', note: 'Effective for congestion; introduce slowly to avoid dryness.' },
    { name: 'Synthetic Fragrance', status: 'Avoid', note: 'May trigger reactive redness based on your profile.' },
  ];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">07 — INGREDIENTS</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mt-1">
          Ingredient <em className="italic text-purple-600 font-serif">Analyzer</em>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Skin Intelligence ingredient matching — understand what is suitable for your barrier, what to avoid, and why.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="font-serif text-lg font-bold text-slate-900">Your Ingredient Compatibility</h2>
        <div className="space-y-3">
          {ingredients.map((ing) => (
            <div key={ing.name} className="p-4 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-900">{ing.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{ing.note}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-3 py-1 rounded-full shrink-0 ${
                  ing.status === 'Suitable'
                    ? 'bg-emerald-50 text-emerald-700'
                    : ing.status === 'Avoid'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {ing.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
