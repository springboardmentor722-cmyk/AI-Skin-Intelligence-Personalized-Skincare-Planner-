import { motion } from "framer-motion";
import clsx from "clsx";

export default function Card({
  children,
  className = "",
  hover = true,
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -5, scale: 1.01 } : {}}
      transition={{ duration: 0.25 }}
      className={clsx(
        `
        rounded-3xl
        bg-white/70
        backdrop-blur-xl
        border
        border-white/30
        shadow-lg
        p-6
        transition-all
        duration-300
        `,
        className
      )}
    >
      {children}
    </motion.div>
  );
}