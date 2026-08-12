import React from 'react';
import { BrandMark } from './BrandMark';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
        <div className="flex items-center gap-3">
          <BrandMark size="md" />
          <div>
            <span className="font-bold text-xl tracking-tight text-white block leading-none">
              dermat
            </span>
            <span className="text-[9px] uppercase tracking-widest text-purple-300 font-semibold block mt-0.5">
              skin intelligence
            </span>
          </div>
        </div>

        <p className="text-center md:text-left text-slate-300 font-serif italic text-lg">
          Better skin begins with feeling understood.
        </p>

        <div className="flex justify-center md:justify-end gap-6 text-xs text-slate-400 font-medium">
          <a href="#instagram" className="hover:text-purple-300 transition">Instagram</a>
          <a href="#privacy" className="hover:text-purple-300 transition">Privacy Policy</a>
          <a href="#contact" className="hover:text-purple-300 transition">Contact Care</a>
        </div>

        <div className="col-span-1 md:col-span-3 border-t border-slate-800 pt-8 mt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© 2026 Dermat Skin Intelligence. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Dermatologist-Approved & Powered by Skin AI</p>
        </div>
      </div>
    </footer>
  );
};
