import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import ErrorBanner from "../components/ErrorBanner";
import Loading from "../components/Loading";
import "./FormPage.css";
import "./SkinProfile.css";

const SKIN_TYPES = ["Normal", "Dry", "Oily", "Combination", "Sensitive"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB, matches the backend limit
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EMPTY = {
  skin_type: "",
  skin_concerns: "",
  allergies: "",
  sensitivity_level: "",
  current_products: "",
  hydration_level: "",
  water_intake_liters: "",
  sun_exposure: "",
  occupation: "",
  environment: "",
  skin_photo_url: "",
};

export default function SkinProfile() {
  const [form, setForm] = useState(EMPTY);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    api
      .get("/skin-profile")
      .then((res) => {
        setForm({ ...EMPTY, ...res.data });
        setExists(true);
      })
      .catch(() => setExists(false))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => ({
    ...form,
    water_intake_liters: form.water_intake_liters ? Number(form.water_intake_liters) : null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const payload = buildPayload();
      const res = exists
        ? await api.put("/skin-profile", payload)
        : await api.post("/skin-profile", payload);
      setForm({ ...EMPTY, ...res.data });
      setExists(true);
      setSuccess(exists ? "Skin profile updated." : "Skin profile created.");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save skin profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your skin profile? This cannot be undone.")) return;
    setError("");
    try {
      await api.delete("/skin-profile");
      setForm(EMPTY);
      setExists(false);
      setSuccess("Skin profile deleted.");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not delete skin profile.");
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setPhotoError("");

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Image must be 5 MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setPhotoUploading(true);
    try {
      const res = await api.post("/skin-profile/photo", formData, {
        headers: { "Content-Type": undefined }, // let the browser set the multipart boundary
      });
      setForm((prev) => ({ ...prev, skin_photo_url: res.data.skin_photo_url }));
    } catch (err) {
      setPhotoError(err?.response?.data?.message || "Could not upload photo.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoRemove = async () => {
    if (!window.confirm("Remove your skin photo?")) return;
    setPhotoError("");
    try {
      const res = await api.delete("/skin-profile/photo");
      setForm((prev) => ({ ...prev, skin_photo_url: res.data.skin_photo_url }));
    } catch (err) {
      setPhotoError(err?.response?.data?.message || "Could not remove photo.");
    }
  };

  if (loading) return <Loading label="Loading your skin profile" />;

  return (
    <div className="form-page">
      <div className="form-page-header">
        <span className="eyebrow">Skin Profile</span>
        <h1>Your skin, in detail</h1>
        <p>This feeds every future AI module — skin assessment, routines, and recommendations.</p>
      </div>

      <div className="glass-card form-card skin-photo-card">
        <div className="skin-photo-row">
          <div className="skin-photo-preview">
            {form.skin_photo_url ? (
              <img src={form.skin_photo_url} alt="Your skin" />
            ) : (
              <div className="skin-photo-placeholder" aria-hidden="true">
                🖼️
              </div>
            )}
          </div>

          <div className="skin-photo-info">
            <h3>Skin photo</h3>
            <p>
              {exists
                ? "Add a clear, well-lit photo. This is stored with your skin profile and will feed future AI skin-assessment features."
                : "Create your skin profile below first, then you can attach a photo."}
            </p>

            <ErrorBanner message={photoError} />

            <div className="skin-photo-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                disabled={!exists || photoUploading}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!exists || photoUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {photoUploading
                  ? "Uploading..."
                  : form.skin_photo_url
                  ? "Replace photo"
                  : "Upload photo"}
              </button>
              {form.skin_photo_url && (
                <button
                  type="button"
                  className="link-button danger"
                  onClick={handlePhotoRemove}
                  disabled={photoUploading}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card form-card">
        <ErrorBanner message={error} />
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label>Skin type</label>
              <select name="skin_type" value={form.skin_type || ""} onChange={handleChange}>
                <option value="">Select</option>
                {SKIN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Sensitivity level</label>
              <select
                name="sensitivity_level"
                value={form.sensitivity_level || ""}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Skin concerns</label>
            <input
              name="skin_concerns"
              value={form.skin_concerns || ""}
              onChange={handleChange}
              placeholder="Acne, dark spots, fine lines..."
            />
          </div>

          <div className="field">
            <label>Allergies</label>
            <input
              name="allergies"
              value={form.allergies || ""}
              onChange={handleChange}
              placeholder="Fragrance, salicylic acid..."
            />
          </div>

          <div className="field">
            <label>Current products</label>
            <input
              name="current_products"
              value={form.current_products || ""}
              onChange={handleChange}
              placeholder="Cleanser, moisturizer, SPF 30..."
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Hydration level</label>
              <select
                name="hydration_level"
                value={form.hydration_level || ""}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="Well hydrated">Well hydrated</option>
              </select>
            </div>
            <div className="field">
              <label>Water intake (liters/day)</label>
              <input
                type="number"
                step="0.1"
                name="water_intake_liters"
                value={form.water_intake_liters || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Sun exposure</label>
              <select name="sun_exposure" value={form.sun_exposure || ""} onChange={handleChange}>
                <option value="">Select</option>
                <option value="Minimal">Minimal</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="field">
              <label>Occupation</label>
              <input name="occupation" value={form.occupation || ""} onChange={handleChange} />
            </div>
          </div>

          <div className="field">
            <label>Environment</label>
            <select name="environment" value={form.environment || ""} onChange={handleChange}>
              <option value="">Select</option>
              <option value="Urban">Urban</option>
              <option value="Coastal">Coastal</option>
              <option value="Dry/Arid">Dry/Arid</option>
              <option value="Humid">Humid</option>
              <option value="Cold/Mountain">Cold/Mountain</option>
            </select>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : exists ? "Update skin profile" : "Create skin profile"}
            </button>
            {exists && (
              <button type="button" className="btn btn-ghost" onClick={handleDelete}>
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
