import React, { useState, useEffect } from 'react';
import { Sun, Moon, Calendar, RefreshCw, Info } from 'lucide-react';

export default function RoutineGenerator() {
  const [activeTab, setActiveTab] = useState<'morning' | 'evening' | 'weekly'>('morning');
  const [routine, setRoutine] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoutine = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/v1/routines/recommendations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoutine(data);
      }
    } catch (err) {
      console.error("Failed to fetch routine", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutine();
  }, []);

  const weeklyRoutine = [
    { day: 'Sunday', plan: 'Deep Hydration Mask (15 mins)' },
    { day: 'Wednesday', plan: 'AHA Chemical Peel (Leave on for 10 mins)' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001534]"></div>
      </div>
    );
  }

  const morningRoutine = routine?.morning_routine || [];
  const eveningRoutine = routine?.evening_routine || [];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#001534] tracking-tight">Personalized Routine Generator</h1>
          <p className="text-slate-500 mt-2">Adaptive skincare routines tailored to your profile and current lifestyle data.</p>
        </div>
        <button 
          onClick={fetchRoutine}
          className="flex items-center gap-2 bg-[#fdfbf5] border border-[#d6c7b0] text-[#001534] px-5 py-2.5 rounded-full font-medium shadow-sm hover:bg-[#efe8de] transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Update Routine
        </button>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-[#e5dfd1] flex flex-wrap gap-2 mb-8 w-fit">
        <button 
          onClick={() => setActiveTab('morning')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${activeTab === 'morning' ? 'bg-[#efe8de] text-[#001534]' : 'text-slate-500 hover:text-[#001534]'}`}
        >
          <Sun className="w-5 h-5" /> Morning
        </button>
        <button 
          onClick={() => setActiveTab('evening')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${activeTab === 'evening' ? 'bg-[#001534] text-white' : 'text-slate-500 hover:text-[#001534]'}`}
        >
          <Moon className="w-5 h-5" /> Evening
        </button>
        <button 
          onClick={() => setActiveTab('weekly')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${activeTab === 'weekly' ? 'bg-[#9f7c46] text-white' : 'text-slate-500 hover:text-[#001534]'}`}
        >
          <Calendar className="w-5 h-5" /> Weekly Plan
        </button>
      </div>

      {activeTab === 'morning' && (
        <div className="space-y-4 animate-fadeIn">
          {morningRoutine.length === 0 && <p className="text-slate-500">No morning routine found.</p>}
          {morningRoutine.map((item: any) => (
            <div key={item.step_number} className="bg-white p-6 rounded-2xl border border-[#e5dfd1] shadow-sm flex items-start gap-6 hover:shadow-md transition">
              <div className="w-12 h-12 bg-[#efe8de] text-[#9f7c46] rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                {item.step_number}
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9f7c46] block mb-1">{item.product.product_type}</span>
                <h3 className="text-xl font-bold text-[#001534] mb-2">{item.product.name}</h3>
                <p className="text-slate-600 flex items-start gap-2 text-sm mb-3">
                  <Info className="w-4 h-4 text-[#9f7c46] flex-shrink-0 mt-0.5" /> 
                  <span>{item.product.description} <br/><span className="text-xs italic mt-1 block font-medium text-slate-500">{item.instructions}</span></span>
                </p>
                {item.recovery_details && (
                  <div className="bg-[#fdfbf5] border border-[#d6c7b0] p-3 rounded-xl text-sm text-[#001534]">
                    <span className="font-bold block mb-1">Recovery Strategy:</span>
                    {item.recovery_details}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'evening' && (
        <div className="space-y-4 animate-fadeIn">
          {eveningRoutine.length === 0 && <p className="text-slate-500">No evening routine found.</p>}
          {eveningRoutine.map((item: any) => (
            <div key={item.step_number} className="bg-[#fdfbf5] p-6 rounded-2xl border border-[#e5dfd1] shadow-sm flex items-start gap-6 hover:shadow-md transition">
              <div className="w-12 h-12 bg-[#001534] text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                {item.step_number}
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9f7c46] block mb-1">{item.product.product_type}</span>
                <h3 className="text-xl font-bold text-[#001534] mb-2">{item.product.name}</h3>
                <p className="text-slate-600 flex items-start gap-2 text-sm mb-3">
                  <Info className="w-4 h-4 text-[#9f7c46] flex-shrink-0 mt-0.5" /> 
                  <span>{item.product.description} <br/><span className="text-xs italic mt-1 block font-medium text-slate-500">{item.instructions}</span></span>
                </p>
                {item.recovery_details && (
                  <div className="bg-[#fdfbf5] border border-[#d6c7b0] p-3 rounded-xl text-sm text-[#001534]">
                    <span className="font-bold block mb-1">Recovery Strategy:</span>
                    {item.recovery_details}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {weeklyRoutine.map((item, idx) => (
            <div key={idx} className="bg-gradient-to-br from-[#fdfbf5] to-white p-8 rounded-2xl border border-[#e5dfd1] shadow-sm hover:shadow-md transition">
              <h3 className="text-2xl font-serif text-[#001534] mb-4">{item.day} Treatment</h3>
              <p className="text-slate-600 font-medium">{item.plan}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
