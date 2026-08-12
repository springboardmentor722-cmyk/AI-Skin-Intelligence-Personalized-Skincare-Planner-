import React from 'react';
import { BrandMark } from './BrandMark';
import {
  LayoutDashboard,
  User,
  Scan,
  Calendar,
  UserCheck,
  CalendarCheck,
  ShoppingBag,
  FlaskConical,
  Award,
  TrendingUp,
  Settings,
  LogOut,
} from 'lucide-react';

interface UserSidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({
  activeView,
  onNavigate,
  onLogout,
}) => {
  const sections = [
    {
      group: 'OVERVIEW',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      group: 'SKIN JOURNEY',
      items: [
        { id: 'profile', label: 'My Skin Profile', icon: User },
        { id: 'assessment', label: 'Skin Assessment', icon: Scan },
        { id: 'routine', label: 'Routine Generator', icon: Calendar },
      ],
    },
    {
      group: 'CARE & EXPERTS',
      items: [
        { id: 'dermatologists', label: 'Dermatologists', icon: UserCheck },
        { id: 'appointments', label: 'Appointments', icon: CalendarCheck },
        { id: 'products', label: 'Product Recommendations', icon: ShoppingBag },
        { id: 'ingredients', label: 'Ingredient Analyzer', icon: FlaskConical },
      ],
    },
    {
      group: 'INSIGHTS',
      items: [
        { id: 'score', label: 'Skin Health Score', icon: Award },
        { id: 'progress', label: 'Progress Tracking', icon: TrendingUp },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 h-screen sticky top-0 flex flex-col justify-between p-5 z-30 shrink-0">
      <div>
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 px-2 mb-6 text-left"
        >
          <BrandMark size="md" />
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 block leading-none">
              dermat
            </span>
            <span className="text-[9px] uppercase tracking-wider text-purple-600 font-bold block mt-0.5">
              SKIN INTELLIGENCE
            </span>
          </div>
        </button>

        <div className="space-y-5">
          {sections.map((sec) => (
            <div key={sec.group}>
              <p className="px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">
                {sec.group}
              </p>
              <nav className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
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
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 space-y-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};
