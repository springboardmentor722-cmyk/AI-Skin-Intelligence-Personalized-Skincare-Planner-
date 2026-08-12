"use client";

import { motion } from "framer-motion";

interface Props {
  score: number; // 0-100
  size?: number;
}

export default function SkinScoreGauge({ score, size = 200 }: Props) {
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const tone = score >= 80 ? "hsl(145 45% 42%)" : score >= 60 ? "hsl(38 80% 52%)" : "hsl(0 70% 55%)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--border))" strokeWidth={12} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={tone}
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-bold tracking-tight"
        >
          {Math.round(score)}
        </motion.span>
        <span className="text-xs text-muted-foreground">Skin Health Score</span>
      </div>
    </div>
  );
}
