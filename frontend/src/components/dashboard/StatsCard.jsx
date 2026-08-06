import { motion } from "framer-motion";

export default function StatsCard({
  title,
  value,
  icon,
  color = "from-emerald-500 to-cyan-500",
  subtitle,
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100"
    >
      <div className="flex justify-between items-center">

        <div>
          <p className="text-gray-500 text-sm">{title}</p>

          <h2 className="text-3xl font-bold mt-2">
            {value}
          </h2>

          {subtitle && (
            <p className="text-sm text-emerald-600 mt-2">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center text-white shadow-lg`}
        >
          {icon}
        </div>

      </div>
    </motion.div>
  );
}