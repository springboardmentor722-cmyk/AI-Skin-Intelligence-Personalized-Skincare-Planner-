import React, { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Users, ShoppingBag, ShieldCheck, Activity, Server, FileText, UserCheck, Stethoscope, Sparkles } from "lucide-react";
import GlassCard from "../../components/ui/GlassCard";

const GROWTH_DATA = [
  { month: "Feb", users: 120, assessments: 80 },
  { month: "Mar", users: 180, assessments: 140 },
  { month: "Apr", users: 240, assessments: 200 },
  { month: "May", users: 320, assessments: 280 },
  { month: "Jun", users: 450, assessments: 380 },
  { month: "Jul", users: 560, assessments: 470 }
];

export default function AdminDashboard() {
  const [stats] = useState({
    total_users: 142,
    consultants_count: 12,
    dermatologists_count: 8,
    total_assessments: 340,
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Control Center
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Platform Executive Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            System infrastructure status, practitioner roster metrics, and platform telemetry.
          </p>
        </div>

        <button onClick={() => window.print()} className="btn-gradient-primary px-6 py-3 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
          <FileText className="w-4 h-4" /> Export System Audit PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6 border border-white/50 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase">
            <span>REGISTERED USERS</span>
            <Users className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.total_users}</div>
        </GlassCard>

        <GlassCard className="p-6 border border-white/50 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase">
            <span>DERMATOLOGISTS</span>
            <Stethoscope className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-500">{stats.dermatologists_count}</div>
        </GlassCard>

        <GlassCard className="p-6 border border-white/50 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase">
            <span>CONSULTANTS</span>
            <UserCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-extrabold text-purple-500">{stats.consultants_count}</div>
        </GlassCard>

        <GlassCard className="p-6 border border-white/50 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase">
            <span>TOTAL SKIN SCANS</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-500">{stats.total_assessments}</div>
        </GlassCard>
      </div>

      {/* Chart & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <GlassCard className="lg:col-span-8 p-6 space-y-4 border border-white/50">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Platform User Growth Trajectory</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={GROWTH_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229,231,235,0.4)" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderRadius: "12px", color: "#fff" }} />
                <Line type="monotone" dataKey="users" stroke="#18C8C8" strokeWidth={3} name="Total Users" />
                <Line type="monotone" dataKey="assessments" stroke="#8B5CF6" strokeWidth={2.5} name="Skin Scans" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-4 p-6 space-y-4 border border-white/50">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-500" /> Infrastructure Status
          </h3>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">FastAPI Core Backend</span>
              <span className="text-xs text-emerald-600 font-semibold">Online • 99.99% Uptime</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">PostgreSQL Relational DB</span>
              <span className="text-xs text-emerald-600 font-semibold">Connected • 1.2ms Latency</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">MongoDB Async Document Log</span>
              <span className="text-xs text-emerald-600 font-semibold">Synced</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
