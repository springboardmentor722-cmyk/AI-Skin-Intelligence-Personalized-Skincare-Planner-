import { Calendar, ChevronLeft, ChevronRight, Mars, Venus, User, EyeOff, Droplet, Waves, Sun, Sparkle, Leaf, ShieldCheck } from "lucide-react";
import StepIndicator from "./StepIndicator";

const GENDERS = [
  { value: "male", label: "Male", icon: Mars },
  { value: "female", label: "Female", icon: Venus },
  { value: "other", label: "Other", icon: User },
  { value: "prefer_not_to_say", label: "Prefer not to say", icon: EyeOff },
];

const SKIN_TYPES = [
  { value: "normal", label: "Normal", icon: Droplet },
  { value: "dry", label: "Dry", icon: Waves },
  { value: "oily", label: "Oily", icon: Sun },
  { value: "combination", label: "Combination", icon: Sparkle },
  { value: "sensitive", label: "Sensitive", icon: Leaf },
];

export default function ProfileStep({ form, setForm, onNext, onBack, onSkip }) {
  const adjustAge = (delta) => {
    const current = Number(form.age) || 0;
    const next = Math.min(120, Math.max(1, current + delta));
    setForm({ ...form, age: next });
  };

  return (
    <div>
      <div className="mb-8">
        <StepIndicator currentStep={1} />
      </div>

      <h2 className="text-xl sm:text-2xl font-display font-semibold text-gray-800 mb-1">
        Let's understand your skin
      </h2>
      <p className="text-sm text-gray-500 mb-6">Tell us a bit about yourself.</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Age
          </label>
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5">
            <button type="button" onClick={() => adjustAge(-1)} className="text-gray-400 hover:text-violet-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-800">{form.age || "—"}</span>
            <button type="button" onClick={() => adjustAge(1)} className="text-gray-400 hover:text-violet-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 text-center">years</p>
        </div>

        <div className="col-span-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            Gender
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {GENDERS.map((g) => {
              const Icon = g.icon;
              const active = form.gender === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  title={g.label}
                  onClick={() => setForm({ ...form, gender: g.value })}
                  className={`aspect-square rounded-full flex items-center justify-center transition-all ${
                    active
                      ? "bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-md shadow-pink-200"
                      : "bg-gray-50 text-gray-400 border border-gray-200 hover:border-violet-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
          What's your skin type?
        </label>
        <div className="grid grid-cols-5 gap-2">
          {SKIN_TYPES.map((t) => {
            const Icon = t.icon;
            const active = form.skin_type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, skin_type: t.value })}
                className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-1 border transition-all ${
                  active
                    ? "bg-gradient-to-br from-violet-600 to-pink-500 border-transparent text-white shadow-md shadow-pink-200"
                    : "bg-white border-gray-200 text-gray-500 hover:border-violet-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium leading-none">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl bg-violet-50 border border-violet-100 p-3.5 flex items-start gap-2.5 mb-8">
        <ShieldCheck className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
        <p className="text-xs text-violet-700">
          Not sure? Don't worry — you can update this anytime in your profile.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-full border border-gray-200 text-gray-600 font-medium px-6 py-3 text-sm hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 text-white font-medium py-3 text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-200 hover:opacity-95 transition-all"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="text-center mt-4">
        <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 hover:underline">
          Skip for now
        </button>
      </div>
    </div>
  );
}