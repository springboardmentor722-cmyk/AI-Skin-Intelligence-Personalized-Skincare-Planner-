import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Droplets, Moon, Sparkles, Check, CheckCheck, Trash2, ShieldAlert } from 'lucide-react';
import GlassCard from '../../components/ui/GlassCard';

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'reminder', icon: Droplets, title: 'Hydration Target Achieved', desc: 'You logged 8/8 cups of water today. Excellent barrier moisture support!', time: '10 mins ago', unread: true, color: '#18C8C8' },
    { id: 2, type: 'routine', icon: Moon, title: 'Evening Routine Scheduled', desc: 'Your PM regimen starts in 30 minutes: Cleanser -> Niacinamide Serum -> Night Cream.', time: '1 hour ago', unread: true, color: '#8B5CF6' },
    { id: 3, type: 'report', icon: Sparkles, title: 'AI Skin Assessment Ready', desc: 'Your weekly skin health index increased to 88/100 (+4 points).', time: '5 hours ago', unread: false, color: '#5B6DFF' },
    { id: 4, type: 'alert', icon: ShieldAlert, title: 'UV Index Warning', desc: 'Peak UV index is 8 (Very High) today. Reapply SPF 50+ every 2 hours outdoors.', time: '1 day ago', unread: false, color: '#F59E0B' },
  ]);

  const [activeTab, setActiveTab] = useState('all');

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleDelete = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filtered = activeTab === 'all'
    ? notifications
    : activeTab === 'unread'
    ? notifications.filter(n => n.unread)
    : notifications.filter(n => n.type === activeTab);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Intelligence Feed
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Notifications & Alerts
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time AI routine prompts, hydration alerts, and clinical updates.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="btn-glass px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2"
        >
          <CheckCheck className="w-4 h-4 text-teal-500" /> Mark All as Read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 overflow-x-auto">
        {['all', 'unread', 'reminder', 'routine', 'report'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-[#18C8C8] text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <GlassCard className="p-12 text-center text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-sm">No notifications found</p>
          </GlassCard>
        ) : (
          filtered.map((n) => {
            const IconComponent = n.icon;
            return (
              <GlassCard
                key={n.id}
                className={`p-5 flex items-start gap-4 ${
                  n.unread ? 'border-l-4 border-l-[#18C8C8] bg-teal-50/30 dark:bg-teal-950/20' : ''
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md"
                  style={{ backgroundColor: n.color }}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {n.title}
                      {n.unread && (
                        <span className="w-2 h-2 rounded-full bg-[#18C8C8]" />
                      )}
                    </h3>
                    <span className="text-xs text-gray-400">{n.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {n.desc}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-gray-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
