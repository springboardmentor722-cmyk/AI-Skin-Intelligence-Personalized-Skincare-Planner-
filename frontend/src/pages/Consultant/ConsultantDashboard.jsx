import React, { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { UserCheck, Users, Search, MessageSquare, Download, Sparkles } from "lucide-react";
import GlassCard from "../../components/ui/GlassCard";
import SkinGauge from "../../components/ui/SkinGauge";

const ASSIGNED_CLIENTS = [
  { id: 101, name: "Priya Sharma", email: "priya@example.com", skin_type: "Combination", concerns: "Acne, Hyperpigmentation", score: 88, compliance: "94%", status: "Active" },
  { id: 102, name: "Rohan Verma", email: "rohan@example.com", skin_type: "Dry", concerns: "Dryness, Barrier Flaking", score: 64, compliance: "82%", status: "Needs Review" },
  { id: 103, name: "Ananya Patel", email: "ananya@example.com", skin_type: "Oily / Sensitive", concerns: "Erythema, Sebum Excess", score: 76, compliance: "90%", status: "Active" }
];

export default function ConsultantDashboard() {
  const [clients] = useState(ASSIGNED_CLIENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(ASSIGNED_CLIENTS[0]);

  const [recTitle, setRecTitle] = useState("Custom Barrier Recovery Plan");
  const [recNotes, setRecNotes] = useState("Incorporate Niacinamide 10% in AM and Ceramide Moisture Balm in PM.");
  const [productSuggestion, setProductSuggestion] = useState("CeraVe Hydrating Cleanser + Skin+Me Serum");

  const handleIssue = (e) => {
    e.preventDefault();
    toast.success(`Recommendation issued for ${selectedClient.name}!`);
  };

  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <UserCheck className="w-3.5 h-3.5" /> Specialist Workspace
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Consultant Workspace & Advisory
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review client progress, issue routine recommendations, and track compliance metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Client Roster */}
        <GlassCard className="lg:col-span-4 p-6 space-y-4 border border-white/50">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" /> Client Roster
            </h3>
            <span className="text-xs text-gray-400 font-semibold">{filtered.length} Active</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full glass-input pl-10"
            />
          </div>

          <div className="space-y-3">
            {filtered.map(c => {
              const isSel = selectedClient.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClient(c)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSel ? 'border-[#8B5CF6] bg-purple-50/60 dark:bg-purple-950/40' : 'border-gray-200/60 hover:border-purple-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{c.name}</h4>
                      <p className="text-xs text-gray-500">{c.skin_type}</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                      {c.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Client Detail */}
        {selectedClient && (
          <div className="lg:col-span-8 space-y-6">
            <GlassCard className="p-6 border border-white/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClient.name}</h2>
                <p className="text-xs text-gray-500">{selectedClient.email} • {selectedClient.concerns}</p>
              </div>

              <SkinGauge score={selectedClient.score} size={110} strokeWidth={10} showDetails={false} />
            </GlassCard>

            <GlassCard className="p-6 space-y-6 border border-white/50">
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Issue Advisory Guidance</h3>
                <button onClick={() => window.print()} className="btn-glass px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                  <Download className="w-4 h-4 text-purple-500" /> Export PDF
                </button>
              </div>

              <form onSubmit={handleIssue} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Advisory Title
                  </label>
                  <input
                    type="text"
                    value={recTitle}
                    onChange={(e) => setRecTitle(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Formulation & Product Guidance
                  </label>
                  <input
                    type="text"
                    value={productSuggestion}
                    onChange={(e) => setProductSuggestion(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Clinical Advice Notes
                  </label>
                  <textarea
                    rows={3}
                    value={recNotes}
                    onChange={(e) => setRecNotes(e.target.value)}
                    className="w-full glass-input resize-none"
                  />
                </div>

                <button type="submit" className="btn-gradient-primary px-8 py-3 rounded-full text-xs font-bold shadow-lg">
                  Issue Recommendation
                </button>
              </form>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}