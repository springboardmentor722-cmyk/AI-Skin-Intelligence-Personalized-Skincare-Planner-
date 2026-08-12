import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Inbox, 
  Calendar, 
  Clock, 
  UserCheck, 
  LogOut, 
  Stethoscope,
  Sparkles
} from 'lucide-react';
import { BrandMark } from './BrandMark';

interface DermatologistSidebarProps {
  currentTab: 'dashboard' | 'patients' | 'requests' | 'appointments' | 'availability' | 'profile';
  onSelectTab: (tab: 'dashboard' | 'patients' | 'requests' | 'appointments' | 'availability' | 'profile') => void;
  onLogout: () => void;
  doctorName?: string;
}

export const DermatologistSidebar: React.FC<DermatologistSidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  doctorName = 'Dr. Sarah Johnson',
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'requests', label: 'Consultation Requests', icon: Inbox, badge: 'New' },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'availability', label: 'Availability & Slots', icon: Clock },
    { id: 'profile', label: 'My Practice Profile', icon: UserCheck },
  ] as const;

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-100 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <BrandMark theme="light" size="md" />
          <span className="text-[10px] font-bold tracking-widest text-purple-600 uppercase mt-1 block">
            Dermatologist Portal
          </span>
        </div>
      </div>

      {/* Doctor Profile Banner */}
      <div className="p-4 mx-4 my-3 bg-purple-50/80 rounded-xl border border-purple-100/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-serif font-bold text-sm shrink-0 shadow-sm">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-slate-900 truncate">{doctorName}</p>
          <p className="text-[10px] text-purple-700 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Clinical Specialist
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Clinical Management
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:text-purple-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                <span>{item.label}</span>
              </div>
              {'badge' in item && item.badge && !isActive && (
                <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info & Logout */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-[11px] text-purple-800 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <span>Clinical workflow connected to Consultant network.</span>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition border border-rose-100"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
};
