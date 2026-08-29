import React from "react";

const TONE_MAP = {
  sage: "#A855F7",
  ocean: "#7C3AED",
  clay: "#C084FC",
  danger: "#E11D48",
};

export default function SkinHealthRing({
  value = 0,
  tone = "ocean",
  size = 96,
  label,
  sublabel,
}) {
  const stroke = size * 0.08;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  const color = TONE_MAP[tone] || TONE_MAP.ocean;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(139, 92, 246, 0.15)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-bold text-purple-950" style={{ fontSize: size * 0.24 }}>
            {Math.round(value)}
          </span>
        </div>
      </div>
      {label && <span className="text-xs font-semibold text-purple-900">{label}</span>}
      {sublabel && <span className="text-[11px] text-purple-700/80 -mt-1">{sublabel}</span>}
    </div>
  );
}

