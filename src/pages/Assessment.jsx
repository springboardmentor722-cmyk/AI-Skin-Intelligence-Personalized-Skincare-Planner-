import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import api from "../api/axios";
import ErrorBanner from "../components/ErrorBanner";
import "./Assessment.css";

const DRAFT_KEY = "assessment_draft";
const TOTAL_STEPS = 4;

const SKIN_TYPES = ["Normal", "Dry", "Oily", "Combination", "Sensitive"];
const COMMON_CONCERNS = [
  "Acne",
  "Hyperpigmentation",
  "Dark Spots",
  "Dry Skin",
  "Oily Skin",
  "Sensitive Skin",
  "Wrinkles",
  "Fine Lines",
  "Redness",
  "Uneven Skin Tone",
];
const SEVERITIES = ["Low", "Medium", "High"];
const UV_LEVELS = ["Low", "Moderate", "High"];

const EMPTY_DRAFT = {
  skin_type: "",
  concerns: {}, // { Acne: { checked: true, severity: "High", is_active_flare: true } }
  sleep_hours: "",
  water_intake_ml: "",
  uv_exposure: "",
  sun_protection_used: false,
  smoking: false,
  alcohol: false,
  screen_time_hours: "",
  exercise_minutes: "",
  is_highly_sensitive: false,
};

// --- Per-step Zod validation ---
const step1Schema = z.object({
  skin_type: z.enum(SKIN_TYPES, { message: "Select your skin type" }),
});

const step2Schema = z.object({
  sleep_hours: z.coerce.number().min(0, "Must be 0 or more").max(24, "Can't exceed 24 hours"),
  water_intake_ml: z.coerce.number().min(0, "Must be 0 or more").max(10000, "That seems too high"),
});

const step3Schema = z.object({
  uv_exposure: z.enum(UV_LEVELS, { message: "Select your typical sun exposure" }),
  screen_time_hours: z.coerce.number().min(0).max(24, "Can't exceed 24 hours"),
  exercise_minutes: z.coerce.number().min(0).max(1440, "Can't exceed 1440 minutes"),
});

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY_DRAFT, ...JSON.parse(raw) } : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

