import React from 'react';
import { BrandMark } from './BrandMark';
import { ArrowRight } from 'lucide-react';

interface NavbarProps {
  onNavigate: (view: string) => void;
  currentUser?: any;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentUser }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-50/60">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 text-left group"
        >
          <BrandMark size="md" />
          <div>
            <span className="font-bold text-xl tracking-tight text-slate-900 block leading-none">
              dermat
            </span>
            <span className="text-[9px] uppercase tracking-widest text-purple-600 font-semibold block mt-0.5">
              skin intelligence
            </span>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button
            onClick={() => {
              const el = document.getElementById('scanner');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-purple-600 transition"
          >
            How it works
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('results');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-purple-600 transition"
          >
            Results
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('products');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-purple-600 transition"
          >
            Shop & Recommendations
          </button>
        </nav>

        <div className="flex items-center gap-4">
          {currentUser ? (
            <button
              onClick={() =>
                onNavigate(currentUser.role === 'consultant' ? 'consultant-dashboard' : 'dashboard')
              }
              className="bg-purple-600 text-white font-semibold text-xs px-5 py-2.5 rounded-full hover:bg-purple-700 transition flex items-center gap-2 shadow-sm"
            >
              My Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigate('login')}
                className="text-xs font-semibold text-slate-700 hover:text-purple-600 transition px-3 py-2"
              >
                Log in
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="bg-purple-600 text-white font-semibold text-xs px-5 py-2.5 rounded-full hover:bg-purple-700 transition flex items-center gap-2 shadow-md shadow-purple-600/20"
              >
                Begin your ritual <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
