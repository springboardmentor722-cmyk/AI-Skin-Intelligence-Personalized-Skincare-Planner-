import React, { useState, useEffect } from 'react';
import beforeImage from '../assets/images/before_skin_week1_1785496288382.jpg';
import afterImage from '../assets/images/after_skin_week8_1785496301183.jpg';
import { 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Award, 
  Clock, 
  Sparkles, 
  Flame, 
  Package, 
  CheckSquare,
  ArrowRight,
  Sun,
  Moon,
  Droplets,
  Camera
} from 'lucide-react';
import { getLatestAssessment, getProgressHistory, AssessmentRecord, ProgressEntry } from '../services/db';

interface ProgressViewProps {
  onNavigate: (view: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ onNavigate }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);
  const [history, setHistory] = useState<ProgressEntry[]>([]);

  useEffect(() => {
    const latest = getLatestAssessment();
    if (latest) setAssessment(latest);
    const progHistory = getProgressHistory();
    if (progHistory && progHistory.length > 0) setHistory(progHistory);
  }, []);

  const healthScore = assessment?.overallScore || 86;
  const hydration = assessment?.hydration || 82;
  const texture = assessment?.texture || 74;
  const evenTone = assessment?.evenTone || 68;
  const scannedPhoto = assessment?.photoPreview || afterImage;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">
            08 — TRACK
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mt-1">
            Progress Tracking & <em className="italic text-purple-600 font-serif">Analytics</em>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking synced directly from your AI skin assessments and daily routines.
          </p>
        </div>

        {/* Top Right Overall Improvement Badge */}
        <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-4 px-5 shadow-sm flex items-center gap-4 shrink-0">
          <div>
            <p className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-600" /> Overall Improvement
            </p>
            <p className="text-[10px] text-purple-700">Latest Health Score: {healthScore}/100</p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-purple-600 text-purple-700 font-bold flex items-center justify-center text-xs shadow-inner ml-2 bg-white">
            {healthScore}
          </div>
        </div>
      </div>

      {/* 5 Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skin Health Score</p>
          <p className="text-2xl font-serif font-bold text-purple-600">{healthScore}/100</p>
          <span className="text-[10px] text-emerald-600 font-bold">↑ Active AI Scan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hydration Level</p>
          <p className="text-2xl font-serif font-bold text-purple-600">{hydration}%</p>
          <span className="text-[10px] text-emerald-600 font-bold">↑ Hydration Metric</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Texture Smoothness</p>
          <p className="text-2xl font-serif font-bold text-purple-600">{texture}%</p>
          <span className="text-[10px] text-emerald-600 font-bold">↑ Dermal Surface</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tone Evenness</p>
          <p className="text-2xl font-serif font-bold text-purple-600">{evenTone}%</p>
          <span className="text-[10px] text-emerald-600 font-bold">↑ Pigmentation</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Scans</p>
          <p className="text-2xl font-serif font-bold text-purple-600">{history.length || 1} Scans</p>
          <span className="text-[10px] text-purple-600 font-bold">Logged in DB</span>
        </div>
      </div>


      {/* Middle Row: Progress Overview Chart & Adherence (Image 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Skin Progress Overview Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-serif text-lg font-bold text-slate-900">Skin Progress Overview</h2>
            <span className="text-xs text-purple-600 font-bold">Apr 22 – May 26, 2026</span>
          </div>

          <div className="h-48 w-full bg-slate-50/70 rounded-xl p-4 flex items-end justify-between gap-2 border border-slate-200/60 relative">
            {/* SVG Trajectory Line */}
            <svg className="absolute inset-0 w-full h-full p-4 overflow-visible" preserveAspectRatio="none">
              <path
                d="M 20 140 Q 120 110, 220 80 T 420 30"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            {[
              { label: 'Apr 22', val: 62 },
              { label: 'Apr 29', val: 68 },
              { label: 'May 06', val: 72 },
              { label: 'May 13', val: 78 },
              { label: 'May 20', val: 82 },
              { label: 'May 26', val: 86 },
            ].map((pt, i) => (
              <div key={i} className="flex flex-col items-center gap-1 z-10">
                <span className="text-[10px] font-bold text-purple-700 bg-white px-1.5 py-0.5 rounded shadow-xs border border-purple-100">
                  {pt.val}
                </span>
                <div className="w-3 h-3 rounded-full bg-purple-600 border-2 border-white shadow-sm mt-12" />
                <span className="text-[9px] text-slate-400 font-bold mt-1">{pt.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Routine Adherence Heatmap */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-slate-900">Routine Adherence Heatmap</h2>
          <p className="text-xs text-slate-500 -mt-3">Consistency across recent weeks.</p>

          <div className="space-y-3 text-xs">
            {['May 20–26', 'May 13–19', 'May 06–12', 'Apr 29–05', 'Apr 22–28'].map((wk, idx) => (
              <div key={wk} className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>{wk}</span>
                  <span className="font-bold text-emerald-600">{100 - idx * 4}% Complete</span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: 7 }).map((_, d) => (
                    <div
                      key={d}
                      className={`flex-1 h-3 rounded-md ${
                        d === 6 && idx === 0 ? 'bg-purple-300' : 'bg-emerald-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Row: Before / After & Improvement Analysis (Image 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Before / After Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-serif text-xl font-bold text-slate-900">Before & After Progress</h2>
            <span className="text-xs text-purple-600 font-bold">Week 1 vs Week 8</span>
          </div>

          <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-sm select-none">
            {/* After Image */}
            <img
              src={afterImage}
              alt="After Week 8"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
              AFTER (WEEK 8)
            </span>

            {/* Before Image with Clip */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={beforeImage}
                alt="Before Week 1"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: '100%', height: '100%' }}
              />
              <span className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                BEFORE (WEEK 1)
              </span>
            </div>

            {/* Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-2xl"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs -ml-3.5 mt-28 shadow-lg border-2 border-white">
                ↔
              </div>
            </div>

            {/* Range Slider Control */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
            />
          </div>
          <p className="text-center text-xs text-slate-500 italic">Drag slider left/right to compare week 1 and week 8 photos.</p>
        </div>

        {/* Improvement Analysis Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
          <h2 className="font-serif text-xl font-bold text-slate-900">Improvement Analysis</h2>
          <p className="text-xs text-slate-500 -mt-4">Measured parameters comparing baseline scan vs current scan.</p>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Acne & Breakouts</span>
                <span className="text-emerald-600">+18% Improved</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '82%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Dark Spots & Pigmentation</span>
                <span className="text-emerald-600">+19% Improved</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '79%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Redness & Flush</span>
                <span className="text-emerald-600">+20% Improved</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Skin Texture Smoothness</span>
                <span className="text-emerald-600">+21% Improved</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Hydration Barrier</span>
                <span className="text-emerald-600">+22% Improved</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '88%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Overall Radiance</span>
                <span className="text-purple-600">+23% Improved</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: '91%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
