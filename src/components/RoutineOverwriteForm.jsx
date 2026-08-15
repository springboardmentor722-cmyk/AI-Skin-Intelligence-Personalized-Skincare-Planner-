import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import api from "../api/axios";
import ErrorBanner from "./ErrorBanner";
import "./RoutineOverwriteForm.css";

const CATEGORIES = ["Cleansing", "Treatment", "Moisturizing", "Sun Protection", "Night Care", "Exfoliation"];
const TIMES = ["AM", "PM", "Weekly"];

/**
 * The "Prescription/Routine Overwrite Form" (Milestone 3, Step 4) — lets a
 * consultant or dermatologist replace their client/patient's entire active
 * routine. Submits to PUT /api/v1/routine/overwrite/{clientId}, which
 * immediately reflects on the client's own Daily Planner.
 */
export default function RoutineOverwriteForm({ clientId, onSaved }) {
  const [steps, setSteps] = useState([{ time_of_day: "AM", step_category: "Cleansing" }]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const addStep = () => setSteps((prev) => [...prev, { time_of_day: "AM", step_category: "Cleansing" }]);
  const removeStep = (index) => setSteps((prev) => prev.filter((_, i) => i !== index));
  const updateStep = (index, field, value) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      // Number steps sequentially within each time-of-day group.
      const counters = { AM: 0, PM: 0, Weekly: 0 };
      const payloadSteps = steps.map((s) => {
        counters[s.time_of_day] += 1;
        return { ...s, step_number: counters[s.time_of_day] };
      });

      await api.put(`/v1/routine/overwrite/${clientId}`, { steps: payloadSteps, note: note || null });
      setSuccess("Routine updated — it now shows live on the client's Daily Planner.");
      onSaved?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update this routine.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="routine-overwrite-form">
      <ErrorBanner message={error} />
      {success && <div className="alert alert-success">{success}</div>}

      {steps.map((step, i) => (
        <div key={i} className="routine-overwrite-row">
          <select value={step.time_of_day} onChange={(e) => updateStep(i, "time_of_day", e.target.value)}>
            {TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select value={step.step_category} onChange={(e) => updateStep(i, "step_category", e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button className="link-button danger" onClick={() => removeStep(i)} disabled={steps.length === 1}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <button className="btn btn-ghost" onClick={addStep}>
        <Plus size={15} /> Add step
      </button>

      <textarea
        placeholder="Note for the client (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        style={{ marginTop: 12, width: "100%" }}
      />

      <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: 12 }}>
        {saving ? "Saving..." : "Overwrite routine"}
      </button>
    </div>
  );
}
