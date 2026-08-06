import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, Droplets, Moon, Flame, Camera, Award, FileText, Sparkles
} from "lucide-react";
import GlassCard from "../../components/ui/GlassCard";

const SCORE_DATA_DAILY = [
  { date: "Jul 10", score: 62, routine: 70 },
  { date: "Jul 15", score: 68, routine: 78 },
  { date: "Jul 20", score: 74, routine: 85 },
  { date: "Jul 25", score: 79, routine: 90 },
  { date: "Jul 30", score: 82, routine: 92 },
  { date: "Aug 04", score: 88, routine: 96 }
];

const LIFESTYLE_WEEKLY = [
  { day: "Mon", sleep: 7.5, hydration: 2.8 },
  { day: "Tue", sleep: 7.0, hydration: 2.5 },
  { day: "Wed", sleep: 8.0, hydration: 3.0 },
  { day: "Thu", sleep: 7.2, hydration: 2.7 },
  { day: "Fri", sleep: 8.5, hydration: 3.2 },
  { day: "Sat", sleep: 9.0, hydration: 3.0 },
  { day: "Sun", sleep: 8.0, hydration: 2.9 }
];

export default function Progress() {
  const [waterLiters, setWaterLiters] = useState(2.75);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [streak] = useState(14);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" /> Biometric Telemetry
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Skin Health Progress & Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track your 30-day skin health trajectory, hydration compliance, and rest logs.
          </p>
        </div>

        <button
          onClick={() => toast.success("Exporting clinical progress report...")}
          className="btn-gradient-primary px-6 py-3 rounded-full text-xs font-bold shadow-lg flex items-center gap-2"
        >
          <FileText className="w-4 h-4" /> Export Progress Report PDF
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6 space-y-3 border border-white/50">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase">
            <span>SKIN HEALTH INDEX</span>
            <span className="text-emerald-500 font-extrabold">+26% Gain</span>
          </div>
          <div className="text-4xl font-extrabold text-gray-900 dark:text-white">88 <span className="text-xs text-gray-400 font-normal">/ 100</span></div>
          <p className="text-xs text-gray-500">Baseline 62 → Current 88</p>
        </GlassCard>

        <GlassCard className="p-6 space-y-3 border border-white/50">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase">
            <span className="text-teal-600 flex items-center gap-1"><Droplets className="w-4 h-4" /> HYDRATION</span>
            <span>Target: 3.0L</span>
          </div>
          <div className="text-4xl font-extrabold text-teal-600 dark:text-teal-400">{waterLiters} L</div>
          <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(waterLiters/3)*100}%` }} />
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-3 border border-white/50">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase">
            <span className="text-purple-600 flex items-center gap-1"><Moon className="w-4 h-4" /> REST LOG</span>
            <span>Target: 8.0h</span>
          </div>
          <div className="text-4xl font-extrabold text-purple-600 dark:text-purple-400">{sleepHours} hrs</div>
          <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(sleepHours/8)*100}%` }} />
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-3 border border-white/50">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase">
            <span className="text-amber-500 flex items-center gap-1"><Flame className="w-4 h-4" /> STREAK</span>
            <span className="text-amber-500">🔥 On Fire</span>
          </div>
          <div className="text-4xl font-extrabold text-gray-900 dark:text-white">{streak} Days</div>
          <p className="text-xs text-gray-500">Consecutive AM/PM logs</p>
        </GlassCard>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-6 space-y-4 border border-white/50">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Skin Score Trend (30 Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SCORE_DATA_DAILY}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#18C8C8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#18C8C8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229,231,235,0.4)" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                <YAxis domain={[50, 100]} stroke="#9CA3AF" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderRadius: "12px", color: "#fff" }} />
                <Area type="monotone" dataKey="score" stroke="#18C8C8" strokeWidth={3} fill="url(#scoreGrad)" name="Health Score" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-4 border border-white/50">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Weekly Hydration vs Sleep Correlation</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={LIFESTYLE_WEEKLY}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229,231,235,0.4)" />
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderRadius: "12px", color: "#fff" }} />
                <Bar dataKey="sleep" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Sleep (hrs)" />
                <Bar dataKey="hydration" fill="#18C8C8" radius={[6, 6, 0, 0]} name="Water (L)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
