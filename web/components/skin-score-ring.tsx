"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface SkinScoreRingProps {
  score: number; // 0-100
  size?: number;
  label?: string;
  className?: string;
}

// docs/AGENTS.md §3: "the signature element — circular gauge in frosted glass,
// teal→royal-blue gradient stroke, Geist numeral... Identical treatment everywhere
// it appears." One shared component so the landing page and the future dashboard
// screen never drift from each other.
export function SkinScoreRing({ score, size = 220, label = "Skin Score", className }: SkinScoreRingProps) {
  const strokeWidth = size * 0.055;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));

  // Animate in on mount, matching the wireframe's ring micro-interaction.
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(clamped));
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  const offset = circumference - (circumference * progress) / 100;

  return (
    <div
      className={cn("glass relative flex items-center justify-center rounded-full", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-on-surface/5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="url(#skin-score-ring-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        <defs>
          <linearGradient id="skin-score-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--tertiary)" />
            <stop offset="100%" stopColor="var(--secondary)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-geist text-on-surface text-5xl font-semibold tabular-nums">
          {Math.round(clamped)}
        </span>
        <span className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}
