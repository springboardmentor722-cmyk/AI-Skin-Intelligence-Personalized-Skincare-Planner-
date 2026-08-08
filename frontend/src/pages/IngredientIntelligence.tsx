import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';

export default function IngredientIntelligence() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntelligence = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('http://localhost:8000/api/v1/ingredients/intelligence', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIngredients(data);
        }
      } catch (err) {
        console.error("Failed to fetch ingredient intelligence", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIntelligence();
  }, []);

  const filtered = ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in font-serif">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#001534] tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-[#9f7c46]" /> Ingredient Intelligence
          </h1>
          <p className="text-slate-500 mt-2 font-sans">Analyze ingredient suitability, interactions, and potential allergy conflicts dynamically based on your profile.</p>
        </div>
        <div className="relative w-full md:w-72 font-sans">
          <input 
            type="text" 
            placeholder="Search ingredients..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-[#d6c7b0] rounded-full focus:ring-1 focus:ring-[#001534] outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-[#9f7c46] font-bold font-sans">Loading your personal safety analysis...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
          {filtered.map((item, idx) => (
            <div key={idx} className={`bg-white p-6 rounded-3xl border shadow-sm transition hover:shadow-md ${!item.safe ? 'border-red-200' : 'border-[#e5dfd1]'}`}>
              
              {/* Header */}
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#f0ebe1]">
                <div>
                  <h3 className="text-2xl font-bold text-[#001534] font-serif">{item.name}</h3>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9f7c46] block mt-1">{item.category}</span>
                </div>
              </div>

              {/* 1. Ingredient Education */}
              <div className="mb-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">1. Ingredient Education</span>
                <p className="text-slate-700 text-sm leading-relaxed">{item.description}</p>
              </div>

              {/* 2. Suitability Assessment */}
              <div className="mb-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">2. Suitability Assessment</span>
                {item.safe ? (
                  <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-green-100">
                    <CheckCircle className="w-4 h-4" /> Recommended for your current skin profile
                  </div>
                ) : (
                  <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100">
                    <ShieldAlert className="w-4 h-4" /> Not recommended for your current skin profile
                  </div>
                )}
              </div>

              {/* 3. Allergy Detection */}
              <div className="mb-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">3. Allergy Detection</span>
                {!item.safe && item.warning ? (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start gap-2 border border-red-100">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{item.warning}</span>
                  </div>
                ) : (
                  <div className="bg-slate-50 text-slate-500 p-3 rounded-xl text-sm border border-slate-100">
                    No allergy conflicts detected with your profile.
                  </div>
                )}
              </div>

              {/* 4. Interaction Analysis */}
              <div className="bg-[#fdfbf5] p-4 rounded-xl border border-[#efe8de]">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">4. Interaction Analysis</span>
                <ul className="text-sm text-slate-700 list-disc pl-4 space-y-1">
                  {item.conflicts.map((conflict: string, i: number) => (
                    <li key={i}>{conflict}</li>
                  ))}
                </ul>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
