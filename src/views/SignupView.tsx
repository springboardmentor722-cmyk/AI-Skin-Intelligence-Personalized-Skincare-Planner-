import React, { useState } from 'react';
import { BrandMark } from '../components/BrandMark';
import { PasswordInput } from '../components/PasswordInput';
import { saveUser, setCurrentUser } from '../services/db';
import { ArrowRight, Sparkles } from 'lucide-react';

interface SignupViewProps {
  onNavigate: (view: string) => void;
  onLoginSuccess: (user: any) => void;
}

export const SignupView: React.FC<SignupViewProps> = ({ onNavigate, onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skinType, setSkinType] = useState('Combination');
  const [role, setRole] = useState<'user' | 'consultant' | 'dermatologist'>('user');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill out all required fields.');
      return;
    }

    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          primaryConcern: 'Clarity & Hydration',
          skinType,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        setError(data.message || 'Registration failed.');
        return;
      }

      const newUser = saveUser({
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        skinType: data.user.skin_type || skinType,
        primaryConcern: data.user.primary_concern || 'Clarity & Hydration',
        skinHealthScore: 80,
        status: 'Active',
      });

      setCurrentUser(newUser);
      onLoginSuccess(newUser);
      if (role === 'consultant') {
        onNavigate('consultant-dashboard');
      } else {
        onNavigate('dashboard');
      }
    } catch (err) {
      const newUser = saveUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        skinType,
        primaryConcern: 'Clarity & Hydration',
        skinHealthScore: 80,
        status: 'Active',
      });

      setCurrentUser(newUser);
      onLoginSuccess(newUser);
      if (role === 'consultant') {
        onNavigate('consultant-dashboard');
      } else {
        onNavigate('dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col justify-center items-center p-4">
      <button
        onClick={() => onNavigate('landing')}
        className="fixed top-6 left-6 z-20 text-xs font-semibold text-slate-600 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 hover:text-purple-600 transition"
      >
        ← Back to Soluna
      </button>

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-100">
        <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <BrandMark size="md" />
            <span className="font-bold text-xl tracking-tight">soluna</span>
          </div>

          <div className="space-y-4 my-12 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> YOUR PERSONAL RITUAL
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight text-white">
              Care that grows<br />
              <em className="italic text-amber-200 font-serif">with you.</em>
            </h1>
            <p className="text-slate-300 text-xs leading-relaxed max-w-xs">
              Begin with a few simple details. We'll take care of the thoughtful part.
            </p>
          </div>

          <div className="flex gap-6 text-xs text-purple-200 relative z-10">
            <span>✦ 100% Personalized</span>
            <span>✦ Derm-reviewed</span>
          </div>
        </div>

        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">START YOUR JOURNEY</p>
            <h2 className="font-serif text-3xl font-bold text-slate-900 mt-1">Let's get to know you.</h2>
            <p className="text-xs text-slate-500 mt-1">It only takes a minute to begin your ritual.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ananya Verma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              >
                <option value="user">User / Member</option>
                <option value="consultant">Skincare Consultant</option>
                <option value="dermatologist">Dermatologist</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Skin Type</label>
              <select
                value={skinType}
                onChange={(e) => setSkinType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              >
                <option value="Combination">Combination</option>
                <option value="Oily">Oily</option>
                <option value="Dry">Dry</option>
                <option value="Sensitive">Sensitive</option>
                <option value="Normal">Normal</option>
              </select>
            </div>

            <PasswordInput
              label="Choose a Password"
              placeholder="Create a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm py-3.5 rounded-xl transition shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 mt-2"
            >
              Create my ritual <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-purple-600 font-bold hover:underline"
            >
              Sign in →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
