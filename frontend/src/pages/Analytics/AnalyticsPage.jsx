import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, Droplets, Moon, Activity, ShieldCheck, FileText, Download, BarChart3, Sparkles
} from "lucide-react";
import GlassCard from "../../components/ui/GlassCard";
import SkinGauge from "../../components/ui/SkinGauge";

const RADAR_DATA = [
  { subject: "Hydration", score: 88 },
  { subject: "Lipid Barrier", score: 92 },
  { subject: "Micro-Texture", score: 84 },
  { subject: "Acne Clearing", score: 78 },
  { subject: "Pigmentation", score: 72 },
  { subject: "Elasticity", score: 89 }
];

const PIE_INGREDIENTS_DATA = [
  { name: "Niacinamide", value: 35, color: "#18C8C8" },
  { name: "Ceramides", value: 25, color: "#5B6DFF" },
  { name: "Hyaluronic Acid", value: 20, color: "#8B5CF6" },
  { name: "Azelaic Acid", value: 12, color: "#F59E0B" },
  { name: "Retinoids", value: 8, color: "#EF4444" }
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5" /> Clinical Telemetry & Charts
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Skin Health Analytics Intelligence
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Radar dimension ratings, ingredient distribution, and treatment trajectory logs.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-gradient-primary px-6 py-3 rounded-full text-xs font-bold shadow-lg flex items-center gap-2"
        >
          <FileText className="w-4 h-4" /> Export Analytics PDF
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6 border border-white/50 space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase">Skin Health Score</div>
          <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">88 / 100</div>
          <p className="text-xs text-emerald-500 font-semibold">+23% vs Baseline</p>
        </GlassCard>

        <GlassCard className="p-6 border border-white/50 space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase">7-Day Adherence</div>
          <div className="text-3xl font-extrabold text-emerald-500">92.4%</div>
          <p className="text-xs text-gray-500">Regimen consistency</p>
        </GlassCard>

        <GlassCard className="p-6 border border-white/50 space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase">Hydration Retention</div>
          <div className="text-3xl font-extrabold text-indigo-500">84%</div>
          <p className="text-xs text-gray-500">Optimal TEWL lock</p>
        </GlassCard>

        <GlassCard className="p-6 border border-white/50 space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase">Barrier Strength</div>
          <div className="text-3xl font-extrabold text-purple-500">Optimal</div>
          <p className="text-xs text-gray-500">3:1:1 lipid ratio</p>
        </GlassCard>
      </div>

      {/* Radar & Ingredient Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-6 space-y-4 border border-white/50">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Multi-Dimensional Dermal Radar</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="rgba(229,231,235,0.4)" />
                <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#9CA3AF" fontSize={10} />
                <Radar name="Skin Quality" dataKey="score" stroke="#18C8C8" fill="#18C8C8" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-4 border border-white/50">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Regimen Active Ingredient Frequency</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE_INGREDIENTS_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                  {PIE_INGREDIENTS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderRadius: "12px", color: "#fff" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
