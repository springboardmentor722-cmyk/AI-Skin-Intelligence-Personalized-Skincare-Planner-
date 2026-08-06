import { motion } from "framer-motion";

export default function PageHeader({
  title,
  subtitle,
  action,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8"
    >
      <div>
        <h1 className="text-4xl font-bold text-slate-800">
          {title}
        </h1>

        <p className="text-slate-500 mt-2">
          {subtitle}
        </p>
      </div>

      {action && (
        <div>
          {action}
        </div>
      )}
    </motion.div>
  );
}