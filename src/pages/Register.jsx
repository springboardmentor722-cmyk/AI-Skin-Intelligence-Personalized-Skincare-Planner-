import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorBanner from "../components/ErrorBanner";
import { roleHomePath } from "../components/ProtectedRoute";
import "./Auth.css";

const ROLES = ["User", "Skincare Consultant", "Dermatologist", "Administrator"];

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone_number: "",
  password: "",
  confirm_password: "",
  gender: "",
  age: "",
  address: "",
  city: "",
  state: "",
  country: "",
  role: "User",
  terms_accepted: false,
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = ROLES.includes(searchParams.get("role")) ? searchParams.get("role") : "User";

  const [form, setForm] = useState({ ...EMPTY_FORM, role: initialRole });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.terms_accepted) {
      setError("You must accept the terms and conditions.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form, age: form.age ? Number(form.age) : null };
      const user = await register(payload);
      navigate(roleHomePath(user.role), { replace: true });
    } catch (err) {
      const detail = err?.response?.data;
      if (detail?.errors?.length) {
        setError(detail.errors.map((e2) => e2.msg).join(" "));
      } else {
        setError(detail?.message || "Registration failed. Please check your details.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page section">
      <div className="container auth-container">
        <div className="glass-card auth-card auth-card-wide">
          <span className="eyebrow">Create your account</span>
          <h1 className="auth-title">Join as {form.role}</h1>
          <p className="auth-subtitle">
            Every role gets its own dashboard, sidebar, and protected APIs.
          </p>

          <ErrorBanner message={error} />

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="role">Continue as</label>
              <select id="role" name="role" value={form.role} onChange={handleChange}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="full_name">Full name</label>
                <input
                  id="full_name"
                  name="full_name"
                  required
                  value={form.full_name}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="phone_number">Phone number</label>
                <input
                  id="phone_number"
                  name="phone_number"
                  required
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="+91XXXXXXXXXX"
                />
              </div>
              <div className="field">
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" value={form.gender} onChange={handleChange}>
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
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="confirm_password">Confirm password</label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  required
                  value={form.confirm_password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="address">Address</label>
                <input id="address" name="address" value={form.address} onChange={handleChange} />
              </div>
            </div>

            <div className="field-row-3">
              <div className="field">
                <label htmlFor="city">City</label>
                <input id="city" name="city" value={form.city} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="state">State</label>
                <input id="state" name="state" value={form.state} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="country">Country</label>
                <input id="country" name="country" value={form.country} onChange={handleChange} />
              </div>
            </div>

            <label className="checkbox-label terms-row">
              <input
                type="checkbox"
                name="terms_accepted"
                checked={form.terms_accepted}
                onChange={handleChange}
              />
              I accept the Terms and Conditions
            </label>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
