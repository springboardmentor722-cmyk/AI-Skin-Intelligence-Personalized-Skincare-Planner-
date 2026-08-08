import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Activity, Settings, Database, AlertCircle, BarChart3, Clock, FileText, ShoppingBag } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_active_users: 0,
    ai_scans_today: 0,
    pending_verifications: 0,
    api_error_rate: "0.00%",
    avg_latency: "0ms"
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/admin/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      }
    };
    fetchStats();
  }, []);
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in font-sans">
      <div className="mb-10">
        <h1 className="text-3xl font-serif font-bold text-[#001534] flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-[#9f7c46]" /> System Administration
        </h1>
        <p className="text-slate-500 mt-2">Platform analytics, user management, and system health oversight.</p>
      </div>

      {/* Primary Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Active Users', value: stats.total_active_users, change: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'AI Scans Today', value: stats.ai_scans_today, change: '+5%', icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending Verifications', value: stats.pending_verifications, change: 'Action Required', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Avg Latency', value: stats.avg_latency, change: '-10ms', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-[#001534]">{stat.value}</p>
                <span className={`text-xs font-bold ${stat.change.startsWith('+') && stat.label !== 'API Error Rate' ? 'text-green-600' : 'text-slate-500'}`}>{stat.change}</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Health */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-bold font-serif text-[#001534] mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#9f7c46]" /> Infrastructure Health
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-700">Groq Vision API Quota</span>
                <span className="text-green-600">42% Used</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-700">Database Storage</span>
                <span className="text-yellow-600">78% Used</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-700">Server CPU Load</span>
                <span className="text-blue-600">24%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-[#fdfbf5] rounded-3xl border border-[#e5dfd1] shadow-sm p-8">
          <h2 className="text-xl font-bold font-serif text-[#001534] mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#9f7c46]" /> Admin Actions
          </h2>
          <div className="space-y-4">
            <button className="w-full bg-white border border-[#e5dfd1] hover:border-[#001534] text-[#001534] p-4 rounded-xl flex items-center justify-between font-bold text-sm transition">
              Manage Users & Roles <BarChart3 className="w-4 h-4 text-slate-400" />
            </button>
            <button className="w-full bg-white border border-[#e5dfd1] hover:border-[#001534] text-[#001534] p-4 rounded-xl flex items-center justify-between font-bold text-sm transition">
              View Audit Logs <FileText className="w-4 h-4 text-slate-400" />
            </button>
            <button className="w-full bg-white border border-[#e5dfd1] hover:border-[#001534] text-[#001534] p-4 rounded-xl flex items-center justify-between font-bold text-sm transition">
              Update Product Catalog <ShoppingBag className="w-4 h-4 text-slate-400" />
            </button>
            <button className="w-full bg-red-50 border border-red-100 hover:border-red-500 text-red-700 p-4 rounded-xl flex items-center justify-between font-bold text-sm transition mt-8">
              Emergency API Killswitch <AlertCircle className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
