import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import RitualRing from "../components/RitualRing";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dermatologist extra fields
  const [specialty, setSpecialty] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [certificateFile, setCertificateFile] = useState(null);

  // Consultant extra fields
  const [specialization, setSpecialization] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [consultantPhone, setConsultantPhone] = useState("");
  const [consultantWebsite, setConsultantWebsite] = useState("");
  const [consultantBio, setConsultantBio] = useState("");

  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCertificateFile(e.target.files[0]);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "transparent", width: "0%" };
    if (password.length < 6) return { label: "Weak (minimum 6)", color: "var(--color-danger)", width: "33%" };
    if (password.length < 12) return { label: "Fair (needs 12+ for production)", color: "var(--color-gold)", width: "66%" };
    return { label: "Strong & Secure", color: "var(--color-medical-green)", width: "100%" };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 12) {
      setError("Password must be at least 12 characters long for clinical-grade security compliance.");
      return;
    }
    setLoading(true);
    try {
      // 1. Create main user account
      await register(fullName, email, password, role);

      // 2. Log in to establish current session
      const loggedInUser = await login(email, password);

      // 3. Handle dermatologist profile setup and file upload
      if (role === "dermatologist") {
        let certificateUrl = null;

        // Upload certificate if provided
        if (certificateFile) {
          const formData = new FormData();
          formData.append("file", certificateFile);
          try {
            const uploadRes = await api.post("/workspace/upload-certificate", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            certificateUrl = uploadRes.data.url;
          } catch (uploadErr) {
            console.error("Certificate upload failed", uploadErr);
            throw new Error("User created, but certificate upload failed. You can upload it in your profile.");
          }
        }

        // Upsert dermatologist profile
        await api.put("/workspace/dermatologist-profile", {
          phone: phone || null,
          clinic_name: clinicName || null,
          specialty: specialty || null,
          bio: bio || null,
          address: address || null,
          website: website || null,
          accepting_new_patients: true,
          certificate_url: certificateUrl,
        });

        setSuccess(true);
        navigate("/dermatologist/dashboard", { replace: true });
      } 
      // 4. Handle consultant profile setup
      else if (role === "skincare_consultant") {
        await api.put("/workspace/consultant-profile", {
          phone: consultantPhone || null,
          organization_name: organizationName || null,
          specialization: specialization || null,
          bio: consultantBio || null,
          website: consultantWebsite || null,
        });

        setSuccess(true);
        navigate("/consultant/dashboard", { replace: true });
      } 
      // 5. Standard user setup
      else {
        setSuccess(true);
        navigate("/skin-profile", { replace: true });
      }
    } catch (err) {
      setError(err.message || err.response?.data?.detail || "We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--color-bg)", padding: "2rem 0" }}>
      <RitualRing size={340} progress={0.4} color="var(--color-accent-tint)" trackColor="transparent" />
      <div className="auth-card" style={{ zIndex: 10, background: "var(--color-surface)", padding: "2.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", width: "100%", maxWidth: "540px", boxShadow: "var(--shadow-lift)" }}>
        <div className="auth-eyebrow" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-clinical-blue)", fontWeight: "800", marginBottom: "0.5rem" }}>
          Get started
        </div>
        <h1 className="auth-title" style={{ fontSize: "1.8rem", fontWeight: "900", margin: "0 0 0.5rem 0", color: "var(--color-ink)" }}>Create your account</h1>
        <p className="auth-subtitle" style={{ fontSize: "0.88rem", color: "var(--color-ink-muted)", marginBottom: "1.5rem" }}>
          Set up your workspace in a few minutes.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="fullName" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Full name</label>
            <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" className="input" style={{ width: "100%" }} />
          </div>
          
          <div className="field" style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="email" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Email address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="input" style={{ width: "100%" }} />
          </div>
          
          <div className="field" style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="password" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Password <span style={{ fontSize: "0.72rem", color: "var(--color-ink-faint)", fontWeight: "normal" }}>(minimum 12 characters)</span></label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={72} autoComplete="new-password" className="input" style={{ width: "100%" }} />
            
            {/* Live Strength Visualizer */}
            {password && (
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "0.2rem" }}>
                  <span style={{ color: "var(--color-ink-muted)" }}>Strength:</span>
                  <strong style={{ color: strength.color }}>{strength.label}</strong>
                </div>
                <div style={{ height: "4px", background: "var(--color-surface-sunken)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: strength.width, height: "100%", background: strength.color, transition: "width 0.3s" }} />
                </div>
              </div>
            )}
          </div>

          <div className="field" style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="role" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>I am a</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="input" style={{ width: "100%" }}>
              <option value="user">Skincare User (Patient)</option>
              <option value="skincare_consultant">Skincare Consultant</option>
              <option value="dermatologist">Dermatologist (MD)</option>
            </select>
          </div>

          {/* Conditional Dermatologist Fields */}
          {role === "dermatologist" && (
            <div className="form-section-highlight card" style={{ padding: "1.25rem", margin: "1.5rem 0", background: "var(--color-surface-sunken)", border: "1px solid var(--color-border)" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "var(--color-clinical-blue)", fontSize: "1.1rem", fontWeight: "800" }}>Dermatologist Details</h3>
              
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="specialty" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Specialty *</label>
                <input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Clinical, Cosmetic, Pediatric" required className="input" style={{ width: "100%" }} />
              </div>
              
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="clinicName" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Clinic Name</label>
                <input id="clinicName" value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="e.g. Apex Skin Clinic" className="input" style={{ width: "100%" }} />
              </div>
              
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="phone" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Phone Number</label>
                <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 99999 88888" className="input" style={{ width: "100%" }} />
              </div>
              
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="address" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Address</label>
                <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 46-12 Danavaipet" className="input" style={{ width: "100%" }} />
              </div>
              
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="website" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Website</label>
                <input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" className="input" style={{ width: "100%" }} />
              </div>
              
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="bio" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Professional Bio</label>
                <textarea id="bio" rows="3" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Describe your clinical expertise..." className="input" style={{ width: "100%" }} />
              </div>
              
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="certificate" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Upload Certificate (PDF / Image) *</label>
                <input id="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} required style={{ border: "none", padding: 0 }} />
                <span style={{ display: "block", fontSize: "0.72rem", color: "var(--color-ink-muted)", marginTop: "0.25rem" }}>Required for clinical dashboard validation.</span>
              </div>
            </div>
          )}

          {/* Conditional Consultant Fields */}
          {role === "skincare_consultant" && (
            <div className="form-section-highlight card" style={{ padding: "1.25rem", margin: "1.5rem 0", background: "var(--color-surface-sunken)", border: "1px solid var(--color-border)" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "var(--color-clinical-blue)", fontSize: "1.1rem", fontWeight: "800" }}>Consultant Details</h3>
              
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="specialization" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Specialization *</label>
                <input id="specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Skin analysis, treatment curation" required className="input" style={{ width: "100%" }} />
              </div>
              
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="organizationName" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Organization Name</label>
                <input id="organizationName" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="e.g. Glow Skincare Hub" className="input" style={{ width: "100%" }} />
              </div>
              
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="consultantPhone" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Phone Number</label>
                <input id="consultantPhone" value={consultantPhone} onChange={(e) => setConsultantPhone(e.target.value)} placeholder="e.g. +91 88888 77777" className="input" style={{ width: "100%" }} />
              </div>
              
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="consultantWebsite" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Website</label>
                <input id="consultantWebsite" type="url" value={consultantWebsite} onChange={(e) => setConsultantWebsite(e.target.value)} placeholder="https://example.com" className="input" style={{ width: "100%" }} />
              </div>
              
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="consultantBio" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Bio</label>
                <textarea id="consultantBio" rows="3" value={consultantBio} onChange={(e) => setConsultantBio(e.target.value)} placeholder="Describe your skincare consulting history..." className="input" style={{ width: "100%" }} />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading || success} style={{ width: "100%", padding: "0.75rem" }}>
            {loading ? "Creating account…" : "Create account"}
          </button>
          
          {error && <div className="status-msg error" style={{ marginTop: "1rem", fontSize: "0.82rem" }}>{error}</div>}
          {success && <div className="status-msg ok" style={{ marginTop: "1rem", fontSize: "0.82rem" }}>Account created successfully! Redirecting...</div>}
        </form>
        
        <p className="auth-footer" style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.88rem", color: "var(--color-ink-muted)" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: "700", textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
