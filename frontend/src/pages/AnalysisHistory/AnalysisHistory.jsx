import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Bell, CheckCircle2, Clock, Calendar, ShieldCheck, Sparkles, Filter, Droplets, Sun, Moon, FileText, Check, Settings, Mail, Smartphone
} from "lucide-react";
import api from "../../services/api";

const SAMPLE_NOTIFICATIONS = [
  { id: 1, title: "Morning Routine Reminder", message: "Time for AM Cleanse, Niacinamide 10%, and SPF 50 Mineral Defense.", category: "Routine", timestamp: "10 mins ago", read: false },
  { id: 2, title: "Hydration Milestone Reached", message: "Great job! You reached 2.75L water intake target today.", category: "Hydration", timestamp: "2 hours ago", read: false },
  { id: 3, title: "Weekly Clinical Progress Report Ready", message: "Your Week 4 Skin Progress & Compliance Report is ready for review.", category: "Reports", timestamp: "1 day ago", read: true },
  { id: 4, title: "Dermatologist Prescription Issued", message: "Dr. Sarah Jenkins uploaded a custom Tretinoin 0.05% regimen for you.", category: "Medical", timestamp: "2 days ago", read: true }
];

export default function AnalysisHistory() {
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState("All");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [routineReminders, setRoutineReminders] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/v1/notifications");
      if (res.data && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.warn("Using default notifications stream");
    }
  };

  const handleMarkRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await api.post("/api/v1/notifications/mark-read", { notif_id: id });
    } catch (err) {
      // Gracefully handled
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeCategory === "All") return true;
    return n.category === activeCategory;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" /> Real-time Notification Engine
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Notifications & Alerts Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Routine reminders, hydration alerts, weekly report summaries, and dermatologist messages.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all shadow-xs"
          >
            <Check className="w-4 h-4 text-emerald-600" /> Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Notifications Stream */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 p-6 shadow-xl shadow-slate-200/50 space-y-6">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {["All", "Routine", "Hydration", "Reports", "Medical"].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-3">
            {filteredNotifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  !n.read ? "bg-sky-50/50 border-sky-200" : "bg-white border-slate-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    n.category === "Routine" ? "bg-amber-100 text-amber-600" : n.category === "Hydration" ? "bg-sky-100 text-sky-600" : "bg-purple-100 text-purple-600"
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 block">{n.timestamp}</span>
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex-shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Preferences Toggles */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 p-6 shadow-xl shadow-slate-200/50 space-y-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600" /> Notification Channels
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-600" />
                <div>
                  <div className="font-bold text-slate-900">Email Digest</div>
                  <div className="text-[11px] text-slate-400">Weekly progress summaries</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-sky-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-slate-600" />
                <div>
                  <div className="font-bold text-slate-900">Push Notifications</div>
                  <div className="text-[11px] text-slate-400">AM & PM routine reminders</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={pushAlerts}
                onChange={(e) => setPushAlerts(e.target.checked)}
                className="w-4 h-4 accent-sky-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Droplets className="w-4 h-4 text-sky-600" />
                <div>
                  <div className="font-bold text-slate-900">Hydration Reminders</div>
                  <div className="text-[11px] text-slate-400">Drink 500ml water alert</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={routineReminders}
                onChange={(e) => setRoutineReminders(e.target.checked)}
                className="w-4 h-4 accent-sky-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}