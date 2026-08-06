import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Users, Search, Stethoscope, FileText, Download, Layers, Sparkles, CheckCircle2
} from "lucide-react";
import GlassCard from "../../components/ui/GlassCard";
import SkinGauge from "../../components/ui/SkinGauge";
import BeforeAfterSlider from "../../components/ui/BeforeAfterSlider";

const SAMPLE_PATIENTS = [
  { id: 138, name: "Priya Sharma", email: "priya@gmail.com", age: 26, gender: "Female", skin_type: "Combination", concerns: "Acne, Hyperpigmentation", score: 88, risk: "Low Risk", adherence: "94%" },
  { id: 142, name: "Arjun Verma", email: "arjun@gmail.com", age: 31, gender: "Male", skin_type: "Oily", concerns: "Severe Acne, Pores", score: 68, risk: "High Risk", adherence: "82%" },
  { id: 145, name: "Sreja Reddy", email: "sreja@gmail.com", age: 24, gender: "Female", skin_type: "Dry / Sensitive", concerns: "Erythema, Barrier Loss", score: 74, risk: "Moderate Risk", adherence: "88%" }
];

export default function DermatologistDashboard() {
  const [patients] = useState(SAMPLE_PATIENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(SAMPLE_PATIENTS[0]);

  const [rxText, setRxText] = useState("Rx Tretinoin 0.05% Cream - Apply nightly. Pair with Ceramide Barrier Balm.");
  const [notes, setNotes] = useState("Patient displays barrier stabilization over 4 weeks.");
  const [saving, setSaving] = useState(false);

  const handleSaveRx = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Prescription issued to patient chart!");
    }, 800);
  };

  const filtered = patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <Stethoscope className="w-3.5 h-3.5" /> Doctor Portal
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Dermatologist Patient Roster & Rx Workbench
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review patient telemetry, before/after photo slider, custom prescriptions, and routine overrides.
          </p>
        </div>

        <div className="px-4 py-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
          Dr. Sarah Jenkins, MD
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Patient Directory */}
        <GlassCard className="lg:col-span-4 p-6 space-y-4 border border-white/50">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-500" /> Patient Directory
            </h3>
            <span className="text-xs text-gray-400 font-semibold">{filtered.length} Roster</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient name..."
              className="w-full glass-input pl-10"
            />
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filtered.map(p => {
              const isSel = selectedPatient.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSel ? 'border-[#18C8C8] bg-teal-50/60 dark:bg-teal-950/40' : 'border-gray-200/60 hover:border-teal-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{p.name}</h4>
                      <p className="text-xs text-gray-500">{p.skin_type} • Age {p.age}</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                      {p.risk}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Right Column: Detail & Rx Creator */}
        {selectedPatient && (
          <div className="lg:col-span-8 space-y-6">
            <GlassCard className="p-6 border border-white/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#18C8C8] to-[#5B6DFF] text-white font-extrabold text-xl flex items-center justify-center shadow-lg">
                  {selectedPatient.name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPatient.name}</h2>
                  <p className="text-xs text-gray-500">{selectedPatient.email} • {selectedPatient.concerns}</p>
                </div>
              </div>

              <SkinGauge score={selectedPatient.score} size={110} strokeWidth={10} showDetails={false} />
            </GlassCard>

            {/* Before / After Slider */}
            <GlassCard className="p-6 space-y-4 border border-white/50">
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-500" /> Patient Treatment Comparison Slider
              </h3>
              <BeforeAfterSlider
                beforeImage="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
                afterImage="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80"
              />
            </GlassCard>

            {/* Prescription Creator */}
            <GlassCard className="p-6 space-y-6 border border-white/50">
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Issue Clinical Prescription (Rx)</h3>
                <button onClick={() => window.print()} className="btn-glass px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                  <Download className="w-4 h-4 text-teal-500" /> Export PDF
                </button>
              </div>

              <form onSubmit={handleSaveRx} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Rx Active Formulations
                  </label>
                  <textarea
                    rows={3}
                    value={rxText}
                    onChange={(e) => setRxText(e.target.value)}
                    className="w-full glass-input resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Doctor Clinical Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full glass-input resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-gradient-primary px-8 py-3 rounded-full text-xs font-bold shadow-lg"
                >
                  {saving ? "Issuing..." : "Issue & Lock Prescription"}
                </button>
              </form>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
