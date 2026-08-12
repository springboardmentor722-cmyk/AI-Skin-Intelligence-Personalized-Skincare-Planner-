"use client";

import { motion } from "framer-motion";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; positiveIsGood?: boolean };
  accentClass?: string;
}

export default function KpiCard({ label, value, icon: Icon, trend, accentClass }: Props) {
  const trendPositive = trend ? trend.value >= 0 : null;
  const trendGood = trend ? (trend.positiveIsGood ?? true) === trendPositive : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={cn("rounded-xl p-2.5", accentClass ?? "bg-secondary")}>
          <Icon size={20} className="text-primary" />
        </div>
      </div>
      {trend && (
        <div className={cn("mt-3 flex items-center gap-1 text-xs font-medium", trendGood ? "text-emerald-600" : "text-red-500")}>
          {trendPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(trend.value)}% vs last scan
        </div>
      )}
    </motion.div>
  );
}
