import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Zap, Activity } from "lucide-react";

export default function BrandSection() {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-10 lg:p-14 text-white overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A]/90 via-[#0F172A]/60 to-[#18C8C8]/30 z-10" />

      {/* Brand Header */}
      <div className="relative z-20 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#18C8C8] via-[#5B6DFF] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-teal-500/30">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="text-xl font-extrabold tracking-tight block">AI Skin Intelligence</span>
          <span className="text-xs text-teal-300 font-semibold tracking-wider uppercase">Clinical Grade Platform</span>
        </div>
      </div>

      {/* Hero Quote */}
      <div className="relative z-20 space-y-6 my-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold text-teal-300 bg-teal-950/60 border border-teal-500/30 px-3 py-1.5 rounded-full uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4 text-[#18C8C8]" /> Certified Medical AI Engine
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight text-white tracking-tight">
            lemetry for <span className="text-gradient">Flawless Skin Barrier</span>
          </h1>
          <p className="text-base text-gray-300 mt-4 leading-relaxed">
            Analyze biometrics, predict ingredient synergy, and track dermatologist-approved progress in real-time.
          </p>
        </motion.div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-3 pt-2">
          {[
            { icon: Zap, text: "Instant Barrier Analysis" },
            { icon: Activity, text: "99.4% AI Diagnostic Precision" },
            { icon: ShieldCheck, text: "HIPAA Biometric Privacy" },
          ].map((pill, idx) => {
            const IconComp = pill.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-xs font-semibold text-white shadow-lg"
              >
                <IconComp className="w-4 h-4 text-[#18C8C8]" />
                <span>{pill.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Meta */}
      <div className="relative z-20 flex items-center justify-between text-xs text-gray-400 border-t border-white/10 pt-6">
        <span>Trusting 250,000+ Profiles Worldwide</span>
        <span className="text-teal-400 font-semibold">v4.8 Enterprise</span>
      </div>
    </div>
  );
}
