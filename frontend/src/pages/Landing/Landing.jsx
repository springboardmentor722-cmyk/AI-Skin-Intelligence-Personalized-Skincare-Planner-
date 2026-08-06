import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, ShieldCheck, Activity, Brain, Sliders,
  Zap, Star, CheckCircle2, ChevronRight, Play, Heart, Users,
  Award, FileText, ChevronDown, Check, Droplets, Moon, Sun, Lock, Layers, FlaskConical
} from 'lucide-react';
import GlassCard from '../../components/ui/GlassCard';

export default function Landing() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);

  const stats = [
    { label: 'Active Users Analyzed', val: '50k+' },
    { label: 'Recommendation Accuracy', val: '96%' },
    { label: 'Clinical Ingredients Indexed', val: '100+' },
    { label: 'AI Diagnostic Telemetry', val: '24/7' },
  ];

  const features = [
    {
      icon: Brain,
      title: 'AI Computer Vision Scan',
      desc: 'Neural vision algorithms evaluate skin condition severities, localized redness, pore congestion, and barrier integrity in seconds.',
      tag: 'Neural Scanner'
    },
    {
      icon: Sliders,
      title: 'Biometric Routine Engine',
      desc: 'Adaptive AM/PM routine planner tailored to your climate, UV index, sleep metrics, hydration levels, and target concerns.',
      tag: 'Dynamic Planner'
    },
    {
      icon: FlaskConical,
      title: 'Ingredient Compatibility Engine',
      desc: 'Screen complete INCI ingredient formulas, detect pairwise chemical conflicts (e.g. Vitamin C + Retinol), and calculate safety scores.',
      tag: 'Chemical Safety'
    },
    {
      icon: Activity,
      title: 'Clinical Progress Telemetry',
      desc: 'Monitor your 90-day skin health index, routine adherence rates, hydration logs, and 4-12 week projected before/after photo improvements.',
      tag: 'Clinical Telemetry'
    }
  ];

  const productImages = [
    { name: "CeraVe Hydrating Cleanser", brand: "CeraVe", match: "98%", img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80" },
    { name: "Skin+Me Custom Serum", brand: "Skin+Me", match: "96%", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80" },
    { name: "La Roche-Posay Hyalu B5", brand: "La Roche-Posay", match: "94%", img: "https://images.unsplash.com/photo-1608248597263-000799965d4a?auto=format&fit=crop&w=400&q=80" },
    { name: "Paula's Choice 2% BHA", brand: "Paula's Choice", match: "92%", img: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80" }
  ];

  const faqs = [
    { q: 'How accurate is the AI skin profile assessment?', a: 'Our clinical diagnostic engine cross-references over 100+ dermatological criteria with 96% recommendation accuracy validated against in-office consultations.' },
    { q: 'Can I consult with a real dermatologist through the platform?', a: 'Yes! Certified dermatologists and skincare consultants review AI clinical reports and can issue custom prescriptions directly inside the specialist workspace.' },
    { q: 'How does the ingredient compatibility checker work?', a: 'Our engine evaluates molecular interactions between active ingredients (such as Vitamin C, Retinol, AHA/BHA, Niacinamide) to alert you of potential chemical conflicts and barrier degradation.' },
    { q: 'Is my facial diagnostic data secure?', a: 'We enforce end-to-end data encryption and HIPAA-standard privacy safeguards. Your data and uploaded progress photos are strictly confidential.' },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
      
      {/* ── LUXURY NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 h-20 z-50 bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between px-6 lg:px-12">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-white font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight block text-white">AI Skin Intelligence</span>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Clinical SaaS Platform</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
          <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How AI Works</a>
          <a href="#products" className="hover:text-cyan-400 transition-colors">Products</a>
          <Link to="/about" className="hover:text-cyan-400 transition-colors">About</Link>
          <Link to="/contact" className="hover:text-cyan-400 transition-colors">Contact</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
            Sign In
          </Link>
          <Link to="/skin-assessment" className="px-6 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-cyan-500/25 hover:opacity-95 transition-all flex items-center gap-2">
            Start Assessment <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="pt-36 pb-20 px-6 lg:px-12 relative overflow-hidden">
        {/* Ambient Orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline & Subheading */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Clinical-Grade Skincare Intelligence
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              AI Skin Intelligence. <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Clinical-Grade Personalized Skincare.
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
              Analyze your skin profile, lifestyle, sleep, hydration, ingredient compatibility and receive dermatologist-inspired recommendations powered by AI.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/skin-assessment')}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-3"
              >
                <span>Start Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#how-it-works"
                className="px-8 py-4 rounded-full border border-slate-700 bg-slate-900/60 text-slate-200 font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 backdrop-blur-md"
              >
                <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                <span>Learn More</span>
              </a>
            </div>

            {/* Micro proof badges */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center gap-6">
              <div className="flex -space-x-3">
                {['photo-1534528741775-53994a69daeb', 'photo-1544005313-94ddf0286df2', 'photo-1517841905240-472988babdf9', 'photo-1524504388940-b1c1722653e1'].map((img, i) => (
                  <img key={i} src={`https://images.unsplash.com/${img}?auto=format&fit=crop&w=100&q=80`} alt="User avatar" className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover" />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
                  <span className="text-white ml-1 font-extrabold">4.9/5.0</span>
                </div>
                <div className="text-xs text-slate-400 font-medium">Trusted by 50,000+ skincare enthusiasts</div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Scanner Card */}
          <div className="lg:col-span-5 relative">
            <GlassCard className="p-6 space-y-6 relative border-slate-700/60 shadow-2xl bg-slate-900/80 backdrop-blur-2xl">
              <div className="relative h-72 w-full rounded-2xl overflow-hidden border border-slate-800">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80" alt="AI Scan Telemetry" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />

                {/* Animated AI Radar Scanner Beam */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#06b6d4] animate-pulse" style={{ top: '45%' }} />

                {/* Scanning points */}
                <div className="absolute top-1/3 left-1/3 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                <div className="absolute top-2/3 right-1/3 w-3 h-3 rounded-full bg-purple-400 animate-ping [animation-delay:1s]" />

                <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono font-bold text-cyan-300">
                  AI Barrier Score: 87/100
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Skin Condition</div>
                  <div className="text-base font-extrabold text-white">Hydrated & Balanced</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Recommended Active</div>
                  <div className="text-base font-extrabold text-cyan-400">Niacinamide 10%</div>
                </div>
              </div>
            </GlassCard>
          </div>

        </div>
      </section>

      {/* ── STATISTICS BAR ── */}
      <section className="py-12 border-y border-slate-800/80 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, idx) => (
            <div key={idx} className="text-center space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{s.val}</div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SCROLLING PRODUCTS SHOWCASE ── */}
      <section id="products" className="py-20 px-6 lg:px-12 bg-slate-900/30">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 uppercase tracking-wider">
              Clinical Catalog Matches
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Dermatologist-Approved Formulas</h2>
            <p className="text-slate-400 text-sm">Matched directly to your skin assessment, active concerns, and budget tier</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productImages.map((p, idx) => (
              <GlassCard key={idx} className="p-5 space-y-3 group hover:border-cyan-500/40 transition-all">
                <div className="h-48 w-full rounded-xl overflow-hidden relative">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute top-2 right-2 bg-slate-950/80 text-cyan-400 font-extrabold text-xs px-2.5 py-1 rounded-full border border-slate-700">
                    {p.match} Match
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">{p.brand}</div>
                  <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">{p.name}</h3>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Full-Stack AI Skincare Ecosystem</h2>
            <p className="text-slate-400 text-sm">Four core engines working together to optimize your long-term skin barrier</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <GlassCard key={idx} className="p-6 space-y-4 flex flex-col justify-between hover:border-cyan-500/40 transition-all">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{f.tag}</span>
                    <h3 className="text-lg font-bold text-white">{f.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION ── */}
      <section className="py-20 px-6 lg:px-12 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm">Everything you need to know about our clinical AI skin diagnostic platform</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <GlassCard key={idx} className="p-6 cursor-pointer" onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}>
                <div className="flex items-center justify-between font-bold text-white text-base">
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-cyan-400' : ''}`} />
                </div>
                {activeFaq === idx && (
                  <p className="mt-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-3">{faq.a}</p>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-6 lg:px-12 relative">
        <div className="max-w-5xl mx-auto">
          <GlassCard className="p-12 text-center space-y-6 relative overflow-hidden bg-gradient-to-r from-cyan-500/10 via-blue-600/10 to-purple-600/10 border-slate-700">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Ready to Transform Your Skin Health?</h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto">
              Start your free AI skin assessment now and receive instant clinical insights, routine sequencing, and ingredient safety scores.
            </p>
            <button
              onClick={() => navigate('/skin-assessment')}
              className="px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-extrabold text-base shadow-xl shadow-cyan-500/25 hover:opacity-95 transition-all inline-flex items-center gap-3"
            >
              <span>Launch AI Skin Assessment</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </GlassCard>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© 2026 AI Skin Intelligence Platform. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
            <a href="#" className="hover:text-slate-300">HIPAA Compliance</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
