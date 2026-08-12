import React from 'react';
import { BrandMark } from './BrandMark';
import { LayoutDashboard, Users, FileText, Sparkles, LogOut } from 'lucide-react';

interface ConsultantSidebarProps {
  currentTab: 'dashboard' | 'clients' | 'requests' | 'routine';
  onSelectTab: (tab: 'dashboard' | 'clients' | 'requests' | 'routine') => void;
  onLogout: () => void;
  userName?: string;
}

export const ConsultantSidebar: React.FC<ConsultantSidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  userName = 'Consultant',
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'requests', label: 'Requests', icon: FileText },
    { id: 'routine', label: 'Routine Builder', icon: Sparkles },
  ] as const;

  return (
    <aside className="w-64 bg-white border-r border-slate-100 h-screen sticky top-0 flex flex-col justify-between p-5 z-30 shrink-0">
      <div>
        <div className="flex items-center gap-3 px-2 mb-8">
          <BrandMark size="md" />
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 block leading-none">
              dermat
            </span>
            <span className="text-[9px] uppercase tracking-wider text-purple-600 font-bold block mt-0.5">
              CONSULTANT PANEL
            </span>
          </div>
        </div>

        <p className="px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">
          CONSULTANT WORKSPACE
        </p>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-purple-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Get AI insights & custom recommendations for your clients.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};
