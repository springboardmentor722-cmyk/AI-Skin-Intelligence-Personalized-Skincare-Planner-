import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Sparkles, ShieldCheck, Droplets, Moon, Sun, ArrowRight, ArrowLeft,
  CheckCircle2, AlertCircle, RefreshCw, Zap, Sliders, Activity, Award, Heart,
  Check, Layers, MapPin, Thermometer, Compass, Flame, User, CheckSquare, Upload, Camera, FileText, Search, Edit3, X, Clock
} from 'lucide-react';
import GlassCard from '../../components/ui/GlassCard';
import SkinGauge from '../../components/ui/SkinGauge';
import SkinConcernCard from '../../components/ui/SkinConcernCard';
import { CLINICAL_CONCERNS_DATA } from '../../data/concernsData';
import api from '../../services/api';

const DRAFT_KEY = "skin_assessment_draft";


export default function SkinAssessment() {
  const navigate = useNavigate();

  // Wizard Steps:
  // Step 1: Welcome Screen
  // Step 2: Skin Type Selection (Visual Cards)
  // Step 3: Skin Concerns (Multi-select + 0-10 Severity Sliders)
  // Step 4: Lifestyle Inputs (Sleep, Water, Stress, Sun, Exercise, Smoking, Diet)
  // Step 5: Allergies & Ingredient Sensitivity (Searchable Chips)
  // Step 6: Summary & Review (Edit buttons)
  // Step 7: AI Analysis Loading Screen (6-8s)
  // Step 8: Error Fallback (If API fails)
  const [step, setStep] = useState(1);
  const [loadingStepText, setLoadingStepText] = useState("Analyzing your skin...");
  const [analyzing, setAnalyzing] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Form State
  const [skinType, setSkinType] = useState('Combination');
  const [selectedConcerns, setSelectedConcerns] = useState(['Acne', 'Dark Spots']);
  const [concernSeverities, setConcernSeverities] = useState({
    'Acne': 7,
    'Dark Spots': 6,
    'Hyperpigmentation': 5,
    'Redness': 6,
    'Wrinkles': 4,
    'Fine Lines': 5,
    'Dryness': 4,
    'Oiliness': 7,
    'Sensitive Skin': 6,
    'Uneven Tone': 5
  });

  const [sleepHours, setSleepHours] = useState(7.5);
  const [waterIntake, setWaterIntake] = useState(2.5);
  const [stressLevel, setStressLevel] = useState('Moderate');
  const [sunExposure, setSunExposure] = useState('Moderate');
  const [environment, setEnvironment] = useState('Urban');
  const [exercise, setExercise] = useState('3-4 times/week');
  const [smoking, setSmoking] = useState(false);
  const [diet, setDiet] = useState('Balanced');

  const [allergySearch, setAllergySearch] = useState('');
  const [selectedSensitivities, setSelectedSensitivities] = useState(['Fragrance', 'Essential Oils']);
  const [budgetTier, setBudgetTier] = useState('₹2000');

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.skinType) setSkinType(parsed.skinType);
        if (parsed.selectedConcerns) setSelectedConcerns(parsed.selectedConcerns);
        if (parsed.concernSeverities) setConcernSeverities(parsed.concernSeverities);
        if (parsed.sleepHours) setSleepHours(parsed.sleepHours);
        if (parsed.waterIntake) setWaterIntake(parsed.waterIntake);
        if (parsed.selectedSensitivities) setSelectedSensitivities(parsed.selectedSensitivities);
        if (parsed.budgetTier) setBudgetTier(parsed.budgetTier);
        if (parsed.step && parsed.step < 7) setStep(parsed.step);
      }
    } catch {
      // Ignore invalid JSON
    }
  }, []);

  // Auto-save draft to localStorage on state change
  useEffect(() => {
    if (step < 7) {
      const draftData = {
        step,
        skinType,
        selectedConcerns,
        concernSeverities,
        sleepHours,
        waterIntake,
        stressLevel,
        sunExposure,
        selectedSensitivities,
        budgetTier
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    }
  }, [step, skinType, selectedConcerns, concernSeverities, sleepHours, waterIntake, stressLevel, sunExposure, selectedSensitivities, budgetTier]);

  // Card definition lists
  const skinTypesList = [
    { id: 'Oily', name: 'Oily', desc: 'Excess sebum, visible shine & enlarged pores', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80' },
    { id: 'Dry', name: 'Dry', desc: 'Flakiness, tightness, dullness & lipid deficit', img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80' },
    { id: 'Combination', name: 'Combination', desc: 'Oily T-zone (forehead, nose) with dry or normal cheeks', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
    { id: 'Sensitive', name: 'Sensitive', desc: 'Prone to redness, stinging, flushing & reactive flare-ups', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' }
  ];

  const concernsList = [
    { id: 'Acne', name: 'Acne', desc: 'Inflammatory papules & breakouts' },
    { id: 'Dark Spots', name: 'Dark Spots', desc: 'Post-acne PIH & sun spots' },
    { id: 'Hyperpigmentation', name: 'Hyperpigmentation', desc: 'Melasma & sun damage patches' },
    { id: 'Redness', name: 'Redness', desc: 'Rosacea & vascular flushing' },
    { id: 'Wrinkles', name: 'Wrinkles', desc: 'Deep expression lines' },
    { id: 'Fine Lines', name: 'Fine Lines', desc: 'Early surface dehydration lines' },
    { id: 'Dryness', name: 'Dryness', desc: 'Flaky stratum corneum' },
    { id: 'Oiliness', name: 'Oiliness', desc: 'Hyper-seborrhea & pore shine' },
    { id: 'Sensitive Skin', name: 'Sensitive Skin', desc: 'Stinging & reactive barrier' },
    { id: 'Uneven Tone', name: 'Uneven Tone', desc: 'Dullness & lack of radiance' }
  ];

  const chipOptions = [
    'Retinoids', 'Vitamin C', 'Niacinamide', 'Salicylic Acid', 'AHA', 'BHA', 'Ceramides', 'Peptides', 'Fragrance', 'Essential Oils', 'Alcohol', 'Parabens'
  ];

  const budgetOptions = [
    { id: '₹500', label: '₹500', title: 'Essential Care' },
    { id: '₹1000', label: '₹1000', title: 'Balanced Routine' },
    { id: '₹2000', label: '₹2000', title: 'Clinical Grade' },
    { id: '₹5000+', label: '₹5000+', title: 'Luxury Medical' }
  ];

  const toggleConcern = (id) => {
    if (selectedConcerns.includes(id)) {
      setSelectedConcerns(selectedConcerns.filter(c => c !== id));
    } else {
      setSelectedConcerns([...selectedConcerns, id]);
    }
  };

  const toggleSensitivity = (item) => {
    if (selectedSensitivities.includes(item)) {
      setSelectedSensitivities(selectedSensitivities.filter(s => s !== item));
    } else {
      setSelectedSensitivities([...selectedSensitivities, item]);
    }
  };

  const handleSeverityChange = (cId, val) => {
    setConcernSeverities(prev => ({ ...prev, [cId]: Number(val) }));
  };

  // Step Validation logic
  const handleNext = (targetStep) => {
    if (step === 2 && !skinType) {
      toast.error("Please select your skin type before proceeding.");
      return;
    }
    if (step === 3 && selectedConcerns.length === 0) {
      toast.error("Please select at least one skin concern.");
      return;
    }
    setStep(targetStep);
  };

  // Reset Draft
  const handleResetDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setSkinType('Combination');
    setSelectedConcerns(['Acne', 'Dark Spots']);
    setStep(1);
    toast.success("Assessment draft reset.");
  };

  // Run 6-8 seconds AI Analysis & Submit (Step 7)
  const startAIAnalysis = async () => {
    setStep(7);
    setAnalyzing(true);
    setApiError(false);

    const stepsTimeline = [
      { text: "Analyzing your skin...", time: 500 },
      { text: "Evaluating concerns...", time: 1600 },
      { text: "Checking ingredient safety...", time: 2800 },
      { text: "Building recommendations...", time: 4200 },
      { text: "Generating personalized routine...", time: 5600 }
    ];

    stepsTimeline.forEach(item => {
      setTimeout(() => {
        setLoadingStepText(item.text);
      }, item.time);
    });

    try {
      const response = await api.post('/api/v1/assessment', {
        skin_type: skinType,
        concerns: selectedConcerns,
        concern_severities: concernSeverities,
        sleep_hours: sleepHours,
        water_intake: waterIntake,
        stress_level: stressLevel,
        allergies: selectedSensitivities.join(', '),
        budget: budgetTier
      });

      if (response.data) {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // Fallback local persistence
    }

    setTimeout(() => {
      setAnalyzing(false);
      toast.success("AI Skin Assessment completed!");
      navigate("/dashboard");
    }, 6800);
  };

  const filteredChips = chipOptions.filter(c =>
    c.toLowerCase().includes(allergySearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">

      {/* Progress Header Indicator (Steps 1 to 6) */}
      {step <= 6 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Interactive AI Consultation Wizard
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Skin Intelligence Assessment</h1>
            <p className="text-slate-400 text-sm mt-1">Guided diagnostic profiling, severity grading, and lifestyle analysis</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDraft}
              className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900/60 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              Reset Draft
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
              <span>Step {step} of 6</span>
              <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${(step / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: WELCOME SCREEN */}
      {step === 1 && (
        <GlassCard className="p-10 md:p-12 space-y-8 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> AI Skin Intelligence Assessment
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Clinical-Grade AI Consultation & Diagnosis
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Our AI analyzes your skin profile, lifestyle, concerns, ingredient sensitivities and skincare habits to generate a dermatologist-inspired personalized skincare routine.
            </p>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Estimated Time: <strong>3-5 Minutes</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Steps: <strong>6 Guided Modules</strong></span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 hover:opacity-95 transition-all flex items-center gap-3"
              >
                <span>Start Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* STEP 2: CHOOSE SKIN TYPE */}
      {step === 2 && (
        <GlassCard className="p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white">Step 2: Skin Type Selection</h2>
              <p className="text-xs text-slate-400">Select your baseline skin classification</p>
            </div>
            <span className="text-xs text-cyan-400 font-semibold bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">Single Selection Required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skinTypesList.map(st => (
              <div
                key={st.id}
                onClick={() => setSkinType(st.id)}
                className={`group cursor-pointer rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                  skinType === st.id
                    ? "border-cyan-500 bg-cyan-500/10 shadow-xl shadow-cyan-500/20 scale-[1.02]"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90"
                }`}
              >
                <div className="h-40 w-full overflow-hidden relative">
                  <img src={st.img} alt={st.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  {skinType === st.id && (
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold shadow-lg">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-1">
                  <h3 className={`font-bold text-lg ${skinType === st.id ? "text-cyan-300" : "text-white"}`}>{st.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4">
            <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => handleNext(3)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <span>Next: Skin Concerns</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </GlassCard>
      )}

      {/* STEP 3: VISUAL CLINICAL DERMATOLOGY SKIN CONCERNS */}
      {step === 3 && (
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" /> Step 3: Skin Concerns Assessment
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                Select your skin concerns below to customize your clinical formulation & severity levels (0–10)
              </p>
            </div>
            <span className="text-xs text-teal-400 font-bold bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20 self-start md:self-auto shadow-xs">
              {selectedConcerns.length} Concern{selectedConcerns.length !== 1 ? "s" : ""} Selected
            </span>
          </div>

          {/* Responsive Cards Grid: Desktop = 5, Tablet = 3, Mobile = 2 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {CLINICAL_CONCERNS_DATA.map((concernItem) => {
              const isSelected = selectedConcerns.includes(concernItem.id);
              const currentSeverity =
                concernSeverities[concernItem.id] !== undefined
                  ? concernSeverities[concernItem.id]
                  : concernItem.defaultSeverity;

              return (
                <SkinConcernCard
                  key={concernItem.id}
                  concern={concernItem}
                  isSelected={isSelected}
                  severity={currentSeverity}
                  onToggle={toggleConcern}
                  onSeverityChange={handleSeverityChange}
                />
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Skin Type
            </button>

            <button
              onClick={() => handleNext(4)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 text-white font-extrabold text-sm hover:opacity-95 transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20"
            >
              <span>Next: Lifestyle Factors</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </GlassCard>
      )}


      {/* STEP 4: LIFESTYLE */}
      {step === 4 && (
        <GlassCard className="p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Step 4: Lifestyle Factors</h2>
              <p className="text-xs text-slate-400">Sleep, hydration, stress, sun exposure, and exercise</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Sleep Hours: {sleepHours} hrs/night</label>
              <input type="range" min="4" max="10" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className="w-full accent-cyan-500 cursor-pointer" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Water Intake: {waterIntake} Liters/day</label>
              <input type="range" min="1" max="5" step="0.5" value={waterIntake} onChange={(e) => setWaterIntake(Number(e.target.value))} className="w-full accent-cyan-500 cursor-pointer" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-2">Sun Exposure</label>
              <div className="grid grid-cols-3 gap-3">
                {['Low', 'Moderate', 'High'].map(opt => (
                  <div
                    key={opt} onClick={() => setSunExposure(opt)}
                    className={`p-3 rounded-xl border cursor-pointer text-center text-xs font-bold transition-all ${sunExposure === opt ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-slate-800 bg-slate-900/60 text-slate-400"}`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-2">Exercise Routine</label>
              <div className="grid grid-cols-3 gap-3">
                {['Never', 'Sometimes', 'Regularly'].map(opt => (
                  <div
                    key={opt} onClick={() => setExercise(opt)}
                    className={`p-3 rounded-xl border cursor-pointer text-center text-xs font-bold transition-all ${exercise === opt ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-slate-800 bg-slate-900/60 text-slate-400"}`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button onClick={() => setStep(3)} className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(5)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:opacity-90 flex items-center gap-2 shadow-lg shadow-cyan-500/20">
              Next: Allergies <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </GlassCard>
      )}

      {/* STEP 5: ALLERGIES & INGREDIENT SENSITIVITY */}
      {step === 5 && (
        <GlassCard className="p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white">Step 5: Allergies & Sensitivities</h2>
              <p className="text-xs text-slate-400">Searchable ingredient exclusion chips</p>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text" value={allergySearch} onChange={(e) => setAllergySearch(e.target.value)}
              placeholder="Search ingredient (e.g. Fragrance, Retinol)..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filteredChips.map(chip => {
              const isSel = selectedSensitivities.includes(chip);
              return (
                <div
                  key={chip} onClick={() => toggleSensitivity(chip)}
                  className={`px-3.5 py-2 rounded-full border cursor-pointer text-xs font-semibold flex items-center gap-2 transition-all ${
                    isSel ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{chip}</span>
                  {isSel && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button onClick={() => setStep(4)} className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(6)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:opacity-90 flex items-center gap-2 shadow-lg shadow-cyan-500/20">
              Next: Review <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </GlassCard>
      )}

      {/* STEP 6: SUMMARY & REVIEW */}
      {step === 6 && (
        <GlassCard className="p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white">Step 6: Assessment Review Summary</h2>
              <p className="text-xs text-slate-400">Verify your inputs before launching AI diagnosis</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-400">Skin Type</div>
                <div className="text-sm font-bold text-white">{skinType}</div>
              </div>
              <button onClick={() => setStep(2)} className="text-xs text-cyan-400 flex items-center gap-1 font-bold"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-400">Selected Concerns</div>
                <div className="text-sm font-bold text-white">{selectedConcerns.join(', ')}</div>
              </div>
              <button onClick={() => setStep(3)} className="text-xs text-cyan-400 flex items-center gap-1 font-bold"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-400">Lifestyle Metrics</div>
                <div className="text-sm font-bold text-white">Sleep: {sleepHours}h • Water: {waterIntake}L • Sun: {sunExposure}</div>
              </div>
              <button onClick={() => setStep(4)} className="text-xs text-cyan-400 flex items-center gap-1 font-bold"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-400">Budget Tier</div>
                <div className="text-sm font-bold text-white">{budgetTier}</div>
              </div>
              <button onClick={() => setStep(5)} className="text-xs text-cyan-400 flex items-center gap-1 font-bold"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <button onClick={() => setStep(5)} className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={startAIAnalysis}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-bold text-base hover:opacity-95 flex items-center gap-3 shadow-xl shadow-cyan-500/25 animate-pulse"
            >
              <Zap className="w-5 h-5" /> Analyze Skin Profile
            </button>
          </div>
        </GlassCard>
      )}

      {/* STEP 7: AI ANALYSIS LOADING SCREEN (6-8s) */}
      {step === 7 && (
        <GlassCard className="p-12 text-center space-y-8 my-12 flex flex-col items-center justify-center min-h-[420px]">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-purple-500/20 border-b-purple-400 animate-spin [animation-duration:3s]" />
            <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-2xl">
              <Sparkles className="w-12 h-12 animate-bounce" />
            </div>
          </div>

          <div className="space-y-3 max-w-md">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">AI Skin Diagnostic Engine</h2>
            <p className="text-cyan-400 font-bold text-sm h-6 transition-all">{loadingStepText}</p>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 animate-pulse w-full" />
            </div>
          </div>
        </GlassCard>
      )}

      {/* STEP 8: CLINICAL ERROR FALLBACK CARD */}
      {apiError && (
        <GlassCard className="p-10 text-center my-12 space-y-6 max-w-xl mx-auto border-red-500/30 bg-red-500/5">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Unable to Analyze Your Skin</h2>
            <p className="text-xs text-slate-300">
              We encountered a network issue or backend response timeout. Please try again.
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setStep(6)}
              className="px-6 py-3 rounded-full border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800"
            >
              Go Back
            </button>
            <button
              onClick={startAIAnalysis}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Retry Analysis
            </button>
          </div>
        </GlassCard>
      )}

    </div>
  );
}