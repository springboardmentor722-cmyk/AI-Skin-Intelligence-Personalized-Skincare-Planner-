import { motion } from "framer-motion";
import clsx from "clsx";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-300 focus:outline-none";

  const variants = {
    primary:
      "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-emerald-300 hover:scale-[1.02]",

    secondary:
      "bg-white/70 backdrop-blur-lg border border-gray-200 text-gray-800 hover:bg-white",

    danger:
      "bg-red-500 text-white hover:bg-red-600",

    outline:
      "border border-emerald-500 text-emerald-600 hover:bg-emerald-50",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}