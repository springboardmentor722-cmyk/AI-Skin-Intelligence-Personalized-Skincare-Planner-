import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, ShieldCheck, AlertTriangle, Droplets, Sun, CheckCircle2, Zap } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

export default function AIInsightsPanel() {
  const insights = [
    {
      id: 1,
      type: "positive",
      icon: Droplets,
      title: "Hydration Compliance Boost",
      message: "Your hydration level has improved by 18% over the past 14 days, boosting dermal plumpness.",
      badge: "+18% Hydration",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
    },
    {
      id: 2,
      type: "positive",
      icon: Sparkles,
      title: "Pigmentation Fading",
      message: "Vitamin C 10% morning application is actively reducing post-inflammatory hyperpigmentation marks.",
      badge: "Target Active",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
      id: 3,
      type: "positive",
      icon: ShieldCheck,
      title: "Skin Barrier Restoration",
      message: "Your skin barrier health index has reached optimal status (88/100) thanks to consistent Ceramide compliance.",
      badge: "Barrier Strong",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      id: 4,
      type: "warning",
      icon: Sun,
      title: "Sunscreen Reminder Alert",
      message: "You logged 4 missed SPF 50 applications over the last week. Daily UV protection is critical for preventing photoaging.",
      badge: "Compliance Action",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
      id: 5,
      type: "conflict",
      icon: AlertTriangle,
      title: "Ingredient Layer Warning",
      message: "Avoid combining Retinol with AHA Glycolic Acid in the same evening routine to prevent moisture barrier peeling.",
      badge: "Chemical Safety",
      color: "text-red-400 bg-red-500/10 border-red-500/20"
    }
  ];

  return (
    <GlassCard className="p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">AI Skincare Micro-Insights</h3>
            <p className="text-[11px] text-slate-400">Real-time telemetry analysis & safety notifications</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 uppercase tracking-wider">
          Live AI Agent
        </span>
      </div>

      <div className="space-y-3">
        {insights.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 hover:border-slate-700 transition-all"
            >
              <div className={`p-2 rounded-lg border ${item.color} flex-shrink-0 mt-0.5`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.color}`}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
