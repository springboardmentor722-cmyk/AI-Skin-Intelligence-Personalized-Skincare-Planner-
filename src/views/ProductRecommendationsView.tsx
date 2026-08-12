import React, { useState } from 'react';
import { PRODUCTS } from '../data/mockData';
import { Sparkles, ShieldCheck, Check, ChevronDown, Download, Bookmark, ExternalLink } from 'lucide-react';

interface ProductRecommendationsViewProps {
  onNavigate: (view: string) => void;
}

export const ProductRecommendationsView: React.FC<ProductRecommendationsViewProps> = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'ingredients' | 'routine'>('products');
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filters = ['All', 'Cleanser', 'Treatment', 'Moisturizer', 'Sun Protection'];

  const filteredProducts = activeFilter === 'All'
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.typeFilter === activeFilter);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div className="space-y-1 max-w-2xl">
          <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">
            05 — RECOMMENDATIONS
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900">
            Your Personalized <em className="italic text-purple-600 font-serif">Recommendations</em>
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed pt-1">
            AI-curated skincare products and ingredients tailored to your skin needs, lifestyle, and goals. Safe. Smart. Personalized.
          </p>
        </div>

        {/* Top Right Recommendation Match Ring */}
        <div className="bg-white border border-purple-100 rounded-2xl p-4 px-5 shadow-sm flex items-center gap-4 shrink-0">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Recommendation Match</p>
            <p className="text-[10px] text-slate-500">High compatibility with your skin profile and concerns.</p>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-purple-600 text-purple-700 font-bold flex items-center justify-center text-sm shadow-inner ml-2">
            92%
          </div>
        </div>
      </div>

      {/* Main Grid: Left Products Column, Right Sidebar Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Tabs Header */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-8 border-b border-slate-100 pb-3 text-xs font-semibold text-slate-500">
              <button
                onClick={() => setActiveTab('products')}
                className={`pb-3 relative transition ${
                  activeTab === 'products' ? 'text-purple-600 font-bold' : 'hover:text-purple-600'
                }`}
              >
                Product Recommendations
                {activeTab === 'products' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('ingredients')}
                className={`pb-3 relative transition ${
                  activeTab === 'ingredients' ? 'text-purple-600 font-bold' : 'hover:text-purple-600'
                }`}
              >
                Ingredient Recommendations
              </button>
              <button
                onClick={() => setActiveTab('routine')}
                className={`pb-3 relative transition ${
                  activeTab === 'routine' ? 'text-purple-600 font-bold' : 'hover:text-purple-600'
                }`}
              >
                Routine Overview
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeFilter === f
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200/60 hover:bg-slate-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 bg-white cursor-pointer">
                <span>Sort by: <strong>Relevance</strong></span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Product Cards List - Exact Image 3 Layout */}
            <div className="space-y-4 pt-2">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-purple-200 hover:shadow-md transition"
                >
                  {/* Left: Product Image */}
                  <div className="w-20 h-24 bg-slate-50 rounded-xl p-2 flex items-center justify-center shrink-0 border border-slate-100">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Column 1: Title & Category */}
                  <div className="space-y-1.5 min-w-[150px]">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{p.name}</h3>
                    <p className="text-xs text-slate-500">{p.category} · {p.size}</p>
                    <span className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100">
                      {p.matchBadge}
                    </span>
                  </div>

                  {/* Column 2: Key Ingredients */}
                  <div className="space-y-1 text-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Key Ingredients</p>
                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                      {p.keyIngredients.map((ing) => (
                        <span
                          key={ing}
                          className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-md"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Compatibility Circle Badge */}
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Compatibility</p>
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500 text-emerald-700 font-bold text-sm flex items-center justify-center mx-auto">
                      {p.compatibilityScore}%
                    </div>
                    <p className="text-[10px] font-semibold text-emerald-600">{p.compatibilityLabel}</p>
                  </div>

                  {/* Column 4: Benefits Bullet points */}
                  <div className="space-y-1 text-xs text-slate-600 max-w-[180px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Why it's good for you</p>
                    <ul className="space-y-1 text-[11px]">
                      {p.benefits.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-slate-700">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Button */}
                  {p.buyUrl ? (
                    <a
                      href={p.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-purple-200 text-purple-700 font-semibold text-xs px-3.5 py-2 rounded-xl hover:bg-purple-50 transition shrink-0 self-end md:self-center flex items-center gap-1.5"
                    >
                      <span>View details</span>
                      <ExternalLink className="w-3 h-3 text-purple-600" />
                    </a>
                  ) : (
                    <button className="border border-purple-200 text-purple-700 font-semibold text-xs px-3.5 py-2 rounded-xl hover:bg-purple-50 transition shrink-0 self-end md:self-center">
                      View details
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Card Banner */}
            <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                These recommendations are based on your skin type, concerns, lifestyle, and ingredient compatibility. AI updates recommendations as your skin evolves.
              </span>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Allergy & Sensitivity Check */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Allergy & Sensitivity Check</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              We checked these products against your allergy & sensitivity profile.
            </p>

            <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-xs space-y-1 text-emerald-800">
              <p className="font-bold flex items-center gap-1.5 text-emerald-700">
                <Check className="w-4 h-4 text-emerald-600" /> No allergy risks detected
              </p>
              <p className="text-[11px] text-emerald-600">
                All recommended products are safe for your profile.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Detected Sensitivities</p>
              <div className="flex gap-2">
                <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-lg border border-purple-100 font-medium">
                  Fragrance
                </span>
                <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-lg border border-purple-100 font-medium">
                  Essential Oils
                </span>
              </div>
            </div>
          </div>

          {/* Top Concerns Addressed */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Top Concerns Addressed</h3>
            <div className="space-y-3 text-xs">
              {[
                { name: 'Acne', pct: 85 },
                { name: 'Dark Spots', pct: 80 },
                { name: 'Uneven Tone', pct: 75 },
                { name: 'Dehydration', pct: 90 },
                { name: 'Oil Control', pct: 82 },
              ].map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>{c.name}</span>
                    <span className="font-bold text-purple-600">{c.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note Advisory */}
          <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-2xl text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Note</p>
            <p className="text-[11px] leading-relaxed">
              Always patch test new products. Discontinue use if irritation occurs.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between bg-slate-100/80 p-4 px-6 rounded-2xl border border-slate-200">
        <p className="text-xs text-slate-600">Saved to your skin workspace profile.</p>
        <div className="flex items-center gap-3">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm">
            <Bookmark className="w-3.5 h-3.5" /> Save recommendations
          </button>
          <button className="bg-white border border-slate-300 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50 transition flex items-center gap-2">
            <Download className="w-3.5 h-3.5" /> Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
};
