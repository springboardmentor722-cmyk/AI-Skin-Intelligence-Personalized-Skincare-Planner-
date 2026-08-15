import { useEffect, useState } from "react";
import api from "../api/axios";
import ErrorBanner from "../components/ErrorBanner";
import Loading from "../components/Loading";
import "./FormPage.css";

export default function Profile() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api
      .get("/profile")
      .then((res) => setForm(res.data))
      .catch(() => setError("Could not load your profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const { full_name, phone_number, gender, age, address, city, state, country } = form;
      const res = await api.put("/profile", {
        full_name,
        phone_number,
        gender,
        age: age ? Number(age) : null,
        address,
        city,
        state,
        country,
      });
      setForm(res.data);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading your profile" />;
  if (!form) return <ErrorBanner message={error || "Profile unavailable."} />;

  return (
    <div className="form-page">
      <div className="form-page-header">
        <span className="eyebrow">Account</span>
        <h1>My Profile</h1>
        <p>Keep your personal details up to date.</p>
      </div>

      <div className="glass-card form-card">
        <ErrorBanner message={error} />
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label>Full name</label>
              <input name="full_name" value={form.full_name || ""} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={form.email || ""} disabled />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Phone number</label>
              <input name="phone_number" value={form.phone_number || ""} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Gender</label>
              <select name="gender" value={form.gender || ""} onChange={handleChange}>
                <option value="">Select</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={form.age || ""}
                onChange={handleChange}
                min={1}
                max={120}
              />
            </div>
            <div className="field">
              <label>Address</label>
              <input name="address" value={form.address || ""} onChange={handleChange} />
            </div>
          </div>

          <div className="field-row-3">
            <div className="field">
              <label>City</label>
              <input name="city" value={form.city || ""} onChange={handleChange} />
            </div>
            <div className="field">
              <label>State</label>
              <input name="state" value={form.state || ""} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Country</label>
              <input name="country" value={form.country || ""} onChange={handleChange} />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
