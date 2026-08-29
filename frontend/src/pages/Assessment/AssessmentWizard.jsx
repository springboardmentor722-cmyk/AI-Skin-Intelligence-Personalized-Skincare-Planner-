import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TbDroplet, TbWind, TbAdjustmentsHorizontal, TbShieldHalfFilled,
  TbCircleDot, TbSparkles, TbFlame, TbClock, TbLeaf,
} from "react-icons/tb";
import { submitAssessment, generateRoutine } from "../../services/assessment";
import { getMyProfile } from "../../services/profile";
import { useToast } from "../../context/ToastContext";

const DRAFT_KEY = "assessment_draft_v1";

const SKIN_TYPES = [
  { value: "Normal", label: "Normal", icon: <TbLeaf />, desc: "Balanced, no major issues" },
  { value: "Oily", label: "Oily", icon: <TbDroplet />, desc: "Shine, enlarged pores, breakout-prone" },
  { value: "Dry", label: "Dry", icon: <TbWind />, desc: "Tight feeling, flaky patches" },
  { value: "Combination", label: "Combination", icon: <TbAdjustmentsHorizontal />, desc: "Oily T-zone, normal/dry cheeks" },
  { value: "Sensitive", label: "Sensitive", icon: <TbShieldHalfFilled />, desc: "Reacts easily, stings or reddens" },
];

const CONCERNS = [
  { field: "acne_severity", label: "Acne", icon: <TbCircleDot /> },
  { field: "hyperpigmentation_severity", label: "Dark Spots", icon: <TbSparkles /> },
  { field: "redness_severity", label: "Redness", icon: <TbFlame /> },
  { field: "wrinkles_severity", label: "Fine Lines", icon: <TbClock /> },
];

// Profile's Skin Concerns chips use different labels than the assessment's
// 4 supported severity fields. Map whatever overlaps; anything else
// (Blackheads, Oiliness, Dullness, etc.) just doesn't get a severity slider.
const CONCERN_LABEL_TO_FIELD = {
  "Acne": "acne_severity",
  "Dark Spots": "hyperpigmentation_severity",
  "Pigmentation": "hyperpigmentation_severity",
  "Redness": "redness_severity",
  "Wrinkles": "wrinkles_severity",
  "Fine Lines": "wrinkles_severity",
};

const defaultDraft = {
  skin_type: "",
  selectedConcerns: [],
  acne_severity: 0,
  hyperpigmentation_severity: 0,
  redness_severity: 0,
  wrinkles_severity: 0,
  sleep_hours: "",
  water_intake_liters: "",
  sun_exposure: "Medium",
};

const STEP_IMAGES = {
  1: "/images/wizard-step-1.png",
  2: "/images/wizard-step-2.png",
  3: "/images/wizard-step-3.png",
  4: "/images/wizard-step-4.png",
};

