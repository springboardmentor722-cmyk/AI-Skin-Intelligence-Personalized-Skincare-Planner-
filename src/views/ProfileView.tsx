import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  getCurrentUser, 
  getLatestAssessment, 
  AssessmentRecord, 
  getLifestyleTracking, 
  saveLifestyleTracking, 
  LifestyleTrackingData 
} from '../services/db';
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Camera, Save, Activity, Moon, Droplets, Sun, Check } from 'lucide-react';

interface ProfileViewProps {
  user: UserProfile | null;
  onNavigate: (view: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user: initialUser, onNavigate }) => {
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);
  const [lifestyle, setLifestyle] = useState<LifestyleTrackingData>({
    dailySteps: 7200,
    sleepHours: 7.5,
    waterIntakeLiters: 1.8,
    stressLevel: 'Moderate',
    sunExposure: 'Moderate',
    routineAdherence: 88,
  });
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const loadedUser = getCurrentUser();
    if (loadedUser) setUser(loadedUser);
    const loadedAssessment = getLatestAssessment();
    if (loadedAssessment) setAssessment(loadedAssessment);
    const loadedLifestyle = getLifestyleTracking();
    if (loadedLifestyle) setLifestyle(loadedLifestyle);
  }, []);

  const handleSaveLifestyle = () => {
    saveLifestyleTracking(lifestyle);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const primaryConcernsList = assessment?.topPrioritizedConcerns?.map(c => c.name).join(', ') 
    || user?.primaryConcern 
    || 'Acne, Hyperpigmentation, Uneven Tone';

  const details = [
    ['Skin Type', assessment?.skinType || user?.skinType || 'Combination'],
    ['Overall Health Score', `${user?.skinHealthScore || assessment?.overallScore || 78} / 100`],
    ['Primary Concerns', primaryConcernsList],
    ['Confidence Score', assessment?.confidenceScore || '98% High Accuracy'],
    ['Age Group', '22 – 30 years'],
    ['Sensitivities', 'Fragrance, Essential Oils'],
    ['Environment', 'Moderate Urban Pollution'],
  ];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {savedToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-700 flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Lifestyle & Tracking metrics successfully saved!</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">02 — KNOW YOUR SKIN</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mt-1">
            Skin Profile <em className="italic text-purple-600 font-serif">Management</em>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-lg">
            Your live skin profile, populated and continuously updated from real AI skin assessments.
          </p>
        </div>

        <button
          onClick={() => onNavigate('assessment')}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-3 rounded-2xl transition shadow-md shadow-purple-600/20 flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>New AI Skin Scan</span>
        </button>
      </div>

      {/* Latest AI Assessment Banner Card */}
      {assessment && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-purple-800/50 flex flex-col sm:flex-row items-center gap-6">
          {assessment.photoPreview && (
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-purple-400 shrink-0 shadow-lg">
              <img src={assessment.photoPreview} alt="Latest Scan" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Synced From AI Skin Scan</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-white">
              {assessment.skinType} Skin • {assessment.overallScore}/100 Health Score
            </h2>
            <p className="text-xs text-purple-200 line-clamp-2">
              "{assessment.notes || 'Balanced skin condition with targeted recommendations.'}"
            </p>
          </div>
          <button
            onClick={() => onNavigate('assessment')}
            className="bg-white/10 hover:bg-white/20 text-white border border-purple-300/30 text-xs font-bold px-4 py-2.5 rounded-xl transition shrink-0 flex items-center gap-1.5"
          >
            <span>View Full Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="font-serif text-xl font-bold text-slate-900">Personal Skin Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {details.map(([label, val]) => (
              <div key={label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{label}</span>
                <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{val}</span>
              </div>
            ))}
          </div>
          <div className="p-3.5 bg-purple-50 rounded-xl text-xs text-purple-900 border border-purple-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Your skin profile helps <strong>Soluna AI</strong> personalize your daily routine.</span>
          </div>
        </div>

        {/* Editable Lifestyle & Daily Tracking */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Lifestyle & Daily Tracking</h2>
              <p className="text-xs text-slate-500">Edit your daily habits to refine your AI skincare calculations.</p>
            </div>
            <button
              onClick={handleSaveLifestyle}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>

          <div className="space-y-4 text-xs pt-1">
            {/* Daily Steps */}
            <div className="p-3.5 border border-slate-200/80 rounded-xl bg-slate-50/50 space-y-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Activity className="w-4 h-4 text-purple-600" /> Daily Steps
                </span>
                <span className="text-purple-600 font-bold">{lifestyle.dailySteps.toLocaleString()} steps</span>
              </div>
              <input
                type="range"
                min="1000"
                max="20000"
                step="500"
                value={lifestyle.dailySteps}
                onChange={(e) => setLifestyle({ ...lifestyle, dailySteps: Number(e.target.value) })}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Sleep Quality */}
            <div className="p-3.5 border border-slate-200/80 rounded-xl bg-slate-50/50 space-y-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Moon className="w-4 h-4 text-indigo-600" /> Sleep Duration
                </span>
                <span className="text-indigo-600 font-bold">{lifestyle.sleepHours} hours / night</span>
              </div>
              <input
                type="range"
                min="3"
                max="12"
                step="0.5"
                value={lifestyle.sleepHours}
                onChange={(e) => setLifestyle({ ...lifestyle, sleepHours: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Water Intake */}
            <div className="p-3.5 border border-slate-200/80 rounded-xl bg-slate-50/50 space-y-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Droplets className="w-4 h-4 text-blue-600" /> Water Intake
                </span>
                <span className="text-blue-600 font-bold">{lifestyle.waterIntakeLiters} Liters</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={lifestyle.waterIntakeLiters}
                onChange={(e) => setLifestyle({ ...lifestyle, waterIntakeLiters: Number(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Stress Level & Sun Exposure dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 border border-slate-200/80 rounded-xl bg-slate-50/50 space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Stress Level</label>
                <select
                  value={lifestyle.stressLevel}
                  onChange={(e) => setLifestyle({ ...lifestyle, stressLevel: e.target.value as any })}
                  className="w-full p-2 bg-white rounded-lg border border-slate-200 font-bold text-slate-800 outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="p-3 border border-slate-200/80 rounded-xl bg-slate-50/50 space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Sun Exposure</label>
                <select
                  value={lifestyle.sunExposure}
                  onChange={(e) => setLifestyle({ ...lifestyle, sunExposure: e.target.value as any })}
                  className="w-full p-2 bg-white rounded-lg border border-slate-200 font-bold text-slate-800 outline-none"
                >
                  <option value="Minimal">Minimal</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Routine Adherence */}
            <div className="p-3.5 border border-slate-200/80 rounded-xl bg-slate-50/50 space-y-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-slate-700">Routine Consistency</span>
                <span className="text-emerald-600 font-bold">{lifestyle.routineAdherence}% Adherence</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={lifestyle.routineAdherence}
                onChange={(e) => setLifestyle({ ...lifestyle, routineAdherence: Number(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

