import React from 'react'

/**
 * The Reticle is this product's one signature visual: a measurement/scan
 * instrument graphic (concentric rings, tick marks, crosshair) that stands
 * in for "AI precisely reading your skin." It anchors the landing hero and
 * is echoed elsewhere (ScoreGauge, loading states) so the idea recurs
 * instead of being a one-off hero decoration.
 */
export default function Reticle({ size = 420, readouts = [] }) {
  const cx = size / 2
  const cy = size / 2
  const rOuter = size * 0.42
  const rMid = size * 0.32
  const rInner = size * 0.2

  const ticks = Array.from({ length: 24 }, (_, i) => i * 15)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <defs>
          <radialGradient id="reticle-fill" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#E9F2EE" />
            <stop offset="100%" stopColor="#FBF7F1" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r={rOuter * 1.05} fill="url(#reticle-fill)" />

        {/* Outer tick ring — rotates slowly clockwise */}
        <g className="animate-spin-slow" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          {ticks.map((deg) => {
            const long = deg % 90 === 0
            const r1 = rOuter
            const r2 = rOuter - (long ? 14 : 7)
            const rad = (deg * Math.PI) / 180
            return (
              <line
                key={deg}
                x1={cx + r1 * Math.cos(rad)}
                y1={cy + r1 * Math.sin(rad)}
                x2={cx + r2 * Math.cos(rad)}
                y2={cy + r2 * Math.sin(rad)}
                stroke="#7CB49B"
                strokeWidth={long ? 2 : 1}
                strokeLinecap="round"
              />
            )
          })}
          <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#A8CDBC" strokeWidth="1" />
        </g>

        {/* Middle ring — rotates slowly counter-clockwise */}
        <g className="animate-spin-reverse-slow" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <circle cx={cx} cy={cy} r={rMid} fill="none" stroke="#1F6F5C" strokeWidth="1.5" strokeDasharray="2 6" />
          <circle cx={cx + rMid} cy={cy} r={4} fill="#D65472" />
        </g>

        {/* Crosshair */}
        <line x1={cx - rOuter - 18} y1={cy} x2={cx + rOuter + 18} y2={cy} stroke="#DAD2C4" strokeWidth="1" />
        <line x1={cx} y1={cy - rOuter - 18} x2={cx} y2={cy + rOuter + 18} stroke="#DAD2C4" strokeWidth="1" />

        {/* Inner core */}
        <circle cx={cx} cy={cy} r={rInner} fill="white" stroke="#195A4A" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={5} fill="#1F6F5C" />
      </svg>

      {readouts.map((r, i) => (
        <div
          key={r.label}
          className="absolute bg-white/90 backdrop-blur border border-stone-200 rounded-lg px-3 py-1.5 shadow-soft animate-float"
          style={{
            top: r.top, left: r.left, right: r.right, bottom: r.bottom,
            animationDelay: `${i * 0.6}s`,
          }}
        >
          <div className="data-figure text-[11px] text-ink-soft tracking-wide">{r.label}</div>
          <div className="data-figure text-sm font-semibold text-teal-700">{r.value}</div>
        </div>
      ))}
    </div>
  )
}
