import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 text-center">
      <div className="w-16 h-16 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-indigo-400" />
      </div>
      <h1 className="text-6xl font-serif font-bold text-white mb-3">404</h1>
      <h2 className="text-2xl font-serif font-semibold text-slate-300 mb-2">Page Not Found</h2>
      <p className="text-slate-400 max-w-md mb-8 text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition cursor-pointer"
      >
        <Home className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
}
