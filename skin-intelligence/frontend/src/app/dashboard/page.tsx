"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Droplets, Moon, Activity, CalendarCheck, Sparkles } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import SkinScoreGauge from "@/components/dashboard/SkinScoreGauge";
import FaceScanCapture from "@/components/capture/FaceScanCapture";
import type { SkinAnalysis } from "@/lib/api";

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [showScan, setShowScan] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Skin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Track your progress and stay on top of your routine.</p>
        </div>
        <button
          onClick={() => setShowScan(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-md"
        >
          <Sparkles size={16} /> New Face Scan
        </button>
      </motion.div>

      {showScan && !analysis && (
        <div className="mb-10 flex justify-center">
          <FaceScanCapture
            onAnalysisComplete={(result) => {
              setAnalysis(result);
              setShowScan(false);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 shadow-sm">
          <SkinScoreGauge score={78} />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {analysis ? `Skin type: ${analysis.skin_type}` : "Complete a scan to see your live score"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <KpiCard label="Hydration" value="72%" icon={Droplets} />
          <KpiCard label="Sleep Quality" value="7.2h avg" icon={Moon} trend={{ value: 4 }} />
          <KpiCard label="Routine Streak" value="12 days" icon={CalendarCheck} trend={{ value: 12 }} />
          <KpiCard label="Lifestyle Score" value="81/100" icon={Activity} trend={{ value: -3, positiveIsGood: true }} />
        </div>
      </div>
    </div>
  );
}
