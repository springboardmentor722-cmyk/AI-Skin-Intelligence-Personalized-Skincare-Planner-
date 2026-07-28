import { Moon, Droplet, PersonStanding, Sparkles, Sun, ChevronLeft, Check } from "lucide-react";
import StepIndicator from "./StepIndicator";

const STRESS_LEVELS = [
  { value: "low", label: "Low", activeClass: "bg-emerald-500 text-white border-transparent", idleClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "moderate", label: "Moderate", activeClass: "bg-amber-500 text-white border-transparent", idleClass: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "high", label: "High", activeClass: "bg-rose-500 text-white border-transparent", idleClass: "bg-rose-50 text-rose-700 border-rose-200" },
];

function WaterGlasses({ liters, max = 4 }) {
  const filled = Math.round((liters / max) * 6);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <Droplet
          key={i}
          className={`w-3.5 h-3.5 ${i < filled ? "text-sky-500 fill-sky-500" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
}

function HabitRow({ icon: Icon, iconClass, label, sublabel, children }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          {sublabel && <p className="text-[11px] text-gray-400">{sublabel}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function LifestyleStep({ form, setForm, onFinish, onBack, onSkip, submitting }) {
  return (
    <div>
      <div className="mb-6">
        <StepIndicator currentStep={3} />
      </div>

      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center mx-auto mb-3 shadow-md shadow-pink-200">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-semibold text-gray-800 mb-1">
          Tell us about your lifestyle
        </h2>
        <p className="text-sm text-gray-500">Your daily habits help us personalize better.</p>
      </div>

      <div className="space-y-3 mb-6">
        <HabitRow icon={Moon} iconClass="bg-indigo-50 text-indigo-500" label="Sleep Hours">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={form.sleep_hours}
              onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })}
              className="w-14 text-right font-semibold text-gray-800 outline-none bg-transparent"
            />
            <span className="text-xs text-gray-400">hrs</span>
          </div>
        </HabitRow>

        <HabitRow icon={Droplet} iconClass="bg-sky-50 text-sky-500" label="Water Intake" sublabel="in liters/day">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                step={0.1}
                value={form.water_intake_liters}
                onChange={(e) => setForm({ ...form, water_intake_liters: e.target.value })}
                className="w-12 text-right font-semibold text-gray-800 outline-none bg-transparent"
              />
              <span className="text-xs text-gray-400">L</span>
            </div>
            <WaterGlasses liters={Number(form.water_intake_liters) || 0} />
          </div>
        </HabitRow>

        <HabitRow icon={PersonStanding} iconClass="bg-orange-50 text-orange-500" label="Exercise Minutes" sublabel="per day">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={form.exercise_minutes}
              onChange={(e) => setForm({ ...form, exercise_minutes: e.target.value })}
              className="w-14 text-right font-semibold text-gray-800 outline-none bg-transparent"
            />
            <span className="text-xs text-gray-400">mins</span>
          </div>
        </HabitRow>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
          <p className="text-sm font-medium text-gray-700 mb-2.5">Stress Level</p>
          <div className="flex gap-2">
            {STRESS_LEVELS.map((s) => {
              const active = form.stress_level === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm({ ...form, stress_level: s.value })}
                  className={`flex-1 rounded-full border py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                    active ? s.activeClass : s.idleClass
                  }`}
                >
                  {active && <Check className="w-3 h-3" strokeWidth={3} />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-yellow-50 text-yellow-500">
              <Sun className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-gray-700">Environmental Exposure</p>
          </div>
          <input
            type="text"
            value={form.pollution_exposure}
            onChange={(e) => setForm({ ...form, pollution_exposure: e.target.value })}
            placeholder="e.g. high pollution, frequent sun exposure"
            className="w-full text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-full border border-gray-200 text-gray-600 font-medium px-6 py-3 text-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5">
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onFinish}
          disabled={submitting}
          className="flex-1 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 text-white font-medium py-3 text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-200 hover:opacity-95 transition-all disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Finish & Go to Dashboard"}
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