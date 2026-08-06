import React from 'react';
import { motion } from 'framer-motion';

const SkinGauge = ({
  score = 85,
  size = 180,
  strokeWidth = 14,
  label = 'Skin Health Score',
  subtitle = 'Optimal',
  showDetails = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine status color
  const getColor = (s) => {
    if (s >= 80) return { stroke: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', text: 'text-emerald-500' };
    if (s >= 60) return { stroke: '#18C8C8', bg: 'rgba(24, 200, 200, 0.1)', text: 'text-teal-500' };
    if (s >= 40) return { stroke: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', text: 'text-amber-500' };
    return { stroke: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', text: 'text-rose-500' };
  };

  const colors = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* SVG Circular Progress Bar */}
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(229, 231, 235, 0.5)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Glow Track */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-4xl font-extrabold tracking-tight ${colors.text}`}
          >
            {score}
          </motion.span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 text-center">
          <div className="text-sm font-semibold text-gray-800">{label}</div>
          <div className={`text-xs font-medium ${colors.text} mt-0.5`}>
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkinGauge;
