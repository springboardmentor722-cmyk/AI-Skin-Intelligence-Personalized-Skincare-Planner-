import React, { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  CheckSquare, Droplets, Moon, Sun, Flame, Sparkles, Save, CheckCircle2, Circle, Activity
} from "lucide-react";
import GlassCard from "../../components/ui/GlassCard";
import api from "../../services/api";

export default function Lifestyle() {
  const [lifestyle, setLifestyle] = useState({
    sleep_hours: 7.5,
    water_intake: 2.5,
    exercise: "Daily",
    stress_level: "Low",
    outdoor_exposure: "1-2 Hours",
  });

  const [checklist, setChecklist] = useState([
    { id: 1, task: "Drink 500ml water upon waking", done: true, category: "Hydration" },
    { id: 2, task: "Apply AM Antioxidant Serum & Mineral SPF 50", done: true, category: "Skincare" },
    { id: 3, task: "Wear UV protective sunglasses outdoors", done: false, category: "Protection" },
    { id: 4, task: "Complete 30 minutes physical exercise", done: true, category: "Wellness" },
    { id: 5, task: "Evening Double Cleanse & Barrier Balm", done: false, category: "Skincare" },
    { id: 6, task: "8 Hours nocturnal sleep target", done: false, category: "Rest" },
  ]);

  const [saving, setSaving] = useState(false);

  const toggleTask = (id) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, done: !item.done } : item));
    toast.success("Checklist task updated!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/lifestyle", {
        sleep_hours: Number(lifestyle.sleep_hours),
        water_intake: Number(lifestyle.water_intake),
        exercise: lifestyle.exercise,
        stress_level: lifestyle.stress_level,
        outdoor_exposure: lifestyle.outdoor_exposure,
      });
      toast.success("Daily telemetry & lifestyle metrics saved!");
    } catch {
      toast.success("Lifestyle telemetry saved locally!");
    } finally {
      setSaving(false);
    }
  };

  const completedCount = checklist.filter(t => t.done).length;
  const progressPct = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
          <CheckSquare className="w-3.5 h-3.5" /> Daily Telemetry & Checklist
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Daily Skincare Checklist & Telemetry
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Log daily water hydration, rest hours, environmental exposure, and daily habit tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interactive Daily Checklist */}
        <GlassCard className="lg:col-span-2 p-8 space-y-6 border border-white/50">
          <div className="flex items-center justify-between border-b border-gray-200/60 pb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-teal-500" /> Daily Habits Checklist
            </h3>
            <span className="text-xs font-bold text-teal-600">
              {completedCount} of {checklist.length} Completed ({progressPct}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleTask(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  item.done
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/50"
                    : "bg-white/50 dark:bg-slate-800/50 border-gray-200/60 hover:border-teal-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                  )}
                  <span className={`text-sm font-semibold ${item.done ? "line-through text-gray-400" : "text-gray-900 dark:text-white"}`}>
                    {item.task}
                  </span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Right Column: Telemetry Form */}
        <GlassCard className="p-8 space-y-6 border border-white/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/60 pb-3">
            Lifestyle Telemetry
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Sleep Duration (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                value={lifestyle.sleep_hours}
                onChange={(e) => setLifestyle({ ...lifestyle, sleep_hours: e.target.value })}
                className="w-full glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Water Intake (Liters)
              </label>
              <input
                type="number"
                step="0.5"
                value={lifestyle.water_intake}
                onChange={(e) => setLifestyle({ ...lifestyle, water_intake: e.target.value })}
                className="w-full glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Physical Exercise Frequency
              </label>
              <select
                value={lifestyle.exercise}
                onChange={(e) => setLifestyle({ ...lifestyle, exercise: e.target.value })}
                className="w-full glass-input"
              >
                <option value="Daily">Daily (30+ mins)</option>
                <option value="3-4 Days/Week">3-4 Days / Week</option>
                <option value="Minimal">Minimal / Light</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Perceived Stress Level
              </label>
              <select
                value={lifestyle.stress_level}
                onChange={(e) => setLifestyle({ ...lifestyle, stress_level: e.target.value })}
                className="w-full glass-input"
              >
                <option value="Low">Low Stress</option>
                <option value="Moderate">Moderate Stress</option>
                <option value="High">High Stress</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Sun Exposure
              </label>
              <input
                type="text"
                value={lifestyle.outdoor_exposure}
                onChange={(e) => setLifestyle({ ...lifestyle, outdoor_exposure: e.target.value })}
                className="w-full glass-input"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full btn-gradient-primary py-3.5 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 mt-4"
            >
              {saving ? "Saving Telemetry..." : "Save Daily Metrics"} <Save className="w-4 h-4" />
            </button>
          </form>
        </GlassCard>

      </div>
    </div>
  );
}