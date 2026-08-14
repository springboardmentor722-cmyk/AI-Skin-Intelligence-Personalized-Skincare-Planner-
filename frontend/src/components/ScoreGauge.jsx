import React from 'react'

export default function ScoreGauge({ score, label, size = 140 }) {
  const value = score ?? 0
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const cx = size / 2
  const cy = size / 2

  const color = value >= 70 ? '#1F6F5C' : value >= 40 ? '#C89B4A' : '#D65472'
  const ticks = Array.from({ length: 40 }, (_, i) => i * 9)

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {ticks.map((deg) => {
            const rad = (deg * Math.PI) / 180
            const r1 = radius + 9
            const r2 = radius + (deg % 90 === 0 ? 4 : 6)
            return (
              <line
                key={deg}
                x1={cx + r1 * Math.cos(rad)} y1={cy + r1 * Math.sin(rad)}
                x2={cx + r2 * Math.cos(rad)} y2={cy + r2 * Math.sin(rad)}
                stroke="#DAD2C4" strokeWidth="1"
              />
            )
          })}
          <circle cx={cx} cy={cy} r={radius} stroke="#F3EEE5" strokeWidth="10" fill="none" />
          <circle
            cx={cx} cy={cy} r={radius}
            stroke={color} strokeWidth="10" fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="data-figure text-2xl font-semibold text-ink">{score !== null && score !== undefined ? Math.round(value) : '--'}</span>
          <span className="data-figure text-[10px] text-ink-faint tracking-wide">/ 100</span>
        </div>
      </div>
      {label && <span className="mt-2 text-sm font-medium text-ink-soft">{label}</span>}
    </div>
  )
}
