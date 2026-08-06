import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Sparkles, Sun, Moon, Droplets, ArrowRight, CheckCircle2,
  Circle, FlaskConical, ShoppingBag, Sliders, Plus, Minus, Bell, Clock, Eye, TrendingUp, Award, Activity, AlertCircle, RefreshCw, FileText, ShieldCheck
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import milestone3Service from "../../services/milestone3Service";
import { useAuth } from "../../context/Authcontext";
import GlassCard from "../../components/ui/GlassCard";
import SkinGauge from "../../components/ui/SkinGauge";
import AIInsightsPanel from "../../components/dashboard/AIInsightsPanel";
import { printClinicalReport } from "../../utils/reportExporter";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Local interactive state
  const [morningDone, setMorningDone] = useState(true);
  const [eveningDone, setEveningDone] = useState(false);
  const [waterLiters, setWaterLiters] = useState(2.5);
  const [sleepHours, setSleepHours] = useState(7.5);

  useEffect(() => {
    fetchDash();
  }, []);

  const fetchDash = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await milestone3Service.getDashboardData();
      if (data) {
        setDashData(data);
        if (data.todays_routine || data.routine) {
          const r = data.todays_routine || data.routine;
          setMorningDone(r.morning_completed ?? true);
          setEveningDone(r.evening_completed ?? false);
        }
        if (data.hydration_tracker) {
          setWaterLiters(data.hydration_tracker.current_liters ?? 2.5);
        }
        if (data.sleep_tracker) {
          setSleepHours(data.sleep_tracker.current_hours ?? 7.5);
        }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleWaterChange = (delta) => {
    const newVal = Math.max(0, Math.min(5, Math.round((waterLiters + delta) * 10) / 10));
    setWaterLiters(newVal);
    toast.success(`Hydration logged: ${newVal} L`);
  };

  const handleSleepChange = (delta) => {
    const newVal = Math.max(0, Math.min(12, Math.round((sleepHours + delta) * 10) / 10));
    setSleepHours(newVal);
    toast.success(`Sleep logged: ${newVal} hrs`);
  };

  const handleDownloadReport = () => {
    printClinicalReport({
      name: userName,
      score: score,
      skin_type: dashData?.user_info?.skin_type || "Combination",
      concerns: dashData?.user_info?.concerns || "Acne, Hyperpigmentation",
      risk_level: dashData?.risk_level || "Low Risk"
    });
  };

  const score = dashData?.skin_health_score || 85;
  const userName = dashData?.user?.display_name || dashData?.user_info?.name || user?.name || "Alex";

  const chartData = [
    { day: "Mon", score: 68 },
    { day: "Tue", score: 72 },
    { day: "Wed", score: 75 },
    { day: "Thu", score: 79 },
    { day: "Fri", score: 82 },
    { day: "Sat", score: 84 },
    { day: "Sun", score: score }
  ];

  // 1. Loading State
  if (loading) {
    return (
      <GlassCard className="p-12 text-center my-12 flex flex-col items-center justify-center min-h-[350px] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <p className="text-sm font-bold text-cyan-400">Loading Biometric Dashboard Telemetry...</p>
      </GlassCard>
    );
  }

  // 2. Error Boundary State
  if (error) {
    return (
      <GlassCard className="p-10 text-center my-12 space-y-6 max-w-xl mx-auto border-red-500/30 bg-red-500/5">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white">Unable to Load Dashboard</h2>
          <p className="text-xs text-slate-300">
            We encountered a network issue or timeout while connecting to the telemetry server.
          </p>
        </div>
        <button
          onClick={fetchDash}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs hover:opacity-90 transition-all inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <RefreshCw className="w-4 h-4" /> Retry Loading Dashboard
        </button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. Welcome Banner */}
      <GlassCard className="p-8 md:p-10 border border-slate-700/60 shadow-2xl relative overflow-hidden bg-gradient-to-r from-cyan-500/10 via-blue-600/10 to-purple-600/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Biometric Telemetry Command Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, {userName}! ✨
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Your epidermal moisture barrier is at <strong className="text-cyan-400">{score}/100 (Optimal Status)</strong>. Continue applying SPF 50 Mineral Sunscreen and Ceramide night balm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadReport}
              className="px-5 py-2.5 rounded-full border border-slate-700 bg-slate-900/80 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-cyan-400" /> Export Clinical PDF
            </button>
            <button
              onClick={() => navigate("/skin-assessment")}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-xl shadow-cyan-500/25 hover:opacity-95 transition-all flex items-center gap-2"
            >
              <span>Run AI Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 2. Top Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Skin Health Score Gauge */}
        <GlassCard className="p-6 flex flex-col items-center justify-between border border-slate-700/60">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Skin Health</span>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
              Optimal
            </span>
          </div>

          <SkinGauge score={score} size={170} label="Epidermal Index" subtitle="+14% vs Last Week" />
        </GlassCard>

        {/* Hydration Tracker */}
        <GlassCard className="p-6 flex flex-col justify-between border border-slate-700/60">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" /> Daily Hydration
              </span>
              <span className="text-xs font-bold text-cyan-400">Target: 3.0 L</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{waterLiters}</span>
              <span className="text-sm font-semibold text-slate-400">Liters Logged</span>
            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (waterLiters / 3.0) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => handleWaterChange(-0.25)}
              className="flex-1 bg-slate-900 border border-slate-700 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-1"
            >
              <Minus className="w-3.5 h-3.5" /> 250ml
            </button>
            <button
              onClick={() => handleWaterChange(0.25)}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 250ml
            </button>
          </div>
        </GlassCard>

        {/* Sleep Tracker */}
        <GlassCard className="p-6 flex flex-col justify-between border border-slate-700/60">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Moon className="w-4 h-4 text-purple-400" /> Rest & Cell Repair
              </span>
              <span className="text-xs font-bold text-purple-400">Target: 8.0 hrs</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{sleepHours}</span>
              <span className="text-sm font-semibold text-slate-400">Hours Rested</span>
            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (sleepHours / 8.0) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => handleSleepChange(-0.5)}
              className="flex-1 bg-slate-900 border border-slate-700 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-1"
            >
              <Minus className="w-3.5 h-3.5" /> 30m
            </button>
            <button
              onClick={() => handleSleepChange(0.5)}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 30m
            </button>
          </div>
        </GlassCard>

      </div>

      {/* 3. Progress Chart & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recharts Line Chart */}
        <GlassCard className="lg:col-span-7 p-6 space-y-4 border-slate-700/60">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> 7-Day Skin Health Telemetry
              </h3>
              <p className="text-[11px] text-slate-400">Weekly barrier index progression (+23% net gain)</p>
            </div>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              88.5% Adherence
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* AI Micro-Insights Panel */}
        <div className="lg:col-span-5">
          <AIInsightsPanel />
        </div>

      </div>

      {/* 4. Routine Checklist & Quick Action Engines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* AM/PM Routine Checklist */}
        <GlassCard className="p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white">Today's Regimen Protocol</h3>
            <button onClick={() => navigate('/routine')} className="text-xs font-bold text-cyan-400 hover:underline">
              Full Regimen →
            </button>
          </div>

          <div className="space-y-4">
            <div
              onClick={() => setMorningDone(!morningDone)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                morningDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <Sun className="w-6 h-6 text-amber-400" />
                <div>
                  <h4 className="font-bold text-sm text-white">Morning Protocol (AM)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Gentle Cleanser → Vitamin C Serum → Moisturizer → SPF 50+</p>
                </div>
              </div>
              {morningDone ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <Circle className="w-6 h-6 text-slate-600" />
              )}
            </div>

            <div
              onClick={() => setEveningDone(!eveningDone)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                eveningDone ? 'bg-emerald-50/10 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <Moon className="w-6 h-6 text-purple-400" />
                <div>
                  <h4 className="font-bold text-sm text-white">Evening Protocol (PM)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Double Cleanse → Niacinamide 10% → Ceramide Barrier Balm</p>
                </div>
              </div>
              {eveningDone ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <Circle className="w-6 h-6 text-slate-600" />
              )}
            </div>
          </div>
        </GlassCard>

        {/* Intelligence Navigation Cards */}
        <div className="space-y-6">
          <GlassCard
            onClick={() => navigate('/ingredients')}
            className="p-6 flex items-center justify-between border-l-4 border-l-cyan-400 cursor-pointer hover:border-cyan-500/40 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/20">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Ingredient Intelligence</h4>
                <p className="text-xs text-slate-400">Chemical conflict matrix & active ingredient safety scores.</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-cyan-400" />
          </GlassCard>

          <GlassCard
            onClick={() => navigate('/before-after')}
            className="p-6 flex items-center justify-between border-l-4 border-l-purple-500 cursor-pointer hover:border-purple-500/40 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold border border-purple-500/20">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Before / After Skin Progress</h4>
                <p className="text-xs text-slate-400">Interactive timeline slider, baseline photo comparison & clinical notes.</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-purple-400" />
          </GlassCard>
        </div>

      </div>

    </div>
  );
}