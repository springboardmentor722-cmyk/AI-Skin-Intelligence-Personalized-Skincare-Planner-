import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Shield, Bell, Eye, Palette, Globe, Sun, Trash2, LogOut, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import GlassCard from "../../components/ui/GlassCard";
import { useAuth } from "../../context/Authcontext";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: User },
  { id: "password", label: "Password & Auth", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "theme", label: "Theme & Dark Mode", icon: Sun },
  { id: "delete", label: "Delete Account", icon: Trash2 },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [savedMsg, setSavedMsg] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "Alex Rivera",
    email: user?.email || "alex@example.com",
  });

  const [notifications, setNotifications] = useState({
    emailRoutine: true,
    waterReminders: true,
    doctorMessages: true,
    weeklyReport: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleLogout = () => {
    authLogout();
    navigate("/login");
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Security & Preferences
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Platform Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your account identity, security credentials, notification preferences, and themes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <GlassCard className="p-3 space-y-1 h-fit border border-white/50">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? "bg-[#18C8C8] text-white shadow-md shadow-teal-500/20"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </GlassCard>

        {/* Content Panel */}
        <GlassCard className="md:col-span-3 p-8 space-y-6 border border-white/50">
          {activeTab === "profile" && (
            <form onSubmit={handleSave} className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/60 pb-3">
                Public Profile
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={profileForm.email}
                    className="w-full glass-input bg-gray-100/50 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                {savedMsg && (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Settings updated!
                  </span>
                )}
                <button type="submit" className="btn-gradient-primary px-8 py-3 rounded-full text-xs font-bold shadow-lg">
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {activeTab === "account" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/60 pb-3">Account Classification</h2>
              <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/50">
                <span className="text-xs text-gray-500 font-medium">Assigned Role</span>
                <div className="text-lg font-bold text-teal-600 dark:text-teal-400 capitalize mt-1">{user?.role || "user"}</div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/60 pb-3">Notification Preferences</h2>
              {Object.keys(notifications).map((k) => (
                <div key={k} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <input
                    type="checkbox"
                    checked={notifications[k]}
                    onChange={() => setNotifications({ ...notifications, [k]: !notifications[k] })}
                    className="w-4 h-4 accent-[#18C8C8] cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === "delete" && (
            <div className="space-y-4 p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl">
              <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Danger Zone: Delete Account
              </h2>
              <p className="text-xs text-rose-700 dark:text-rose-300">Permanently delete your profile and historical skin logs.</p>
              <button onClick={handleLogout} className="px-6 py-2.5 bg-rose-600 text-white font-bold rounded-full text-xs shadow-md">
                Delete Account
              </button>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}