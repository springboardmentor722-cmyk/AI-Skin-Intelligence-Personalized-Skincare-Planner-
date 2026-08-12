import React, { useState, useEffect } from 'react';
import { 
  Award, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Moon, 
  Droplets, 
  BarChart3, 
  Clock, 
  Calendar,
  Check
} from 'lucide-react';
import { getLatestAssessment, AssessmentRecord } from '../services/db';

interface ScoreViewProps {
  onNavigate: (view: string) => void;
}

export const ScoreView: React.FC<ScoreViewProps> = ({ onNavigate }) => {
  const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);

  useEffect(() => {
    const latest = getLatestAssessment();
    if (latest) setAssessment(latest);
  }, []);

  const score = assessment?.overallScore ?? 78;
  const skinType = assessment?.skinType || 'Combination';
  const hydration = assessment?.hydration ?? 82;
  const texture = assessment?.texture ?? 74;
  const evenTone = assessment?.evenTone ?? 68;
  const elasticity = assessment?.elasticity ?? 76;
  const oilBalance = assessment?.oilBalance ?? 71;

  const getStatusEmoji = (val: number) => (val >= 75 ? '🟢' : val >= 50 ? '🟡' : '🔴');
  const getStatusText = (val: number) => (val >= 80 ? 'Excellent' : val >= 60 ? 'Good' : 'Needs Care');

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">
            07 — SCORE
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mt-1">
            Skin Health Scoring <em className="italic text-purple-600 font-serif">Engine</em>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Calculated directly from your uploaded face scan and clinical AI skin analysis.
          </p>
        </div>

        {/* Top Right Improvement Badge */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 px-5 shadow-sm flex items-center gap-4 shrink-0">
          <div>
            <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Live AI Health Rating
            </p>
            <p className="text-[10px] text-emerald-700">Calculated for {skinType} skin profile</p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 text-emerald-700 font-bold flex items-center justify-center text-xs shadow-inner ml-2 bg-white">
            {score}
          </div>
        </div>
      </div>

      {/* Main Hero Score Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Big Score Ring & Banner (7 cols) */}
        <div className="lg:col-span-7 flex flex-col sm:flex-row items-center gap-8">
          <div className="relative w-36 h-36 rounded-full border-8 border-purple-600 border-l-purple-200 flex flex-col items-center justify-center text-center shrink-0 shadow-lg shadow-purple-600/10 bg-white">
            <span className="font-serif text-4xl font-bold text-slate-900">{score}</span>
            <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">/100 {score >= 80 ? 'EXCELLENT' : score >= 60 ? 'GOOD' : 'FAIR'}</span>
            <span className="absolute -bottom-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              Live Synced Scan
            </span>
          </div>

          <div className="space-y-3 text-center sm:text-left">
            <h2 className="font-serif text-2xl font-bold text-slate-900">Your skin is evaluated as {skinType}!</h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              "{assessment?.notes || 'Keep following your routine and healthy habits to maintain and further improve your skin health.'}"
            </p>
            <button
              onClick={() => onNavigate('assessment')}
              className="p-3 bg-purple-50/80 hover:bg-purple-100/80 rounded-xl border border-purple-100 inline-flex items-center gap-2 text-xs font-bold text-purple-900 transition"
            >
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>✦ Run New AI Skin Assessment →</span>
            </button>
          </div>
        </div>

        {/* Right Metric List (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60 space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Component Breakdown</p>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100">
              <span className="font-medium text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600" /> Skin Condition Assessment
              </span>
              <span className="font-bold text-slate-900">{score}/100 {getStatusEmoji(score)}</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100">
              <span className="font-medium text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Hydration Level
              </span>
              <span className="font-bold text-slate-900">{hydration}/100 {getStatusEmoji(hydration)}</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100">
              <span className="font-medium text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Texture Smoothness
              </span>
              <span className="font-bold text-slate-900">{texture}/100 {getStatusEmoji(texture)}</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100">
              <span className="font-medium text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Tone Evenness
              </span>
              <span className="font-bold text-slate-900">{evenTone}/100 {getStatusEmoji(evenTone)}</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100">
              <span className="font-medium text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500" /> Elasticity & Firmness
              </span>
              <span className="font-bold text-slate-900">{elasticity}/100 {getStatusEmoji(elasticity)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Weighted Scoring Model & Component Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Weighted Scoring Model */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="font-serif text-xl font-bold text-slate-900">Weighted Scoring Model</h2>
          <p className="text-xs text-slate-500 -mt-4">How your score is calculated across different dimensions.</p>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut Chart Visual */}
            <div className="w-40 h-40 relative flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-purple-600" strokeWidth="4" strokeDasharray="35, 100" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-emerald-500" strokeWidth="4" strokeDasharray="20, 100" strokeDashoffset="-35" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-blue-500" strokeWidth="4" strokeDasharray="15, 100" strokeDashoffset="-55" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-amber-500" strokeWidth="4" strokeDasharray="20, 100" strokeDashoffset="-70" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-cyan-500" strokeWidth="4" strokeDasharray="10, 100" strokeDashoffset="-90" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-serif text-2xl font-bold text-slate-900">{score}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">SCORE</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs flex-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-purple-600" /> Skin Condition
                </span>
                <span className="font-bold text-slate-900">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" /> Hydration Level
                </span>
                <span className="font-bold text-slate-900">20%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-blue-500" /> Texture Smoothness
                </span>
                <span className="font-bold text-slate-900">15%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-amber-500" /> Tone Evenness
                </span>
                <span className="font-bold text-slate-900">20%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-cyan-500" /> Elasticity & Firmness
                </span>
                <span className="font-bold text-slate-900">10%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Component Scores Bars */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
          <h2 className="font-serif text-xl font-bold text-slate-900">Component Scores</h2>
          <p className="text-xs text-slate-500 -mt-4">Detailed scores for each evaluated category.</p>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Skin Condition Assessment</span>
                <span className="text-purple-600">{score} / 100 {getStatusText(score)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: `${score}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Hydration Level</span>
                <span className="text-emerald-600">{hydration} / 100 {getStatusText(hydration)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${hydration}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Texture Smoothness</span>
                <span className="text-blue-600">{texture} / 100 {getStatusText(texture)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${texture}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Tone Evenness</span>
                <span className="text-amber-600">{evenTone} / 100 {getStatusText(evenTone)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${evenTone}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Elasticity & Firmness</span>
                <span className="text-cyan-600">{elasticity} / 100 {getStatusText(elasticity)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${elasticity}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Score History & Key Insights (Image 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score History */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="font-serif text-xl font-bold text-slate-900">Score History</h2>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">May 20 – May 26, 2026</p>
                <p className="text-[10px] text-slate-500">Latest weekly assessment</p>
              </div>
              <span className="font-serif text-lg font-bold text-purple-700">86/100 <span className="text-xs text-emerald-600">↑ 8%</span></span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">May 13 – May 19, 2026</p>
                <p className="text-[10px] text-slate-500">Previous week</p>
              </div>
              <span className="font-serif text-lg font-bold text-slate-700">78/100 <span className="text-xs text-emerald-600">↑ 6%</span></span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">May 6 – May 12, 2026</p>
                <p className="text-[10px] text-slate-500">2 weeks ago</p>
              </div>
              <span className="font-serif text-lg font-bold text-slate-700">72/100 <span className="text-xs text-emerald-600">↑ 7%</span></span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Apr 29 – May 5, 2026</p>
                <p className="text-[10px] text-slate-500">3 weeks ago</p>
              </div>
              <span className="font-serif text-lg font-bold text-slate-700">65/100 <span className="text-xs text-emerald-600">↑ 5%</span></span>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="font-serif text-xl font-bold text-slate-900">Key Insights</h2>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Routine consistency is excellent!
              </p>
              <p className="text-emerald-700 text-[11px]">You've completed 90% of your scheduled morning & night steps this week.</p>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
              <p className="font-bold text-blue-900 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-blue-600" /> Try improving sleep duration
              </p>
              <p className="text-blue-700 text-[11px]">Getting 7.5+ hours of sleep can boost your cellular repair score by up to 10%.</p>
            </div>

            <div className="p-3.5 bg-purple-50 border border-purple-100 rounded-xl space-y-1">
              <p className="font-bold text-purple-900 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-purple-600" /> Hydration can be better
              </p>
              <p className="text-purple-700 text-[11px]">Increasing water intake to 2.2L daily will help smooth fine lines further.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
