import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({
  children,
  className = '',
  hoverEffect = true,
  glow = false,
  onClick,
  ...props
}) => {
  const baseClasses = `
    glass-card p-6 rounded-[24px] 
    ${glow ? 'shadow-[0_12px_40px_rgba(24,200,200,0.15)] border-teal-200/50' : ''}
    ${hoverEffect ? 'glass-card-hover' : ''}
    ${className}
  `;

  if (onClick || hoverEffect) {
    return (
      <motion.div
        whileHover={hoverEffect ? { y: -4 } : {}}
        whileTap={onClick ? { scale: 0.98 } : {}}
        onClick={onClick}
        className={baseClasses}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  );
};

export default GlassCard;
