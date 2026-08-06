import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Sparkles, Camera, Save, CheckCircle2 } from 'lucide-react';
import GlassCard from '../../components/ui/GlassCard';
import { useAuth } from '../../context/Authcontext';

export default function Profile() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || 'Alex Rivera',
    email: user?.email || 'alex.rivera@example.com',
    skinType: 'Combination',
    ageGroup: '25-34',
    primaryGoal: 'Barrier Repair & Radiance',
    notifications: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Account Center
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Personal Skin Profile
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your personal information, skin persona preferences, and security permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Summary */}
        <GlassCard className="p-6 text-center space-y-6 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#18C8C8] via-[#5B6DFF] to-[#8B5CF6] p-1 shadow-xl">
              <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-teal-600 font-extrabold text-3xl">
                {formData.name[0]}
              </div>
            </div>
            <button className="absolute bottom-1 right-1 p-2 bg-[#18C8C8] text-white rounded-full shadow-lg hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{formData.name}</h2>
            <p className="text-xs text-gray-500 mt-1">{formData.email}</p>
            <span className="inline-block mt-3 px-3 py-1 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-semibold text-xs rounded-full">
              {user?.role?.toUpperCase() || 'PATIENT'}
            </span>
          </div>

          <div className="w-full pt-4 border-t border-gray-200/60 dark:border-gray-800 space-y-2 text-xs text-gray-500 text-left">
            <div className="flex justify-between">
              <span>Account Status:</span>
              <strong className="text-emerald-500">Verified Active</strong>
            </div>
            <div className="flex justify-between">
              <span>Member Since:</span>
              <strong className="text-gray-700 dark:text-gray-300">January 2026</strong>
            </div>
          </div>
        </GlassCard>

        {/* Right Column: Form Fields */}
        <GlassCard className="md:col-span-2 p-8 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/60 pb-3">
            Profile Settings
          </h3>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full glass-input bg-gray-100/50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                  Primary Skin Type
                </label>
                <select
                  value={formData.skinType}
                  onChange={(e) => setFormData({ ...formData, skinType: e.target.value })}
                  className="w-full glass-input"
                >
                  <option value="Oily">Oily</option>
                  <option value="Dry">Dry</option>
                  <option value="Combination">Combination</option>
                  <option value="Sensitive">Sensitive</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                  Primary Skincare Goal
                </label>
                <input
                  type="text"
                  value={formData.primaryGoal}
                  onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
                  className="w-full glass-input"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              {saved ? (
                <div className="flex items-center gap-2 text-emerald-500 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5" /> Profile changes saved!
                </div>
              ) : <div />}

              <button
                type="submit"
                className="btn-gradient-primary px-8 py-3 rounded-full text-sm font-semibold shadow-lg"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
