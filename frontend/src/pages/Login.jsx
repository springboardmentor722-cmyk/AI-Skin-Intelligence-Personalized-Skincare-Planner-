import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RitualRing from "../components/RitualRing";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const me = await login(email, password);
      if (rememberMe) {
        localStorage.setItem("remembered_email", email);
      } else {
        localStorage.removeItem("remembered_email");
      }
      navigateByRole(me);
    } catch (err) {
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          setError(err.response.data.detail);
        } else if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail.map(d => d.msg).join(", "));
        } else {
          setError(JSON.stringify(err.response.data.detail));
        }
      } else {
        setError(err.message || "We couldn't sign you in. Check your network or details and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateByRole = (me) => {
    if (me.role === "dermatologist") {
      navigate("/dermatologist/dashboard");
    } else if (me.role === "skincare_consultant") {
      navigate("/consultant/dashboard");
    } else {
      navigate("/dashboard");
    }
  };


  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "transparent", width: "0%" };
    if (password.length < 6) return { label: "Weak", color: "var(--color-danger)", width: "33%" };
    if (password.length < 12) return { label: "Fair", color: "var(--color-gold)", width: "66%" };
    return { label: "Strong", color: "var(--color-medical-green)", width: "100%" };
  };

  const strength = getPasswordStrength();

  return (
    <div className="auth-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--color-bg)" }}>
      <RitualRing size={340} progress={0.62} color="var(--color-primary-tint)" trackColor="transparent" />
      <div className="auth-card" style={{ zIndex: 10, background: "var(--color-surface)", padding: "2.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", width: "100%", maxWidth: "420px", boxShadow: "var(--shadow-lift)" }}>
        <div className="auth-eyebrow" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-clinical-blue)", fontWeight: "800", marginBottom: "0.5rem" }}>
          SkinGenie Clinical Portal
        </div>
        <h1 className="auth-title" style={{ fontSize: "1.8rem", fontWeight: "900", margin: "0 0 0.5rem 0", color: "var(--color-ink)" }}>Sign in</h1>
        <p className="auth-subtitle" style={{ fontSize: "0.88rem", color: "var(--color-ink-muted)", marginBottom: "1.5rem" }}>
          Access your personalized skincare routine & analysis.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="email" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Email Address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="email" className="input" style={{ width: "100%" }} />
          </div>

          <div className="field" style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="password" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="input" style={{ width: "100%" }} />
            
            {/* Password Strength Indicator */}
            {password && (
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "0.2rem" }}>
                  <span style={{ color: "var(--color-ink-muted)" }}>Password Strength:</span>
                  <strong style={{ color: strength.color }}>{strength.label}</strong>
                </div>
                <div style={{ height: "4px", background: "var(--color-surface-sunken)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: strength.width, height: "100%", background: strength.color, transition: "width 0.3s" }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <label style={{ display: "inline-flex", alignItems: "center", fontSize: "0.82rem", cursor: "pointer", color: "var(--color-ink-muted)" }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ marginRight: "0.4rem" }} />
              Remember me
            </label>
            <Link to="/forgot-password" style={{ fontSize: "0.82rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: "600" }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ width: "100%", padding: "0.75rem" }}>
            {loading ? "Processing…" : "Sign In"}
          </button>

          {error && <div className="status-msg error" style={{ marginTop: "1rem", fontSize: "0.82rem" }}>{error}</div>}
        </form>


        <p className="auth-footer" style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.88rem", color: "var(--color-ink-muted)" }}>
          New here? <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: "700", textDecoration: "none" }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
