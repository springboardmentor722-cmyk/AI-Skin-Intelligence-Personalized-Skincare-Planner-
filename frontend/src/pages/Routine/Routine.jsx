import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  CalendarCheck, Sun, Moon, Sparkles, Check, Clock, HelpCircle,
  AlertTriangle, FileText, ArrowRight, ShieldCheck, CheckCircle2, Circle, CloudSun, CheckSquare
} from "lucide-react";
import GlassCard from "../../components/ui/GlassCard";
import api from "../../services/api";

export default function Routine() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("am"); // "am", "pm", "weekly"
  const [completedSteps, setCompletedSteps] = useState({});

  useEffect(() => {
    fetchRoutine();
  }, []);

  const fetchRoutine = async () => {
    try {
      const res = await api.get("/api/v1/routine");
      if (res.data) {
        // Active routine loaded
      }
    } catch {
      // Fallback local state
    }
  };

  const routineCatalog = {
    am: [
      {
        id: "am-1",
        step_number: "Step 1",
        title: "Gentle Hydrating Cleanser",
        time: "1 Min",
        instructions: "Wash face with lukewarm water and gentle non-foaming cleanser.",
        why: "Removes accumulated overnight sebum without stripping intercellular lipid Ceramides.",
        product: "CeraVe Hydrating Facial Cleanser",
        ingredients: "Ceramides NP/AP, Hyaluronic Acid"
      },
      {
        id: "am-2",
        step_number: "Step 2",
        title: "Vitamin C 10% Brightening Serum",
        time: "2 Mins",
        instructions: "Apply 3-4 drops to slightly damp face. Press gently into cheeks and forehead.",
        why: "Provides daily antioxidant defense against environmental UV free radicals.",
        product: "Minimalist 10% Vitamin C Serum",
        ingredients: "Ethyl Ascorbic Acid 10%, Ferulic Acid"
      },
      {
        id: "am-3",
        step_number: "Step 3",
        title: "Ceramide Moisture Lock",
        time: "1 Min",
        instructions: "Massage lightweight gel-cream moisturizer evenly over face and neck.",
        why: "Seals moisture into stratum corneum and protects epidermal lipid matrix.",
        product: "Curology Barrier Recovery Cream",
        ingredients: "3 Essential Ceramides, Squalane"
      },
      {
        id: "am-4",
        step_number: "Step 4",
        title: "Broad Spectrum Mineral SPF 50",
        time: "2 Mins",
        instructions: "Apply generous layer 15 minutes before outdoor sun exposure.",
        why: "Non-negotiable photoprotection against UVA/UVB photoaging & hyperpigmentation.",
        product: "La Roche-Posay Anthelios Mineral SPF 50",
        ingredients: "Zinc Oxide 15%, Titanium Dioxide 5%"
      }
    ],
    pm: [
      {
        id: "pm-1",
        step_number: "Step 1",
        title: "Micellar Oil Double Cleanser",
        time: "3 Mins",
        instructions: "Remove surface impurities & SPF using Micellar water followed by gentle cleanser.",
        why: "Completely dissolves waterproof sunscreen and accumulated environmental pollutants.",
        product: "Bioderma Sensibio Micellar Cleanser",
        ingredients: "Micellar Cleansing Water, Fatty Acid Esters"
      },
      {
        id: "pm-2",
        step_number: "Step 2",
        title: "Target Active Treatment (Niacinamide 10%)",
        time: "2 Mins",
        instructions: "Apply 3-4 drops onto clean skin. Press gently into T-zone.",
        why: "Accelerates epidermal renewal and regulates sebum output.",
        product: "The Ordinary Niacinamide 10% + Zinc 1%",
        ingredients: "Niacinamide 10%, Zinc PCA"
      },
      {
        id: "pm-3",
        step_number: "Step 3",
        title: "Retinol 0.5% Night Formula",
        time: "1 Min",
        instructions: "Apply pea-sized amount avoiding eye area.",
        why: "Promotes cell turnover and stimulates deep dermal collagen synthesis.",
        product: "Dermatica Prescribed Retinol Treatment",
        ingredients: "Pure Retinol 0.5%, Squalane"
      },
      {
        id: "pm-4",
        step_number: "Step 4",
        title: "Ceramide Barrier Restorative Cream",
        time: "2 Mins",
        instructions: "Smooth rich moisturizer over face and neck as final PM seal.",
        why: "Deeply nourishes lipid barrier during overnight natural repair cycles.",
        product: "CeraVe Skin Renewing Night Cream",
        ingredients: "Biocompatible Ceramides, Peptide Complex"
      }
    ],
    weekly: [
      {
        id: "wk-1",
        step_number: "Wednesday",
        title: "Salicylic Acid BHA Chemical Exfoliation",
        time: "5 Mins",
        instructions: "Apply 2% BHA liquid solution to unclog pores and remove dead skin cells.",
        why: "Deeply clears pore channels and prevents blackhead accumulation.",
        product: "Paula's Choice 2% BHA Liquid Exfoliant",
        ingredients: "Salicylic Acid 2%, Green Tea"
      },
      {
        id: "wk-2",
        step_number: "Sunday",
        title: "Clay Purifying / Hydrating Mask",
        time: "15 Mins",
        instructions: "Leave mask on for 15 minutes, then rinse gently with lukewarm water.",
        why: "Purifies residual pore impurities and boosts deep cellular hydration.",
        product: "La Roche-Posay Hydrating Purifying Mask",
        ingredients: "Kaolin Clay, Thermal Spring Water"
      }
    ]
  };

  const toggleStep = async (stepId) => {
    const nextVal = !completedSteps[stepId];
    setCompletedSteps(prev => ({ ...prev, [stepId]: nextVal }));

    try {
      await api.post("/api/v1/routine/log-step", {
        step_id: stepId,
        time_of_day: activeTab.toUpperCase(),
        completed: nextVal
      });
    } catch {
      // Local log
    }

    if (nextVal) {
      toast.success("Step marked complete!");
    }
  };

  const currentSteps = routineCatalog[activeTab] || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <CalendarCheck className="w-3.5 h-3.5" /> AI Personalized Routine Timeline
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Skincare Routine Planner</h1>
          <p className="text-slate-400 text-sm mt-1">Sequential morning, evening, and weekly treatment schedules with completion tracking</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-full border border-slate-800">
          {[
            { id: "am", name: "Morning (AM)", icon: Sun },
            { id: "pm", name: "Evening (PM)", icon: Moon },
            { id: "weekly", name: "Weekly Special", icon: Sparkles }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === t.id ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20" : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Routine Timeline Cards */}
      <div className="space-y-4">
        {currentSteps.map((s, idx) => {
          const isDone = completedSteps[s.id];
          return (
            <GlassCard key={s.id} className={`p-6 transition-all duration-300 ${isDone ? "opacity-75 border-emerald-500/30 bg-emerald-500/5" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    onClick={() => toggleStep(s.id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all mt-1 ${
                      isDone ? "bg-emerald-500 border-emerald-500 text-slate-950" : "border-slate-700 hover:border-cyan-400 text-transparent"
                    }`}
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">{s.step_number}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {s.time}
                      </span>
                    </div>

                    <h3 className={`text-lg font-bold ${isDone ? "line-through text-slate-400" : "text-white"}`}>
                      {s.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">{s.instructions}</p>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div className="text-[11px] font-bold text-cyan-400 font-mono">Purpose & Benefit:</div>
                      <p className="text-xs text-slate-300">{s.why}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                      <div><strong className="text-slate-300">Recommended Product:</strong> {s.product}</div>
                      <div><strong className="text-slate-300">Actives:</strong> {s.ingredients}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleStep(s.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isDone ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {isDone ? "Completed" : "Mark Step Complete"}
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
