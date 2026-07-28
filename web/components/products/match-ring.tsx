import { cn } from "@/lib/utils";

interface MatchRingProps {
  /** 0-100 match_percentage from the recommendation API (milestone_3.md §M3-D: "0-100
   * match_percentage driving the Match ring"). */
  score: number;
  size?: number;
  className?: string;
}

// Small match-percentage ring for product cards (docs/WIREFRAMES.md screen 6) — distinct
// from the larger SkinScoreRing (docs/AGENTS.md's "signature element"); this one is a
// compact secondary indicator, not the score itself.
export function MatchRing({ score, size = 40, className }: MatchRingProps) {
  const strokeWidth = 3;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, score / 100));
  const offset = circumference - circumference * clamped;

  return (
    <div
      className={cn(
        "bg-background/90 border-border relative flex items-center justify-center rounded-full border backdrop-blur-md",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-on-surface/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="font-geist text-on-surface absolute text-[9px] font-bold tabular-nums">
        {Math.round(clamped * 100)}%
      </span>
    </div>
  );
}
