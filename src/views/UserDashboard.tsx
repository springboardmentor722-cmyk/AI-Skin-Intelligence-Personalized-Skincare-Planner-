import React from 'react';
import { ArrowRight, CheckCircle2, Sparkles, Sun, Moon, Droplets, Shield, Bell } from 'lucide-react';

interface UserDashboardProps {
  user: any;
  onNavigate: (view: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ user, onNavigate }) => {
  const displayName = user?.name || 'Ananya Verma';

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">SUNDAY, JULY 30</p>
          <h1 className="font-serif text-3xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            Good morning, {displayName} <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">Here's what your skin is asking for today.</p>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-purple-600 transition relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
          </button>

          <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-2xl border border-slate-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{displayName}</p>
              <p className="text-[10px] text-purple-600 font-semibold">Premium Member</p>
            </div>
          </div>
        </div>
      </header>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">SKIN HEALTH SCORE</p>
            <h2 className="text-3xl font-serif font-bold text-purple-600 mt-1">
              {user?.skinHealthScore || 86}<span className="text-xs font-normal text-slate-400">/100</span>
            </h2>
            <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              ↑ 8% this month
            </span>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-purple-100 border-t-purple-600 flex items-center justify-center text-purple-600 text-lg font-bold">
            ✦
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">SKIN TYPE</p>
          <h3 className="text-lg font-bold text-slate-800 mt-1">{user?.skinType || 'Combination'}</h3>
          <p className="text-xs text-slate-500 mt-1">Balanced cheeks, slightly oily T-zone</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">TOP FOCUS</p>
          <h3 className="text-lg font-bold text-purple-600 mt-1">{user?.primaryConcern || 'Clarity & Glow'}</h3>
          <p className="text-xs text-slate-500 mt-1">Post-acne marks & barrier balance</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">HYDRATION</p>
          <h3 className="text-lg font-bold text-emerald-600 mt-1">Good</h3>
          <p className="text-xs text-slate-500 mt-1">1.8 L of 2.5 L target today</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Ritual */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-purple-600 tracking-wider uppercase">YOUR RITUAL</p>
              <h2 className="font-serif text-xl font-bold text-slate-900 mt-0.5">Today's Skincare Care</h2>
            </div>
            <button
              onClick={() => onNavigate('routine')}
              className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
            >
              View Routine <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-800 font-medium">
              <Sun className="w-4 h-4 text-amber-500" />
              <span><strong>Morning Ritual:</strong> Cleanse, Vitamin C, Hydrate, SPF 50</span>
            </div>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Completed
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center py-2">
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <Droplets className="w-5 h-5 mx-auto text-purple-600 mb-1" />
              <p className="text-xs font-bold text-slate-800">1. Cleanse</p>
              <p className="text-[10px] text-slate-500">Gentle gel cleanser</p>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <Sparkles className="w-5 h-5 mx-auto text-purple-600 mb-1" />
              <p className="text-xs font-bold text-slate-800">2. Treat</p>
              <p className="text-[10px] text-slate-500">Vitamin C Serum</p>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <Shield className="w-5 h-5 mx-auto text-purple-600 mb-1" />
              <p className="text-xs font-bold text-slate-800">3. Protect</p>
              <p className="text-[10px] text-slate-500">Sun Veil SPF 50</p>
            </div>
          </div>

          <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <Moon className="w-4 h-4 text-indigo-500" />
              <span><strong>Tonight's Evening Ritual:</strong> Cleanse, Niacinamide, Barrier Cream</span>
            </div>
            <button
              onClick={() => onNavigate('routine')}
              className="bg-indigo-600 text-white font-semibold text-[11px] px-3.5 py-1.5 rounded-lg hover:bg-indigo-700 transition"
            >
              Begin
            </button>
          </div>
        </div>

        {/* Quick Insights Column */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <p className="text-[10px] font-bold text-purple-600 tracking-wider uppercase">SOLUNA NOTES</p>
            <h2 className="font-serif text-xl font-bold text-slate-900 mt-0.5">For your skin today</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-100 text-purple-900 space-y-1">
              <p className="font-bold">A little extra hydration</p>
              <p className="text-slate-600 leading-relaxed">Your skin will love a hyaluronic acid serum tonight after mild outdoor exposure.</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 space-y-1">
              <p className="font-bold">Keep sunscreen close</p>
              <p className="text-slate-600 leading-relaxed">UV index is expected to peak around 1:00 PM today.</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 space-y-1">
              <p className="font-bold">7-Day Consistency Streak!</p>
              <p className="text-slate-600 leading-relaxed">Your barrier resilience score improved by 4 points this week.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
