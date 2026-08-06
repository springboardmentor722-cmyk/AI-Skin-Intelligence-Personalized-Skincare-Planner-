import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function FeatureCard({
  title,
  index = 0
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 + 0.1, ease: "easeOut" }}
      whileHover={{ y: -2, scale: 1.02 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-2xs hover:bg-white/90 transition-all duration-200 cursor-default select-none"
    >
      <Check className="w-3.5 h-3.5 text-[#1AA8A8] shrink-0" />
      <span className="text-xs font-semibold text-[#111827] whitespace-nowrap">
        {title}
      </span>
    </motion.div>
  );
}