export default function AssessmentWizard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(defaultDraft);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Prefer a resumed draft over the profile; only pre-fill from the
  // profile on a genuinely fresh start, so we don't clobber in-progress answers.
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
        setLoadingProfile(false);
        return;
      } catch { /* fall through to profile pre-fill */ }
    }

    getMyProfile()
      .then((res) => {
        const p = res.data;
        const concernLabels = (p.skin_concerns || "").split(",").map((s) => s.trim());
        const matchedFields = concernLabels
          .map((label) => CONCERN_LABEL_TO_FIELD[label])
          .filter(Boolean);

        setData((d) => ({
          ...d,
          skin_type: p.skin_type || "",
          selectedConcerns: [...new Set(matchedFields)],
          sleep_hours: p.sleep_hours ?? "",
          water_intake_liters: p.water_intake ?? "",
          sun_exposure: p.sun_exposure || "Medium",
        }));
      })
      .catch(() => { /* no profile yet — just start blank, fields stay editable */ })
      .finally(() => setLoadingProfile(false));
  }, []);

  useEffect(() => {
    if (!loadingProfile) localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  }, [data, loadingProfile]);

  const toggleConcern = (field) => {
    setData((d) => ({
      ...d,
      selectedConcerns: d.selectedConcerns.includes(field)
        ? d.selectedConcerns.filter((f) => f !== field)
        : [...d.selectedConcerns, field],
    }));
  };

  const canProceed = () => {
    if (step === 1) return !!data.skin_type;
    if (step === 2) return true;
    if (step === 3) {
      const sleep = Number(data.sleep_hours);
      const water = Number(data.water_intake_liters);
      return sleep >= 0 && sleep <= 24 && data.sleep_hours !== "" && water >= 0 && data.water_intake_liters !== "";
    }
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        skin_type: data.skin_type,
        acne_severity: data.selectedConcerns.includes("acne_severity") ? data.acne_severity : 0,
        hyperpigmentation_severity: data.selectedConcerns.includes("hyperpigmentation_severity") ? data.hyperpigmentation_severity : 0,
        redness_severity: data.selectedConcerns.includes("redness_severity") ? data.redness_severity : 0,
        wrinkles_severity: data.selectedConcerns.includes("wrinkles_severity") ? data.wrinkles_severity : 0,
        sleep_hours: Number(data.sleep_hours),
        water_intake_liters: Number(data.water_intake_liters),
        sun_exposure: data.sun_exposure,
      };

      await submitAssessment(payload);
      await generateRoutine();

      localStorage.removeItem(DRAFT_KEY);
      showToast("Assessment complete — your routine is ready!");
      navigate("/planner");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong analyzing your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = 4;

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-ink-secondary">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center px-4 py-12">
      <div className="glass w-full max-w-[640px] p-10">
        <div className="w-full h-40 rounded-xl overflow-hidden mb-6">
          <img src={STEP_IMAGES[step]} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-ink-secondary mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-pill bg-white/50 overflow-hidden">
            <div
              className="h-full bg-ocean-500 rounded-pill transition-all"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {error && <p className="pill pill-flagged py-2 px-4 w-fit mx-auto mb-4">{error}</p>}

        {step === 1 && (
          <div className="animate-in">
            <h1 className="text-2xl font-semibold mb-1">Confirm your skin type</h1>
            <p className="text-sm text-ink-secondary mb-6">
              {data.skin_type ? "Pulled from your profile — change it if it's out of date." : "Pick whichever matches how your skin usually feels."}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {SKIN_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setData({ ...data, skin_type: t.value })}
                  className={`p-4 rounded-2xl text-left transition-all border ${
                    data.skin_type === t.value
                      ? "bg-ocean-500 text-white border-ocean-500"
                      : "bg-white/50 border-white/60 hover:bg-white/70"
                  }`}
                >
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <p className="font-medium">{t.label}</p>
                  <p className={`text-xs ${data.skin_type === t.value ? "text-white/80" : "text-ink-secondary"}`}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in">
            <h1 className="text-2xl font-semibold mb-1">How intense are they, right now?</h1>
            <p className="text-sm text-ink-secondary mb-6">
              We already know your concerns from your profile — this is the one thing we haven't asked: how bad each one actually is.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {CONCERNS.map((c) => (
                <button
                  key={c.field}
                  type="button"
                  onClick={() => toggleConcern(c.field)}
                  className={`p-4 rounded-2xl text-left transition-all border flex items-center gap-3 ${
                    data.selectedConcerns.includes(c.field)
                      ? "bg-ocean-500 text-white border-ocean-500"
                      : "bg-white/50 border-white/60 hover:bg-white/70"
                  }`}
                >
                  <span className="text-xl">{c.icon}</span>
                  <span className="font-medium">{c.label}</span>
                </button>
              ))}
            </div>

            {data.selectedConcerns.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-ink-primary">How intense? (0 = mild, 10 = severe)</p>
                {CONCERNS.filter((c) => data.selectedConcerns.includes(c.field)).map((c) => (
                  <div key={c.field}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ink-primary">{c.label}</span>
                      <span className="font-mono text-ocean-600">{data[c.field]}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0" max="10"
                      value={data[c.field]}
                      onChange={(e) => setData({ ...data, [c.field]: Number(e.target.value) })}
                      className="w-full accent-ocean-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="animate-in">
            <h1 className="text-2xl font-semibold mb-1">Quick lifestyle check</h1>
            <p className="text-sm text-ink-secondary mb-6">Pulled from your profile — update anything that's changed.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="number" step="0.5" min="0" max="24"
                placeholder="Sleep hours per night"
                value={data.sleep_hours}
                onChange={(e) => setData({ ...data, sleep_hours: e.target.value })}
                className="field"
              />
              <input
                type="number" step="0.1" min="0"
                placeholder="Water intake (litres/day)"
                value={data.water_intake_liters}
                onChange={(e) => setData({ ...data, water_intake_liters: e.target.value })}
                className="field"
              />
              <select
                value={data.sun_exposure}
                onChange={(e) => setData({ ...data, sun_exposure: e.target.value })}
                className="field sm:col-span-2"
              >
                <option value="Low">Low sun exposure (mostly indoors / always SPF)</option>
                <option value="Medium">Medium sun exposure</option>
                <option value="High">High sun exposure (frequent, often unprotected)</option>
              </select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in">
            <h1 className="text-2xl font-semibold mb-1">Review</h1>
            <p className="text-sm text-ink-secondary mb-6">Confirm before we analyze your profile.</p>
            <div className="glass p-4 space-y-2 text-sm">
              <p><span className="text-ink-secondary">Skin type:</span> {data.skin_type}</p>
              <p><span className="text-ink-secondary">Concerns:</span> {
                data.selectedConcerns.length
                  ? CONCERNS.filter((c) => data.selectedConcerns.includes(c.field)).map((c) => `${c.label} (${data[c.field]}/10)`).join(", ")
                  : "None reported"
              }</p>
              <p><span className="text-ink-secondary">Sleep:</span> {data.sleep_hours} hrs/night</p>
              <p><span className="text-ink-secondary">Water intake:</span> {data.water_intake_liters} L/day</p>
              <p><span className="text-ink-secondary">Sun exposure:</span> {data.sun_exposure}</p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            type="button"
            disabled={step === 1 || submitting}
            onClick={() => setStep(step - 1)}
            className="btn-outline disabled:opacity-40"
          >
            Back
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              disabled={!canProceed()}
              onClick={() => setStep(step + 1)}
              className="btn-primary disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="btn-primary disabled:opacity-60"
            >
              {submitting ? "Analyzing your skin profile..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
