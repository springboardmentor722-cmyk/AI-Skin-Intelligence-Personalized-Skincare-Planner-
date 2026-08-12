import React, { useState } from 'react';
import beforeImage from '../assets/images/before_skin_week1_1785496288382.jpg';
import afterImage from '../assets/images/after_skin_week8_1785496301183.jpg';
import { 
  ArrowRight, 
  Play, 
  Check, 
  Sparkles, 
  Star, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Smartphone, 
  Award,
  Zap,
  CheckCircle2,
  Apple
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (view: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is Dermat a replacement for a dermatologist?',
      a: 'No. Dermat gives you intelligent, personalized guidance and makes it easy to connect with a qualified dermatologist when you need clinical support or prescriptions.'
    },
    {
      q: 'How does the skin scan work?',
      a: 'Our advanced skin intelligence engine analyzes high-resolution photos to measure hydration, texture, redness, and dark spots, giving you immediate actionable insights.'
    },
    {
      q: 'Can I use products I already own?',
      a: 'Yes! Dermat seamlessly integrates your current skincare shelf into personalized routines and highlights which steps work best together.'
    },
    {
      q: 'Is my skin data private?',
      a: 'Absolutely. Your photos and skin assessments are encrypted and stored securely. We never sell or share your personal skin data.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcf8f5] text-slate-800 font-sans">
      {/* Hero Section */}
      <section id="top" className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 bg-gradient-to-b from-purple-100/50 via-[#f7f0eb] to-[#fcf8f5]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold tracking-wider uppercase border border-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> YOUR SKIN, DECODED
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Finally, skincare that <em className="italic text-purple-700 font-serif">understands</em> you.
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Meet the intelligence that learns your skin's changing needs and turns them into a gentle ritual you'll look forward to every day.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('login')}
                className="bg-purple-700 text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-purple-800 transition shadow-lg shadow-purple-700/25 flex items-center gap-2"
              >
                Discover your skin <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  document.getElementById('before-after')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 hover:text-purple-700 px-4 py-3 transition"
              >
                <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-purple-700 ml-0.5" />
                </span>
                See real progress
              </button>
            </div>

            <div className="pt-6 flex items-center gap-4 text-xs text-slate-600">
              <div className="flex -space-x-2">
                {['J', 'M', 'A', 'S'].map((initial, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white ${
                      ['bg-rose-400', 'bg-purple-600', 'bg-amber-500', 'bg-teal-600'][i]
                    }`}
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <p>
                <strong className="text-slate-900 font-semibold">18,000+ people</strong> are glowing with Dermat
              </p>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative flex justify-center">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full overflow-hidden border-8 border-white shadow-2xl shadow-purple-900/15">
              <img
                src={afterImage}
                alt="Radiant Skin Model"
                className="w-full h-full object-cover object-center"
              />
            </div>
            {/* Floating Cards */}
            <div className="absolute top-6 -left-2 sm:left-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-purple-100 text-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                ✦
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Skin health score</p>
                <p className="text-lg font-bold text-slate-900">86 <span className="text-[10px] text-emerald-600 font-normal">+12 this month</span></p>
              </div>
            </div>

            <div className="absolute bottom-6 right-0 sm:right-6 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-purple-100 text-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                ☼
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Today's ritual</p>
                <p className="text-xs font-bold text-slate-900">3 of 3 steps complete</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: BEFORE / AFTER SLIDING PAGE (Requirements 3 & 4) */}
      <section id="before-after" className="py-24 bg-[#f8f3ee] border-y border-purple-100/60">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <p className="text-xs font-bold tracking-widest text-purple-700 uppercase">01 — VISIBLE CHANGE</p>
            <h2 className="font-serif text-4xl font-bold text-slate-900 leading-tight">
              Progress you can <em className="italic text-purple-700 font-serif">actually see.</em>
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Small daily moments become visible change. Track your journey with thoughtful insights, not pressure.
            </p>
          </div>

          {/* Interactive Before / After Slider */}
          <div className="max-w-3xl mx-auto">
            <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden border-2 border-purple-100 shadow-2xl select-none">
              {/* After Image */}
              <img
                src={afterImage}
                alt="After Week 8"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <span className="absolute top-4 right-4 bg-purple-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                AFTER (WEEK 8)
              </span>

              {/* Before Image with Clip */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={beforeImage}
                  alt="Before Week 1"
                  className="absolute inset-0 w-full h-full object-cover max-w-none"
                  style={{ width: '100%', height: '100%' }}
                />
                <span className="absolute top-4 left-4 bg-slate-900/80 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                  BEFORE (WEEK 1)
                </span>
              </div>

              {/* Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-2xl"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="w-10 h-10 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-sm -ml-4.5 mt-36 shadow-xl border-2 border-white">
                  ↔
                </div>
              </div>

              {/* Slider Input */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
              />
            </div>
            <p className="text-center text-xs text-slate-500 mt-3 italic">
              ✦ Slide left or right to compare week 1 vs week 8 results
            </p>
          </div>

          {/* 3 Result Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-4">
            <div className="bg-white/90 p-6 rounded-2xl border border-purple-100 text-center space-y-1 shadow-sm">
              <p className="text-4xl font-serif font-bold text-purple-700">-82%</p>
              <p className="text-xs font-bold text-slate-900">Acne & Blemish Reduction</p>
              <p className="text-[11px] text-slate-500">Visibly clearer skin texture</p>
            </div>

            <div className="bg-white/90 p-6 rounded-2xl border border-purple-100 text-center space-y-1 shadow-sm">
              <p className="text-4xl font-serif font-bold text-purple-700">+35%</p>
              <p className="text-xs font-bold text-slate-900">Barrier Smoothness</p>
              <p className="text-[11px] text-slate-500">Smoother, even skin tone</p>
            </div>

            <div className="bg-white/90 p-6 rounded-2xl border border-purple-100 text-center space-y-1 shadow-sm">
              <p className="text-4xl font-serif font-bold text-purple-700">+24%</p>
              <p className="text-xs font-bold text-slate-900">Radiance Score Boost</p>
              <p className="text-[11px] text-slate-500">Healthy natural glow</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE RIGHT FORMULA SECTION (No black, warm beige & purple) */}
      <section className="py-24 bg-[#f3e8e0] text-slate-900">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-xs font-bold tracking-widest text-purple-700 uppercase">02 — SCIENTIFIC FORMULATION</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
              The right formula, <em className="italic text-purple-700 font-serif">made for your skin.</em>
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              No generic multi-step complexity. Dermat formulates routines with precision active concentrations that protect your delicate barrier.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Tailored Formulations</h3>
                  <p className="text-xs text-slate-600">Customized ingredient pairings based on your unique skin assessment.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Science-Backed Actives</h3>
                  <p className="text-xs text-slate-600">Dermatologist-grade ingredients at clinical efficacy percentages.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Barrier Preservation</h3>
                  <p className="text-xs text-slate-600">Formulated with soothing ceramides to prevent irritation or peeling.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('login')}
              className="bg-purple-700 text-white font-bold text-xs px-7 py-3.5 rounded-full hover:bg-purple-800 transition inline-flex items-center gap-2 shadow-lg"
            >
              Get your custom formula <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white/90 p-8 rounded-3xl border border-purple-200/80 space-y-6 shadow-xl">
            <h3 className="font-serif text-2xl font-bold text-slate-900">Your Skin Profile Formula</h3>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-purple-900 text-sm">Niacinamide 10% + Zinc 1%</p>
                  <p className="text-slate-600 text-[11px]">Secretion control & pore refining</p>
                </div>
                <span className="bg-purple-200 text-purple-800 font-bold text-[10px] px-2.5 py-1 rounded-full">Active AM</span>
              </div>

              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-amber-900 text-sm">Ceramide 3-Step Complex</p>
                  <p className="text-slate-600 text-[11px]">Lipid barrier repair & hydration lock</p>
                </div>
                <span className="bg-amber-200 text-amber-800 font-bold text-[10px] px-2.5 py-1 rounded-full">Base PM</span>
              </div>

              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-emerald-900 text-sm">Gentle Lactic Acid Exfoliant</p>
                  <p className="text-slate-600 text-[11px]">Cell turnover without stripping</p>
                </div>
                <span className="bg-emerald-200 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-full">Weekly 2x</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: YOUR RITUAL, ANYWHERE (Beige background, purple theme, exact phone mockup) */}
      <section className="py-24 bg-[#f2e8e1]">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 max-w-lg">
            <p className="text-xs font-bold tracking-widest text-purple-700 uppercase">YOUR RITUAL, ANYWHERE</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
              Your glow, <em className="italic text-purple-700 font-serif">in your pocket.</em>
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Daily check-ins, soft reminders, and every little insight — right when you need it.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => onNavigate('login')}
                className="bg-slate-900 text-white font-bold text-xs px-6 py-3 rounded-2xl hover:bg-slate-800 transition flex items-center gap-3 shadow-lg"
              >
                <Apple className="w-5 h-5 text-white" />
                <div className="text-left">
                  <p className="text-[8px] text-slate-300 uppercase tracking-wider">Download on the</p>
                  <p className="text-xs font-bold">App Store</p>
                </div>
              </button>

              <button
                onClick={() => onNavigate('login')}
                className="bg-slate-900 text-white font-bold text-xs px-6 py-3 rounded-2xl hover:bg-slate-800 transition flex items-center gap-3 shadow-lg"
              >
                <Smartphone className="w-5 h-5 text-purple-300" />
                <div className="text-left">
                  <p className="text-[8px] text-slate-300 uppercase tracking-wider">GET IT ON</p>
                  <p className="text-xs font-bold">Google Play</p>
                </div>
              </button>
            </div>
          </div>

          {/* Smartphone Mockup */}
          <div className="flex justify-center">
            <div className="w-72 sm:w-80 bg-slate-900 rounded-[44px] p-3.5 shadow-2xl border-4 border-slate-800 text-white relative">
              {/* Phone Notch */}
              <div className="w-24 h-4 bg-slate-900 rounded-b-2xl mx-auto mb-3 border-b border-x border-slate-800/80 z-20 relative" />

              {/* Phone Screen Container - Rich Purple Screen */}
              <div className="bg-[#8257e5] rounded-[34px] p-6 text-white space-y-6 relative overflow-hidden shadow-inner">
                {/* Header Greeting */}
                <div>
                  <p className="text-[10px] text-purple-200 font-bold uppercase tracking-widest">GOOD MORNING, ANANYA</p>
                  <h3 className="text-xl font-serif font-bold text-white mt-0.5">
                    Your skin is <em className="italic font-serif">feeling good.</em>
                  </h3>
                </div>

                {/* Score Circle Ring */}
                <div className="my-6 flex flex-col items-center justify-center">
                  <div className="w-36 h-36 rounded-full border-4 border-white/90 flex flex-col items-center justify-center text-center p-3 shadow-lg bg-white/10 backdrop-blur-sm">
                    <span className="font-serif text-5xl font-bold text-white tracking-tight">86</span>
                    <span className="text-[9px] font-bold tracking-widest text-purple-100 uppercase mt-1">SKIN HEALTH SCORE</span>
                  </div>
                </div>

                {/* Bottom Ritual Card */}
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-white space-y-1 shadow-md">
                  <p className="text-xs font-bold">Today's ritual</p>
                  <p className="text-[11px] text-purple-100">Morning care · 3 steps</p>
                  <div className="flex gap-1.5 pt-2">
                    <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span className="w-2 h-2 rounded-full bg-white/50"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: FAQ SECTION */}
      <section className="py-24 bg-[#fcf8f5] border-t border-purple-100">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold tracking-widest text-purple-700 uppercase">04 — A FEW QUESTIONS</p>
            <h2 className="font-serif text-4xl font-bold text-slate-900">
              Good to <em className="italic text-purple-700 font-serif">know.</em>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-purple-100 overflow-hidden transition shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-serif text-lg font-bold text-slate-900 flex items-center justify-between gap-4"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-purple-700 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-purple-50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
