import React, { useState } from 'react';
import {
  Users,
  BarChart3,
  Sparkles,
  Layers,
  ShoppingBag,
  Database,
  FileText,
  Bell,
  Settings,
  ShieldCheck,
  Key,
  HardDrive,
  TrendingUp,
  Activity,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  UserPlus
} from 'lucide-react';
import { UserProfile } from '../types';
import { BrandMark } from '../components/BrandMark';

interface AdminDashboardViewProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Mock initial users list for User Management
  const [usersList, setUsersList] = useState([
    { id: 'a-1', name: 'Admin User', email: 'admin@gmail.com', role: 'admin', joinedAt: '2025-01-01', status: 'Active' },
    { id: 'u-1', name: 'Ananya Verma', email: 'ananya@dermat.com', role: 'user', joinedAt: '2026-02-14', status: 'Active' },
    { id: 'c-1', name: 'Dr. Priya Sharma', email: 'priya.consultant@dermat.com', role: 'consultant', joinedAt: '2026-01-10', status: 'Active' },
    { id: 'd-1', name: 'Dr. Sarah Johnson', email: 'dr.sarah@dermat.com', role: 'dermatologist', joinedAt: '2025-11-20', status: 'Active' },
    { id: 'd-2', name: 'Dr. Arjun Shah', email: 'arjun.shah@dermat.com', role: 'dermatologist', joinedAt: '2025-12-05', status: 'Active' },
    { id: 'u-2', name: 'Rohan Mehta', email: 'rohan@example.com', role: 'user', joinedAt: '2026-03-01', status: 'Active' },
    { id: 'u-3', name: 'Maya Patel', email: 'maya@example.com', role: 'user', joinedAt: '2026-03-12', status: 'Active' },
  ]);

  const [newUserModal, setNewUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'consultant' | 'dermatologist' | 'admin'>('user');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    const created = {
      id: `usr-${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'Active',
    };
    setUsersList([created, ...usersList]);
    setNewUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    triggerToast(`New ${newUserRole} created successfully!`);
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const sidebarNavItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: BarChart3, desc: 'Platform summary' },
    { id: 'users', label: 'User Management', icon: Users, desc: 'Users, roles & credentials' },
    { id: 'analytics', label: 'Platform Analytics', icon: TrendingUp, desc: 'User growth & metrics' },
    { id: 'recommendations', label: 'Recommendation Monitoring', icon: Sparkles, desc: 'AI accuracy & product logs' },
    { id: 'reports', label: 'System Reports', icon: FileText, desc: 'Audit, logs & exports' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100/70 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-purple-500/30 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Admin Sidebar Navigation (Matches Admin.png) */}
      <aside className="w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3">
            <BrandMark size="md" />
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 block leading-none">
                Skin Intelligence
              </span>
              <span className="text-[10px] font-bold tracking-widest text-purple-600 uppercase block mt-0.5">
                ADMIN PANEL
              </span>
            </div>
          </div>

          {/* Main Menu Navigation */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">MAIN MENU</p>
            <nav className="space-y-1">
              {sidebarNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-left ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-purple-600'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-none truncate">{item.label}</p>
                      <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-purple-200' : 'text-slate-400'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Platform Status Box */}
        <div className="p-4 m-4 bg-purple-50/70 border border-purple-200/60 rounded-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-xs font-bold text-slate-800">Platform Status</p>
          </div>
          <p className="text-[10px] text-slate-500">● All systems operational</p>
          <p className="text-[10px] font-semibold text-purple-700">Uptime: 99.9%</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        {/* Top Bar Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              Welcome back, Admin! 👋
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Here's what's happening on your platform today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search users, reports, assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 w-64 shadow-sm"
              />
            </div>

            {/* Notifications Bell */}
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-purple-600 relative shadow-sm">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>

            {/* Admin Profile Pill & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">Admin User</p>
                <p className="text-[10px] text-purple-600 font-semibold">Super Administrator</p>
              </div>
              <button
                onClick={onLogout}
                className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold transition flex items-center gap-1 border border-rose-200"
                title="Logout Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: MAIN DASHBOARD OVERVIEW (Exact Replica of Admin.png) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-medium">Total Users</span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">12,845</p>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> ↑ 18% this month
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-medium">Assessments Completed</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">8,932</p>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> ↑ 22% this month
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-medium">Active Routines</span>
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">6,742</p>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> ↑ 16% this month
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-medium">Total Products</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">1,248</p>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> ↑ 12% this month
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-medium">Platform Revenue</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">₹24,80,500</p>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> ↑ 20% this month
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-medium">System Uptime</span>
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">99.9%</p>
                <p className="text-[10px] text-emerald-600 font-bold">All systems healthy</p>
              </div>
            </div>

            {/* Row 2: Charts Grid (User Overview, User Growth, Assessments Overview) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Overview Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">User Overview</h3>
                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border">This Month ▾</span>
                </div>
                <div className="space-y-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Users
                    </span>
                    <span className="font-bold text-slate-800">10,243 <span className="text-slate-400 font-normal">(79.7%)</span></span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Consultants
                    </span>
                    <span className="font-bold text-slate-800">1,542 <span className="text-slate-400 font-normal">(12.0%)</span></span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Dermatologists
                    </span>
                    <span className="font-bold text-slate-800">687 <span className="text-slate-400 font-normal">(5.3%)</span></span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Admins
                    </span>
                    <span className="font-bold text-slate-800">373 <span className="text-slate-400 font-normal">(2.9%)</span></span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full text-center text-xs text-purple-600 font-bold hover:underline pt-2 border-t border-slate-100 block"
                >
                  View All Users →
                </button>
              </div>

              {/* User Growth Chart Box */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">User Growth</h3>
                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border">This Month ▾</span>
                </div>
                <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2">
                  {[35, 45, 60, 78, 92, 100].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div
                        className="w-full bg-purple-600/80 hover:bg-purple-600 rounded-t-lg transition-all"
                        style={{ height: `${val}%` }}
                      ></div>
                      <span className="text-[9px] text-slate-400">{['Apr 21', 'Apr 28', 'May 5', 'May 12', 'May 19', 'May 26'][idx]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold text-center pt-2 border-t border-slate-100">
                  ↑ 18% growth compared to last month
                </p>
              </div>

              {/* Assessments Overview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Assessments Overview</h3>
                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border">This Month ▾</span>
                </div>
                <div className="space-y-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Completed
                    </span>
                    <span className="font-bold text-slate-800">6,742 <span className="text-slate-400 font-normal">(75.4%)</span></span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> In Progress
                    </span>
                    <span className="font-bold text-slate-800">1,452 <span className="text-slate-400 font-normal">(16.2%)</span></span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Pending
                    </span>
                    <span className="font-bold text-slate-800">738 <span className="text-slate-400 font-normal">(8.3%)</span></span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('assessments')}
                  className="w-full text-center text-xs text-purple-600 font-bold hover:underline pt-2 border-t border-slate-100 block"
                >
                  View All Assessments →
                </button>
              </div>
            </div>

            {/* Row 3: Concerns, Revenue & Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top Skin Concerns */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Top Skin Concerns</h3>
                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border">This Month ▾</span>
                </div>
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Acne & Post Acne Marks</span>
                      <span className="text-purple-600">3,245 (36%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 w-[36%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Hyperpigmentation</span>
                      <span className="text-purple-600">2,145 (24%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 w-[24%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Dryness & Barrier Support</span>
                      <span className="text-purple-600">1,456 (16%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[16%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Sensitive Skin</span>
                      <span className="text-purple-600">1,102 (12%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 w-[12%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Overview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Revenue Overview</h3>
                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border">This Month ▾</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">₹24,80,500</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">↑ 20% vs last month</p>
                </div>
                <div className="h-28 bg-gradient-to-t from-purple-50/50 to-transparent rounded-xl border border-purple-100 flex items-end justify-around p-2">
                  <div className="w-3 bg-purple-300 rounded-t h-[40%]"></div>
                  <div className="w-3 bg-purple-400 rounded-t h-[55%]"></div>
                  <div className="w-3 bg-purple-500 rounded-t h-[70%]"></div>
                  <div className="w-3 bg-purple-600 rounded-t h-[85%]"></div>
                  <div className="w-3 bg-purple-700 rounded-t h-[100%]"></div>
                </div>
              </div>

              {/* Recent Activity Stream */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 mb-2">Recent Activity</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 shrink-0"></span>
                    <div>
                      <p className="font-semibold text-slate-800">New user registered</p>
                      <p className="text-[10px] text-slate-400">Ananya Verma (User) • 2 min ago</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <div>
                      <p className="font-semibold text-slate-800">Skin assessment completed</p>
                      <p className="text-[10px] text-slate-400">By Dr. Priya Sharma (Consultant) • 15 min ago</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <div>
                      <p className="font-semibold text-slate-800">New product added</p>
                      <p className="text-[10px] text-slate-400">Vitamin C Brightening Serum • 1 hour ago</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0"></span>
                    <div>
                      <p className="font-semibold text-slate-800">Routine plan created</p>
                      <p className="text-[10px] text-slate-400">For Riya Singh (User) • 2 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Health & Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900">System Health</h3>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] font-bold text-emerald-800">Database</p>
                    <p className="text-xs font-semibold text-emerald-600">Healthy</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] font-bold text-emerald-800">API Services</p>
                    <p className="text-xs font-semibold text-emerald-600">Healthy</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] font-bold text-emerald-800">Storage</p>
                    <p className="text-xs font-semibold text-emerald-600">Healthy</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] font-bold text-emerald-800">Email Service</p>
                    <p className="text-xs font-semibold text-emerald-600">Healthy</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900">Quick Actions</h3>
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => setNewUserModal(true)}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition text-center space-y-1"
                  >
                    <UserPlus className="w-4 h-4 mx-auto text-purple-600" />
                    <p className="text-[10px] font-bold">Add New User</p>
                  </button>

                  <button
                    onClick={() => triggerToast('Product creation modal launched!')}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition text-center space-y-1"
                  >
                    <ShoppingBag className="w-4 h-4 mx-auto text-amber-600" />
                    <p className="text-[10px] font-bold">Add Product</p>
                  </button>

                  <button
                    onClick={() => triggerToast('Routine template generator ready')}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition text-center space-y-1"
                  >
                    <Layers className="w-4 h-4 mx-auto text-indigo-600" />
                    <p className="text-[10px] font-bold">Create Routine</p>
                  </button>

                  <button
                    onClick={() => triggerToast('Platform performance report exported!')}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition text-center space-y-1"
                  >
                    <FileText className="w-4 h-4 mx-auto text-teal-600" />
                    <p className="text-[10px] font-bold">Generate Report</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-slate-900">User Management</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage platform users, roles, and access credentials.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="user">User / Member</option>
                  <option value="consultant">Consultant</option>
                  <option value="dermatologist">Dermatologist</option>
                  <option value="admin">Admin</option>
                </select>

                <button
                  onClick={() => setNewUserModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-md shadow-purple-600/20 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add User
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3 px-4">User</th>
                    <th className="p-3 px-4">Email</th>
                    <th className="p-3 px-4">Role</th>
                    <th className="p-3 px-4">Joined Date</th>
                    <th className="p-3 px-4">Status</th>
                    <th className="p-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="p-3 px-4 text-slate-600">{u.email}</td>
                      <td className="p-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'dermatologist'
                              ? 'bg-teal-100 text-teal-700'
                              : u.role === 'consultant'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 px-4 text-slate-500">{u.joinedAt}</td>
                      <td className="p-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => triggerToast(`Reset password sent to ${u.email}`)}
                          className="text-purple-600 hover:underline font-semibold text-[11px]"
                        >
                          Reset Pass
                        </button>
                        <button
                          onClick={() => {
                            setUsersList(usersList.filter((usr) => usr.id !== u.id));
                            triggerToast(`User ${u.name} removed.`);
                          }}
                          className="text-rose-600 hover:underline font-semibold text-[11px]"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">ANALYTICS & METRICS</p>
                <h2 className="font-serif text-2xl font-bold text-slate-900 mt-0.5">Platform Analytics Overview</h2>
                <p className="text-xs text-slate-500 mt-1">Real-time user engagement, session completion rates, and demographic breakdowns.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => triggerToast('Exported Analytics PDF Report')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition">
                  Export PDF
                </button>
                <button onClick={() => triggerToast('Refreshed real-time analytics data')} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-purple-600/20 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Live Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                <p className="text-[11px] font-medium text-slate-500">Daily Active Users (DAU)</p>
                <p className="text-2xl font-bold text-slate-900">3,482</p>
                <p className="text-[10px] text-emerald-600 font-bold">↑ 14.2% vs last week</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                <p className="text-[11px] font-medium text-slate-500">Avg. Consultation Time</p>
                <p className="text-2xl font-bold text-slate-900">8.4 mins</p>
                <p className="text-[10px] text-emerald-600 font-bold">Optimal engagement speed</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                <p className="text-[11px] font-medium text-slate-500">Skin Assessment Completion</p>
                <p className="text-2xl font-bold text-slate-900">94.8%</p>
                <p className="text-[10px] text-emerald-600 font-bold">High funnel retention</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                <p className="text-[11px] font-medium text-slate-500">Repeat Routine Usage</p>
                <p className="text-2xl font-bold text-slate-900">81.3%</p>
                <p className="text-[10px] text-emerald-600 font-bold">Active weekly routines</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Skin Type Demographic Breakdown</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Combination Skin</span>
                      <span className="text-purple-600">42% (5,394 users)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 w-[42%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Oily / Acne-Prone</span>
                      <span className="text-purple-600">28% (3,596 users)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[28%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Dry / Dehydrated</span>
                      <span className="text-purple-600">18% (2,312 users)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 w-[18%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Sensitive / Rosacea</span>
                      <span className="text-purple-600">12% (1,541 users)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400 w-[12%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Consultation Channel Distribution</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">AI Instant Scan & Assessment</span>
                    <span className="font-bold text-purple-700">6,420 sessions (62%)</span>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Human Skincare Consultant Chat</span>
                    <span className="font-bold text-indigo-700">2,580 sessions (25%)</span>
                  </div>
                  <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Dermatologist Clinical Consultations</span>
                    <span className="font-bold text-teal-700">1,345 sessions (13%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RECOMMENDATION MONITORING */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">AI & PRODUCT RULES</p>
                <h2 className="font-serif text-2xl font-bold text-slate-900 mt-0.5">Recommendation Monitoring</h2>
                <p className="text-xs text-slate-500 mt-1">Audit active ingredient matching rules, safety filter triggers, and product recommendation accuracy.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                <p className="text-[11px] font-medium text-slate-500">AI Recommendation Accuracy</p>
                <p className="text-2xl font-bold text-slate-900">98.4%</p>
                <p className="text-[10px] text-emerald-600 font-bold">Verified by Dermatologists</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                <p className="text-[11px] font-medium text-slate-500">Ingredient Safety Checks</p>
                <p className="text-2xl font-bold text-slate-900">14,290 / day</p>
                <p className="text-[10px] text-emerald-600 font-bold">Zero active conflicts</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
                <p className="text-[11px] font-medium text-slate-500">Sensitivity Overrides</p>
                <p className="text-2xl font-bold text-slate-900">124 flagged</p>
                <p className="text-[10px] text-amber-600 font-bold">Auto-blocked for barrier safety</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Live Recommendation Log & Safety Filters</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">Salicylic Acid + Retinol Conflict Guard</p>
                    <p className="text-[10px] text-slate-500">Automatically splits exfoliants to PM routine to prevent barrier stripping.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px] uppercase w-fit">ACTIVE & SAFE</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">Niacinamide 10% High Potency Match</p>
                    <p className="text-[10px] text-slate-500">Matched to Hyperpigmentation & Combination skin type users.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px] uppercase w-fit">ACTIVE & SAFE</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">Fragrance-Free Filter for Rosacea Profile</p>
                    <p className="text-[10px] text-slate-500">Excludes essential oils and synthetic perfume for sensitive skin tags.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-700 font-bold rounded-lg text-[10px] uppercase w-fit">VERIFIED BY DERM</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">SYSTEM & AUDIT</p>
                <h2 className="font-serif text-2xl font-bold text-slate-900 mt-0.5">System Reports & Diagnostic Logs</h2>
                <p className="text-xs text-slate-500 mt-1">Download monthly operational reports, security audit summaries, and server logs.</p>
              </div>
              <button onClick={() => triggerToast('Generated comprehensive system audit report (CSV)')} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-purple-600/20">
                Download Full System Report (CSV)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Monthly System Performance Reports</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">July 2026 Platform Performance Report</p>
                      <p className="text-[10px] text-slate-400">Contains system uptime, server response times & user logs</p>
                    </div>
                    <button onClick={() => triggerToast('Downloading July Report...')} className="text-purple-600 font-bold text-xs hover:underline">
                      Download
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">June 2026 Platform Performance Report</p>
                      <p className="text-[10px] text-slate-400">Contains system uptime, server response times & user logs</p>
                    </div>
                    <button onClick={() => triggerToast('Downloading June Report...')} className="text-purple-600 font-bold text-xs hover:underline">
                      Download
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Q2 Clinical Accuracy & Derm Audit</p>
                      <p className="text-[10px] text-slate-400">Compliance & prescription verification audit</p>
                    </div>
                    <button onClick={() => triggerToast('Downloading Clinical Audit...')} className="text-purple-600 font-bold text-xs hover:underline">
                      Download
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Live Server Diagnostic Status</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 border-b border-slate-100">
                    <span className="text-slate-600">Database Synchronization (SQLite + Cloud)</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Synchronized</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 border-b border-slate-100">
                    <span className="text-slate-600">Authentication Service (Role RBAC)</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Secure</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 border-b border-slate-100">
                    <span className="text-slate-600">AI Skin Analysis API Endpoint</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 180ms Response</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-slate-600">SSL / TLS Security Certificates</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Valid & Encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OTHER TABS: Placeholder sections for remaining items */}
        {activeTab !== 'dashboard' && activeTab !== 'users' && activeTab !== 'analytics' && activeTab !== 'recommendations' && activeTab !== 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
              <Settings className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-slate-900 capitalize">
              {sidebarNavItems.find((i) => i.id === activeTab)?.label || activeTab}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              System monitoring and settings actively connected. Platform operating at 99.9% health.
            </p>
            <button
              onClick={() => triggerToast('Settings saved & synced across cloud instance.')}
              className="bg-purple-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-purple-700 transition"
            >
              Save Section Changes
            </button>
          </div>
        )}
      </main>

      {/* New User Creation Modal */}
      {newUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-4">
            <h3 className="font-serif text-xl font-bold text-slate-900">Add New Platform Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Maya Lin"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="maya@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-purple-600"
                >
                  <option value="user">User / Member</option>
                  <option value="consultant">Skincare Consultant</option>
                  <option value="dermatologist">Dermatologist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewUserModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
