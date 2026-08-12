import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Search, 
  Sliders, 
  BarChart2, 
  ShieldAlert, 
  Zap,
  SlidersHorizontal,
  ChevronDown,
  CloudUpload,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import sampleSkinPhoto from '../assets/images/before_skin_week1_1785496288382.jpg';
import { 
  getLatestAssessment, 
  saveAssessmentToProfileAndProgress, 
  AssessmentRecord 
} from '../services/db';

interface AssessmentViewProps {
  onNavigate: (view: string) => void;
}

interface ConcernItem {
  id: string;
  icon?: string;
  name: string;
  intensity: number;
  severity: 'Mild' | 'Moderate' | 'High';
}

interface PrioritizedConcern {
  priority: number;
  name: string;
  severity: string;
  recommendation: string;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({ onNavigate }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(true);
  const [faceDetectionMessage, setFaceDetectionMessage] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [savedToast, setSavedToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Editable Assessment Metrics
  const [overallScore, setOverallScore] = useState(78);
  const [hydration, setHydration] = useState(82);
  const [texture, setTexture] = useState(74);
  const [evenTone, setEvenTone] = useState(68);
  const [elasticity, setElasticity] = useState(76);
  const [oilBalance, setOilBalance] = useState(71);

  const [skinType, setSkinType] = useState('Combination');
  const [notes, setNotes] = useState('Balanced cheeks with a slightly oilier T-zone. Mild dehydration is visible.');
  const [confidenceScore, setConfidenceScore] = useState('98% High Accuracy');

  // Common Skin Concerns (10 core common concerns)
  const [concerns, setConcerns] = useState<ConcernItem[]>([
    { id: '1', icon: '✿', name: 'Acne', intensity: 12, severity: 'Mild' },
    { id: '2', icon: '✦', name: 'Dark Spots', intensity: 28, severity: 'Mild' },
    { id: '3', icon: '◉', name: 'Oily Skin', intensity: 45, severity: 'Moderate' },
    { id: '4', icon: '〰', name: 'Wrinkles', intensity: 10, severity: 'Mild' },
    { id: '5', icon: '⊙', name: 'Redness', intensity: 18, severity: 'Mild' },
    { id: '6', icon: '☼', name: 'Hyperpigmentation', intensity: 25, severity: 'Mild' },
    { id: '7', icon: '✧', name: 'Dry Skin', intensity: 14, severity: 'Mild' },
    { id: '8', icon: '☥', name: 'Sensitive Skin', intensity: 15, severity: 'Mild' },
    { id: '9', icon: '☉', name: 'Fine Lines', intensity: 12, severity: 'Mild' },
    { id: '10', icon: '✶', name: 'Uneven Skin Tone', intensity: 22, severity: 'Mild' },
  ]);

  // Top Prioritized Concerns
  const [topPrioritizedConcerns, setTopPrioritizedConcerns] = useState<PrioritizedConcern[]>([
    { priority: 1, name: 'Hyperpigmentation', severity: 'Moderate', recommendation: 'Targeted with Vitamin C & Niacinamide daily.' },
    { priority: 2, name: 'Uneven Skin Tone', severity: 'Mild', recommendation: 'Supported with gentle lactic exfoliation.' },
    { priority: 3, name: 'Fine Lines', severity: 'Mild', recommendation: 'Hydrated with peptides & ceramides.' }
  ]);

  // Restore saved assessment on mount so navigation does not reset analysis
  useEffect(() => {
    const saved = getLatestAssessment();
    if (saved) {
      if (typeof saved.overallScore === 'number') setOverallScore(saved.overallScore);
      if (typeof saved.hydration === 'number') setHydration(saved.hydration);
      if (typeof saved.texture === 'number') setTexture(saved.texture);
      if (typeof saved.evenTone === 'number') setEvenTone(saved.evenTone);
      if (typeof saved.elasticity === 'number') setElasticity(saved.elasticity);
      if (typeof saved.oilBalance === 'number') setOilBalance(saved.oilBalance);
      if (saved.skinType) setSkinType(saved.skinType);
      if (saved.notes) setNotes(saved.notes);
      if (saved.confidenceScore) setConfidenceScore(saved.confidenceScore);
      if (saved.photoPreview) setPhotoPreview(saved.photoPreview);
      if (Array.isArray(saved.concerns) && saved.concerns.length > 0) setConcerns(saved.concerns);
      if (Array.isArray(saved.topPrioritizedConcerns) && saved.topPrioritizedConcerns.length > 0) {
        setTopPrioritizedConcerns(saved.topPrioritizedConcerns);
      }
      setIsFaceDetected(saved.isFaceDetected ?? true);
      setCompleted(saved.completed ?? true);
    }
  }, []);

  const compressAndResizeImage = (dataUrl: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const analyzePhotoWithAi = async (dataUrl: string) => {
    setAnalyzing(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/gemini/analyze-skin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl })
      });
      if (!response.ok) {
        throw new Error(`Server response error (${response.status})`);
      }
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        const d = result.data;
        if (d.isFaceDetected === false) {
          setIsFaceDetected(false);
          setFaceDetectionMessage(d.faceDetectionMessage || 'No human face detected in this photo. Please upload a clear photo of your face.');
          setCompleted(false);
        } else {
          setIsFaceDetected(true);
          setFaceDetectionMessage(d.faceDetectionMessage || '');
          const newScore = typeof d.overallScore === 'number' ? d.overallScore : overallScore;
          const newHydration = typeof d.hydration === 'number' ? d.hydration : hydration;
          const newTexture = typeof d.texture === 'number' ? d.texture : texture;
          const newEvenTone = typeof d.evenTone === 'number' ? d.evenTone : evenTone;
          const newElasticity = typeof d.elasticity === 'number' ? d.elasticity : elasticity;
          const newOilBalance = typeof d.oilBalance === 'number' ? d.oilBalance : oilBalance;
          const newSkinType = d.skinType || skinType;
          const newNotes = d.notes || notes;
          const newConfidence = d.confidenceScore || confidenceScore;
          const newConcerns = (Array.isArray(d.concerns) && d.concerns.length > 0) ? d.concerns : concerns;
          const newPrioritized = (Array.isArray(d.topPrioritizedConcerns) && d.topPrioritizedConcerns.length > 0) ? d.topPrioritizedConcerns : topPrioritizedConcerns;

          if (typeof d.overallScore === 'number') setOverallScore(d.overallScore);
          if (typeof d.hydration === 'number') setHydration(d.hydration);
          if (typeof d.texture === 'number') setTexture(d.texture);
          if (typeof d.evenTone === 'number') setEvenTone(d.evenTone);
          if (typeof d.elasticity === 'number') setElasticity(d.elasticity);
          if (typeof d.oilBalance === 'number') setOilBalance(d.oilBalance);
          if (d.skinType) setSkinType(d.skinType);
          if (d.notes) setNotes(d.notes);
          if (d.confidenceScore) setConfidenceScore(d.confidenceScore);
          if (Array.isArray(d.concerns) && d.concerns.length > 0) {
            setConcerns(d.concerns);
          }
          if (Array.isArray(d.topPrioritizedConcerns) && d.topPrioritizedConcerns.length > 0) {
            setTopPrioritizedConcerns(d.topPrioritizedConcerns);
          }
          setCompleted(true);

          // Auto-save to localStorage (Profile, Score, Progress)
          saveAssessmentToProfileAndProgress({
            overallScore: newScore,
            hydration: newHydration,
            texture: newTexture,
            evenTone: newEvenTone,
            elasticity: newElasticity,
            oilBalance: newOilBalance,
            skinType: newSkinType,
            notes: newNotes,
            confidenceScore: newConfidence,
            concerns: newConcerns,
            topPrioritizedConcerns: newPrioritized,
            photoPreview: dataUrl,
            isFaceDetected: true,
            completed: true
          });

          setSavedToast(true);
          setTimeout(() => setSavedToast(false), 4000);
        }
      } else {
        throw new Error(result.message || 'Analysis could not be completed.');
      }
    } catch (err: any) {
      console.error('AI skin analysis request failed:', err);
      setErrorMessage(err.message || 'Failed to communicate with AI server. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnalyzing(true);
      setErrorMessage('');
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const rawDataUrl = evt.target?.result as string;
        if (rawDataUrl) {
          try {
            const compressed = await compressAndResizeImage(rawDataUrl);
            setPhotoPreview(compressed);
            await analyzePhotoWithAi(compressed);
          } catch (err) {
            console.error('Error compressing image:', err);
            setPhotoPreview(rawDataUrl);
            await analyzePhotoWithAi(rawDataUrl);
          }
        } else {
          setAnalyzing(false);
        }
      };
      reader.onerror = () => {
        setAnalyzing(false);
        setErrorMessage('Could not read file. Please try another image.');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    let imgToAnalyze = photoPreview;
    if (!imgToAnalyze) {
      imgToAnalyze = sampleSkinPhoto;
      setPhotoPreview(sampleSkinPhoto);
    }
    await analyzePhotoWithAi(imgToAnalyze);
  };

  const handleSave = () => {
    saveAssessmentToProfileAndProgress({
      overallScore,
      hydration,
      texture,
      evenTone,
      elasticity,
      oilBalance,
      skinType,
      notes,
      confidenceScore,
      concerns,
      topPrioritizedConcerns,
      photoPreview,
      isFaceDetected: true,
      completed: true
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 4000);
  };

  const updateConcern = (id: string, updates: Partial<ConcernItem>) => {
    setConcerns(concerns.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Assessment report saved successfully to your skin workspace!
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">
            03 — ASSESS
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mt-1">
            Skin Assessment <em className="italic text-purple-600 font-serif">Engine</em>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {completed
              ? "Our AI technology analyzes your skin from multiple data points to deliver accurate insights and personalized recommendations."
              : "Upload a clear photo first. Dermat will analyze your skin and unlock an editable report for you to review."}
          </p>
        </div>

        {/* Top Right Status Badge */}
        {completed ? (
          <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-4 px-5 shadow-sm flex items-center gap-4 shrink-0">
            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-purple-600 fill-purple-600/30" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                AI Analysis Complete
              </p>
              <p className="text-[11px] text-slate-500">Assessment based on uploaded photograph features.</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-purple-600 text-purple-700 font-bold flex items-center justify-center text-xs shadow-sm ml-2 bg-white">
              {overallScore}%
            </div>
          </div>
        ) : (
          <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-4 px-5 shadow-sm flex items-center gap-4 shrink-0">
            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Ready for analysis
              </p>
              <p className="text-[11px] text-slate-500">Upload a photo to begin your personal skin assessment.</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-purple-300 text-purple-600 font-bold flex items-center justify-center text-sm shadow-sm ml-2 bg-white">
              —
            </div>
          </div>
        )}
      </div>

      {/* Upload Zone Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <h2 className="font-serif text-xl font-bold text-slate-900">Upload a skin photo</h2>
            <p className="text-xs text-slate-500">
              {completed
                ? "Add a clear, makeup-free, front-facing photo in natural light. Changing the photo will instantly re-analyze your skin."
                : "Add a clear, makeup-free, front-facing photo in natural light."}
            </p>
          </div>

          {/* Right Side: Upload Box or Analyzed Photo Thumbnail */}
          <div className="flex items-center gap-4">
            {completed && (photoPreview || sampleSkinPhoto) ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-purple-300 bg-purple-50 p-1 shadow-sm flex items-center gap-3">
                <img 
                  src={photoPreview || sampleSkinPhoto} 
                  alt="Uploaded skin photo" 
                  className="w-52 sm:w-64 h-24 object-cover rounded-xl"
                />
                <label className="text-[10px] font-bold text-purple-700 bg-white hover:bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg cursor-pointer transition shrink-0 mr-1 flex items-center gap-1.5 shadow-xs">
                  <RefreshCw className="w-3 h-3 text-purple-600" />
                  <span>Change photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <label className="border-2 border-dashed border-purple-200 hover:border-purple-500 bg-purple-50/40 rounded-2xl px-6 py-4 flex items-center gap-3 cursor-pointer transition text-left">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <CloudUpload className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Choose a photo</span>
                    <span className="text-[9px] text-slate-400">JPG, PNG or HEIC</span>
                  </div>
                </label>

                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-6 py-4 rounded-2xl transition shadow-md shadow-purple-600/20 disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {analyzing ? 'Analyzing skin...' : 'Analyze my skin →'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI Processing Banner when analyzing */}
        {analyzing && (
          <div className="p-4 rounded-2xl bg-purple-900 text-white flex items-center gap-4 animate-pulse shadow-md">
            <Sparkles className="w-6 h-6 text-purple-300 animate-spin shrink-0" />
            <div>
              <p className="text-xs font-bold text-purple-100">AI Skin Intelligence Engine is analyzing photograph...</p>
              <p className="text-[11px] text-purple-300">Detecting human face features, dermal texture, hydration levels, pore distribution & pigmentation in real time.</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && !analyzing && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs font-semibold">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-xs font-bold text-amber-800 hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Invalid Face Photo Alert */}
        {!isFaceDetected && !analyzing && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-900">No Human Face Detected</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  {faceDetectionMessage || 'Please upload a clear, well-lit, front-facing photograph of a person to perform AI skin analysis.'}
                </p>
              </div>
            </div>
            <label className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 flex items-center gap-1.5 shadow-sm">
              <CloudUpload className="w-3.5 h-3.5" />
              <span>Upload Face Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}

        {/* 5 Engine Feature Pipeline Pills */}
        <div className="pt-6 border-t border-slate-100">
          <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase mb-3">OUR ASSESSMENT ENGINE</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Skin concern identification</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Detects visible concerns</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Skin health evaluation</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Overall health assessment</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Skin condition scoring</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Scientific scoring 0–100</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Concern prioritization</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Smart priority ranking</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Risk factor analysis</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Internal & external risk detection</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Initial Placeholder State */}
      {!completed && !analyzing && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center space-y-4 shadow-sm my-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-purple-600 fill-purple-600/30" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-slate-900">Your editable results will appear here</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            After AI photo analysis, you can adjust every score, concern name and severity before saving.
          </p>
        </div>
      )}

      {/* Output Report Section */}
      {completed && (
        <div className="space-y-8">
          {/* Main Overview Card */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">AI ANALYSIS COMPLETE</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Editable Report
                  </span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">Your Skin Health Overview</h2>
                <p className="text-xs text-slate-500">All values below are editable — review them before saving.</p>
              </div>

              {/* Score Badge */}
              <div className="bg-purple-50 p-3 px-5 rounded-2xl border border-purple-100 flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-purple-600 uppercase">Skin Health Score</p>
                  <p className="font-serif text-2xl font-bold text-purple-700">{overallScore} <span className="text-xs font-normal text-slate-500">/100</span></p>
                </div>
              </div>
            </div>

            {/* Grid 1: Sliders & Photo Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Interactive Health Sliders */}
              <div className="space-y-4">
                <h3 className="font-serif text-base font-bold text-slate-900">Skin Health Scores</h3>

                <div className="space-y-3.5 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Hydration Level</span>
                      <span className="font-bold text-purple-600">{hydration}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={hydration}
                      onChange={(e) => setHydration(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Texture Smoothness</span>
                      <span className="font-bold text-purple-600">{texture}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={texture}
                      onChange={(e) => setTexture(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Even Tone</span>
                      <span className="font-bold text-purple-600">{evenTone}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={evenTone}
                      onChange={(e) => setEvenTone(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Elasticity</span>
                      <span className="font-bold text-purple-600">{elasticity}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={elasticity}
                      onChange={(e) => setElasticity(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Oil Balance</span>
                      <span className="font-bold text-purple-600">{oilBalance}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={oilBalance}
                      onChange={(e) => setOilBalance(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Photo Details */}
              <div className="space-y-4">
                <h3 className="font-serif text-base font-bold text-slate-900">Photo-based Details</h3>

                <div className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Likely Skin Type</label>
                    <select
                      value={skinType}
                      onChange={(e) => setSkinType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                    >
                      <option value="Combination">Combination</option>
                      <option value="Oily">Oily</option>
                      <option value="Dry">Dry</option>
                      <option value="Sensitive">Sensitive</option>
                      <option value="Normal">Normal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assessment Note</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-purple-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80 text-xs">
                    <span className="text-slate-600 font-semibold">Analysis Confidence:</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      {confidenceScore}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Common Skin Concerns Table */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Common Skin Concerns</h2>
              <p className="text-xs text-slate-500">Change the name, intensity and severity of every detected concern.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {concerns.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1">
                      <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {item.icon || '✦'}
                      </span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateConcern(item.id, { name: e.target.value })}
                        className="font-bold text-xs text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-purple-600 outline-none w-full"
                      />
                    </div>
                    <span className="text-xs font-bold text-purple-600 shrink-0">{item.intensity}%</span>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={item.intensity}
                          onChange={(e) => updateConcern(item.id, { intensity: Number(e.target.value) })}
                          className="w-full accent-purple-600 cursor-pointer"
                        />
                      </div>

                      <select
                        value={item.severity}
                        onChange={(e) => updateConcern(item.id, { severity: e.target.value as any })}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 outline-none"
                      >
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Prioritized Concerns */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Top Prioritized Concerns</h2>
              <p className="text-xs text-slate-500">Ranked by severity to guide your custom routine formulation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {topPrioritizedConcerns.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                      {item.priority || idx + 1}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.severity === 'High' ? 'bg-red-100 text-red-800' : item.severity === 'Moderate' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-600">{item.recommendation}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">✦ Your edits will be used to personalize routines and product recommendations.</p>
              <button
                onClick={handleSave}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-7 py-3 rounded-xl transition shadow-md shadow-purple-600/20"
              >
                Save profile changes →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

