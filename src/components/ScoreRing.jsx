import "./ScoreRing.css";

function band(score) {
  if (score >= 80) return { color: "#059669", label: "Good" };
  if (score >= 60) return { color: "#d97706", label: "Fair" };
  return { color: "#dc2626", label: "Needs care" };
}

export default function ScoreRing({ score, size = 56, showLabel = false }) {
  if (score == null) {
    return (
      <div className="score-ring score-ring-empty" style={{ width: size, height: size }}>
        —
      </div>
    );
  }

  const clamped = Math.max(0, Math.min(100, score));
  const { color, label } = band(clamped);
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="score-ring-wrap">
      <div className="score-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="5"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <span className="score-ring-value" style={{ fontSize: size * 0.28 }}>
          {Math.round(clamped)}
        </span>
      </div>
      {showLabel && (
        <span className="score-ring-label" style={{ color }}>
          {label}
        </span>
      )}
    </div>
  );
}