export default function Assessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(loadDraft);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Auto-save the draft to localStorage on every change, so a refresh
  // never loses progress (Step 5.1.1's "Data Saving" requirement).
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleConcern = (name) => {
    setForm((prev) => {
      const existing = prev.concerns[name];
      const nextConcerns = { ...prev.concerns };
      if (existing?.checked) {
        delete nextConcerns[name];
      } else {
        nextConcerns[name] = { checked: true, severity: "Medium", is_active_flare: false };
      }
      return { ...prev, concerns: nextConcerns };
    });
  };

  const updateConcernField = (name, field, value) => {
    setForm((prev) => ({
      ...prev,
      concerns: {
        ...prev.concerns,
        [name]: { ...prev.concerns[name], [field]: value },
      },
    }));
  };

  const validateStep = () => {
    let schema = null;
    let data = form;
    if (step === 1) schema = step1Schema;
    if (step === 2) schema = step2Schema;
    if (step === 3) schema = step3Schema;
    if (!schema) return true;

    const result = schema.safeParse(data);
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors = {};
    for (const issue of result.error.issues) {
      fieldErrors[issue.path[0]] = issue.message;
    }
    setErrors(fieldErrors);
    return false;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const buildPayload = () => ({
    skin_type: form.skin_type,
    concerns: Object.entries(form.concerns)
      .filter(([, c]) => c.checked)
      .map(([name, c]) => ({
        name,
        severity: c.severity,
        is_active_flare: !!c.is_active_flare,
      })),
    sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
    water_intake_ml: form.water_intake_ml ? Number(form.water_intake_ml) : null,
    uv_exposure: form.uv_exposure || null,
    sun_protection_used: !!form.sun_protection_used,
    smoking: !!form.smoking,
    alcohol: !!form.alcohol,
    screen_time_hours: form.screen_time_hours ? Number(form.screen_time_hours) : null,
    exercise_minutes: form.exercise_minutes ? Number(form.exercise_minutes) : null,
    is_highly_sensitive: !!form.is_highly_sensitive,
  });

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      await api.post("/v1/assessment/evaluate", buildPayload());
      localStorage.removeItem(DRAFT_KEY);
      navigate("/planner");
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Could not submit your assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = (step / TOTAL_STEPS) * 100;

  return (
    <div className="assessment-page">
      <div className="assessment-header">
        <span className="eyebrow">Skin Assessment</span>
        <h1>Let's understand your skin</h1>
        <p>A few quick questions power your personalized routine and Skin Health Score.</p>
      </div>

      <div className="assessment-progress">
        <div className="assessment-progress-label">
          Step {step} of {TOTAL_STEPS}
        </div>
        <div className="assessment-progress-track">
          <div className="assessment-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="glass-card assessment-card">
        <ErrorBanner message={submitError} />

        {step === 1 && (
          <StepConcerns
            form={form}
            errors={errors}
            update={update}
            toggleConcern={toggleConcern}
            updateConcernField={updateConcernField}
          />
        )}
        {step === 2 && <StepHabits form={form} errors={errors} update={update} />}
        {step === 3 && <StepLifestyle form={form} errors={errors} update={update} />}
        {step === 4 && <StepReview form={form} />}

        <div className="assessment-actions">
          {step > 1 && (
            <button type="button" className="btn btn-ghost" onClick={handleBack} disabled={submitting}>
              Back
            </button>
          )}
          <div className="assessment-actions-spacer" />
          {step < TOTAL_STEPS && (
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              Next
            </button>
          )}
          {step === TOTAL_STEPS && (
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Analyzing your skin profile..." : "Submit assessment"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepConcerns({ form, errors, update, toggleConcern, updateConcernField }) {
  return (
    <div className="assessment-step">
      <h3>Step 1: Skin type & concerns</h3>

      <div className="field">
        <label>Skin type</label>
        <select value={form.skin_type} onChange={(e) => update("skin_type", e.target.value)}>
          <option value="">Select</option>
          {SKIN_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors.skin_type && <p className="field-error">{errors.skin_type}</p>}
      </div>

      <div className="field">
        <label>Skin concerns (select all that apply)</label>
        <div className="concern-grid">
          {COMMON_CONCERNS.map((name) => {
            const concern = form.concerns[name];
            const checked = !!concern?.checked;
            return (
              <div key={name} className={`concern-item ${checked ? "concern-item-active" : ""}`}>
                <label className="checkbox-row">
                  <input type="checkbox" checked={checked} onChange={() => toggleConcern(name)} />
                  {name}
                </label>
                {checked && (
                  <div className="concern-item-details">
                    <select
                      value={concern.severity}
                      onChange={(e) => updateConcernField(name, "severity", e.target.value)}
                    >
                      {SEVERITIES.map((s) => (
                        <option key={s} value={s}>
                          {s} severity
                        </option>
                      ))}
                    </select>
                    <label className="checkbox-row small">
                      <input
                        type="checkbox"
                        checked={!!concern.is_active_flare}
                        onChange={(e) => updateConcernField(name, "is_active_flare", e.target.checked)}
                      />
                      Active flare-up right now
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepHabits({ form, errors, update }) {
  return (
    <div className="assessment-step">
      <h3>Step 2: Sleep & hydration</h3>

      <div className="field-row">
        <div className="field">
          <label>Average sleep hours per night</label>
          <input
            type="number"
            step="0.5"
            value={form.sleep_hours}
            onChange={(e) => update("sleep_hours", e.target.value)}
          />
          {errors.sleep_hours && <p className="field-error">{errors.sleep_hours}</p>}
        </div>
        <div className="field">
          <label>Water intake (ml/day)</label>
          <input
            type="number"
            step="100"
            value={form.water_intake_ml}
            onChange={(e) => update("water_intake_ml", e.target.value)}
          />
          {errors.water_intake_ml && <p className="field-error">{errors.water_intake_ml}</p>}
        </div>
      </div>
    </div>
  );
}

function StepLifestyle({ form, errors, update }) {
  return (
    <div className="assessment-step">
      <h3>Step 3: Lifestyle & sun exposure</h3>

      <div className="field">
        <label>Typical sun/UV exposure</label>
        <select value={form.uv_exposure} onChange={(e) => update("uv_exposure", e.target.value)}>
          <option value="">Select</option>
          {UV_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        {errors.uv_exposure && <p className="field-error">{errors.uv_exposure}</p>}
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.sun_protection_used}
          onChange={(e) => update("sun_protection_used", e.target.checked)}
        />
        I regularly use sunscreen/sun protection
      </label>

      <div className="field-row">
        <label className="checkbox-row">
          <input type="checkbox" checked={form.smoking} onChange={(e) => update("smoking", e.target.checked)} />
          I smoke
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.alcohol} onChange={(e) => update("alcohol", e.target.checked)} />
          I drink alcohol regularly
        </label>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Daily screen time (hours)</label>
          <input
            type="number"
            step="0.5"
            value={form.screen_time_hours}
            onChange={(e) => update("screen_time_hours", e.target.value)}
          />
          {errors.screen_time_hours && <p className="field-error">{errors.screen_time_hours}</p>}
        </div>
        <div className="field">
          <label>Daily exercise (minutes)</label>
          <input
            type="number"
            step="5"
            value={form.exercise_minutes}
            onChange={(e) => update("exercise_minutes", e.target.value)}
          />
          {errors.exercise_minutes && <p className="field-error">{errors.exercise_minutes}</p>}
        </div>
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.is_highly_sensitive}
          onChange={(e) => update("is_highly_sensitive", e.target.checked)}
        />
        My skin is highly sensitive / reacts badly to strong products
      </label>
    </div>
  );
}

function StepReview({ form }) {
  const selectedConcerns = Object.entries(form.concerns).filter(([, c]) => c.checked);

  return (
    <div className="assessment-step">
      <h3>Step 4: Review your answers</h3>

      <ReviewRow label="Skin type" value={form.skin_type || "—"} />
      <ReviewRow
        label="Concerns"
        value={
          selectedConcerns.length
            ? selectedConcerns.map(([name, c]) => `${name} (${c.severity}${c.is_active_flare ? ", flare-up" : ""})`).join(", ")
            : "None selected"
        }
      />
      <ReviewRow label="Sleep" value={form.sleep_hours ? `${form.sleep_hours} h/night` : "—"} />
      <ReviewRow label="Water intake" value={form.water_intake_ml ? `${form.water_intake_ml} ml/day` : "—"} />
      <ReviewRow label="Sun exposure" value={form.uv_exposure || "—"} />
      <ReviewRow label="Sun protection used" value={form.sun_protection_used ? "Yes" : "No"} />
      <ReviewRow label="Smoking / alcohol" value={`${form.smoking ? "Smokes" : "No smoking"}, ${form.alcohol ? "drinks alcohol" : "no alcohol"}`} />
      <ReviewRow label="Highly sensitive skin" value={form.is_highly_sensitive ? "Yes" : "No"} />
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <span className="review-row-label">{label}</span>
      <span className="review-row-value">{value}</span>
    </div>
  );
}
