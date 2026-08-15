import { useEffect, useState } from "react";
import api from "../api/axios";
import ErrorBanner from "../components/ErrorBanner";
import Loading from "../components/Loading";
import "./FormPage.css";
import "./Lifestyle.css";

const EMPTY = {
  sleep_hours: "",
  water_intake_liters: "",
  exercise_minutes: "",
  stress_level: "",
  smoking: false,
  alcohol: false,
  diet_quality: "",
  outdoor_exposure_hours: "",
  screen_time_hours: "",
};

export default function Lifestyle() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadLogs = () => {
    setLoading(true);
    api
      .get("/lifestyle")
      .then((res) => setLogs(res.data))
      .catch(() => setError("Could not load lifestyle logs."))
      .finally(() => setLoading(false));
  };

  useEffect(loadLogs, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const buildPayload = () => ({
    sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
    water_intake_liters: form.water_intake_liters ? Number(form.water_intake_liters) : null,
    exercise_minutes: form.exercise_minutes ? Number(form.exercise_minutes) : null,
    stress_level: form.stress_level || null,
    smoking: !!form.smoking,
    alcohol: !!form.alcohol,
    diet_quality: form.diet_quality || null,
    outdoor_exposure_hours: form.outdoor_exposure_hours ? Number(form.outdoor_exposure_hours) : null,
    screen_time_hours: form.screen_time_hours ? Number(form.screen_time_hours) : null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await api.put(`/lifestyle/${editingId}`, payload);
        setSuccess("Lifestyle log updated.");
      } else {
        await api.post("/lifestyle", payload);
        setSuccess("Lifestyle log added.");
      }
      setForm(EMPTY);
      setEditingId(null);
      loadLogs();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save lifestyle log.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (log) => {
    setEditingId(log.id);
    setForm({ ...EMPTY, ...log });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this lifestyle log?")) return;
    try {
      await api.delete(`/lifestyle/${id}`);
      loadLogs();
    } catch {
      setError("Could not delete lifestyle log.");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  return (
    <div className="form-page lifestyle-page">
      <div className="form-page-header">
        <span className="eyebrow">Lifestyle Tracking</span>
        <h1>Daily habits log</h1>
        <p>Sleep, hydration, exercise, and stress — logged over time.</p>
      </div>

      <div className="glass-card form-card">
        <ErrorBanner message={error} />
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label>Sleep hours</label>
              <input
                type="number"
                step="0.5"
                name="sleep_hours"
                value={form.sleep_hours}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label>Water intake (liters)</label>
              <input
                type="number"
                step="0.1"
                name="water_intake_liters"
                value={form.water_intake_liters}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Exercise (minutes)</label>
              <input
                type="number"
                name="exercise_minutes"
                value={form.exercise_minutes}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label>Stress level</label>
              <select name="stress_level" value={form.stress_level || ""} onChange={handleChange}>
                <option value="">Select</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Outdoor exposure (hours)</label>
              <input
                type="number"
                step="0.5"
                name="outdoor_exposure_hours"
                value={form.outdoor_exposure_hours}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label>Screen time (hours)</label>
              <input
                type="number"
                step="0.5"
                name="screen_time_hours"
                value={form.screen_time_hours}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="field">
            <label>Diet quality</label>
            <select name="diet_quality" value={form.diet_quality || ""} onChange={handleChange}>
              <option value="">Select</option>
              <option value="Poor">Poor</option>
              <option value="Average">Average</option>
              <option value="Good">Good</option>
              <option value="Excellent">Excellent</option>
            </select>
          </div>

          <div className="field-row checkbox-row">
            <label className="checkbox-label">
              <input type="checkbox" name="smoking" checked={form.smoking} onChange={handleChange} />
              Smoking
            </label>
            <label className="checkbox-label">
              <input type="checkbox" name="alcohol" checked={form.alcohol} onChange={handleChange} />
              Alcohol
            </label>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update log" : "Add log"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <h2 className="lifestyle-history-title">History</h2>

      {loading ? (
        <Loading label="Loading logs" />
      ) : logs.length === 0 ? (
        <div className="glass-card empty-state">
          <p>No lifestyle logs yet. Add your first entry above.</p>
        </div>
      ) : (
        <div className="lifestyle-table-wrapper glass-card">
          <table className="lifestyle-table">
            <thead>
              <tr>
                <th>Logged</th>
                <th>Sleep</th>
                <th>Water</th>
                <th>Exercise</th>
                <th>Stress</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.logged_at).toLocaleDateString()}</td>
                  <td>{log.sleep_hours ?? "—"} h</td>
                  <td>{log.water_intake_liters ?? "—"} L</td>
                  <td>{log.exercise_minutes ?? "—"} min</td>
                  <td>{log.stress_level ?? "—"}</td>
                  <td className="lifestyle-table-actions">
                    <button className="link-button" onClick={() => handleEdit(log)}>
                      Edit
                    </button>
                    <button className="link-button danger" onClick={() => handleDelete(log.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
