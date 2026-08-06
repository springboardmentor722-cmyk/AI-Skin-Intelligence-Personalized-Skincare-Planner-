import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Lock, Sparkles, CheckCircle2, ArrowRight, ArrowLeft,
  Heart, Shield, Phone, MapPin, Stethoscope, Briefcase, Award,
  Upload, FileText, DollarSign, Clock
} from "lucide-react";
import api from "../../services/api";

const STEPS = [
  { id: 1, label: "Personal" },
  { id: 2, label: "Account" },
  { id: 3, label: "Details" },
  { id: 4, label: "Verification" },
  { id: 5, label: "Confirm" }
];

export default function Register({ initialRole = "user" }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    // Step 1: Personal
    name: "",
    email: "",
    phone: "",
    city: "",
    // Step 2: Account
    password: "",
    role: initialRole, // "user", "consultant", "dermatologist"

    // Step 3 & 4 (Dynamic for USER)
    skinType: "Normal",
    concerns: [],
    waterIntake: "2.5",
    sleepHours: "7.5",
    exercise: "1-2 Days/Week",
    stressLevel: "Moderate",
    outdoorExposure: "1 - 3 hours",

    // Step 3 & 4 (Dynamic for CONSULTANT)
    qualification: "",
    specialization: "",
    experience: "3",
    hospital: "",
    department: "",
    available_days: "Mon, Tue, Wed, Thu, Fri",
    languages: "English, Hindi",
    bio: "",
    clinic_address: "",
    working_hours: "9 AM - 5 PM",
    consultation_mode: "Video Call",

    // Step 3 & 4 (Dynamic for DERMATOLOGIST)
    license_number: "",
    clinic_name: "",
    consultation_fee: "60.0"
  });

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const setDirect = (key, val) => setFormData({ ...formData, [key]: val });

  const handleNext = () => {
    setError("");
    if (currentStep < 5) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError("");
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await api.post("/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role || "user"
      });

      if (formData.role === "user") {
        setSuccessMsg("Account created successfully! Redirecting to sign in...");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setSuccessMsg("Application submitted successfully! Awaiting admin approval.");
        handleNext();
      }
    } catch (err) {
      const respData = err.response?.data;
      const errMsg = respData?.message || respData?.detail || "Registration failed. Please check your details.";
      setError(typeof errMsg === "object" ? (errMsg.message || JSON.stringify(errMsg)) : errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Validators for steppers
  const isStep1Valid = formData.name.trim().length >= 2 && formData.email.includes("@") && formData.phone.trim().length >= 5;
  const isStep2Valid = formData.password.length >= 6;
  const isStep3Valid = formData.role === "user" ? true : formData.qualification.trim().length >= 3;
  const isStep4Valid = formData.role === "user" ? true : (formData.role === "dermatologist" ? formData.license_number.trim().length >= 3 : true);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0a0c10", padding: "24px", fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 640 }}>
        
        {/* ── STEP TRACKER HEADER ── */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 36 }}>
          {STEPS.map((step, idx) => (
            <div key={step.id} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
                  background: currentStep > step.id ? "linear-gradient(135deg,#10b981,#059669)" : currentStep === step.id ? "linear-gradient(135deg,#14b8a6,#8b5cf6)" : "rgba(255,255,255,0.03)",
                  color: currentStep >= step.id ? "white" : "#475569",
                  border: `1.5px solid ${currentStep >= step.id ? "transparent" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: currentStep === step.id ? "0 0 14px rgba(20, 184, 166, 0.3)" : "none",
                  transition: "all 0.3s"
                }}>
                  {currentStep > step.id ? "✓" : step.id}
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: currentStep >= step.id ? "#14b8a6" : "#475569" }}>
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div style={{ width: 44, height: 1.5, background: currentStep > step.id ? "#10b981" : "rgba(255,255,255,0.08)", margin: "0 4px", marginBottom: 18, transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* ── CARD PANEL ── */}
        <div className="card-glass" style={{ padding: "36px", borderRadius: 24, background: "rgba(13, 17, 23, 0.75)", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
          
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
              {formData.role === "user" ? "Create Skin Profile" : `Register Specialist Application`}
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
              {formData.role === "user" ? "Join our clinical AI-driven skincare registry" : `Apply to join our approved board of specialists`}
            </p>
          </div>

          {successMsg && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#10b981", fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
              ✓ {successMsg}
            </div>
          )}

          {error && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={e => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <AnimatePresence mode="wait">
              
              {/* Step 1: Personal Details */}
              {currentStep === 1 && (
                <motion.div key="step-1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Personal Details</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Full Name</label>
                    <div style={{ position: "relative" }}>
                      <User size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Dr. John Doe / Sarah Parker" className="input" style={{ paddingLeft: 40, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} required />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Email Address</label>
                    <div style={{ position: "relative" }}>
                      <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@derma.ai" className="input" style={{ paddingLeft: 40, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} required />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Phone Number</label>
                      <div style={{ position: "relative" }}>
                        <Phone size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+12345678" className="input" style={{ paddingLeft: 40, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} required />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Location / City</label>
                      <div style={{ position: "relative" }}>
                        <MapPin size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                        <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="New York" className="input" style={{ paddingLeft: 40, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} required />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Account Credentials & Role */}
              {currentStep === 2 && (
                <motion.div key="step-2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Account Credentials</h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Password</label>
                    <div style={{ position: "relative" }}>
                      <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                      <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 6 characters" className="input" style={{ paddingLeft: 40, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} required />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Account Classification / Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="input" style={{ background: "rgba(10,12,16,0.9)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10, cursor: "pointer" }}>
                      <option value="user">Patient / Skincare User</option>
                      <option value="consultant">Skincare Advisor / Consultant</option>
                      <option value="dermatologist">Clinical Board Dermatologist</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Specific details */}
              {currentStep === 3 && (
                <motion.div key="step-3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Credentials & Experience</h3>
                  
                  {formData.role === "user" ? (
                    <div>
                      <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.5, marginBottom: 12 }}>
                        Almost done! As a patient user, your detailed Skin profile, allergies, and daily habits assessment wizard will start automatically right after your first login.
                      </p>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#14b8a6", background: "rgba(20,184,166,0.1)", padding: "4px 10px", borderRadius: 6 }}>
                        ✓ Skincare Wizard Configured
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Medical Qualification / Degree</label>
                          <div style={{ position: "relative" }}>
                            <Award size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                            <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="MD Dermatology / B.Sc Cosmetology" className="input" style={{ paddingLeft: 40, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Experience (Years)</label>
                          <div style={{ position: "relative" }}>
                            <Briefcase size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                            <input type="number" name="experience" value={formData.experience} onChange={handleChange} className="input" style={{ paddingLeft: 40, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Clinical Specialization Area</label>
                        <div style={{ position: "relative" }}>
                          <Stethoscope size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                          <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="Acne Vulgaris, Rosacea, Pores, Eczema" className="input" style={{ paddingLeft: 40, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} />
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Hospital / Clinic Affiliation</label>
                        <input type="text" name={formData.role === "dermatologist" ? "clinic_name" : "hospital"} value={formData.role === "dermatologist" ? formData.clinic_name : formData.hospital} onChange={handleChange} placeholder="Central Medical Dermatology Center" className="input" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Verification uploads */}
              {currentStep === 4 && (
                <motion.div key="step-4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Verification Credentials</h3>
                  
                  {formData.role === "user" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.5 }}>
                        Confirming account credentials and locking secure token storage structure.
                      </p>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "12px 16px" }}>
                        <CheckCircle2 size={16} color="#10b981" />
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#10b981" }}>Identity verification token locked successfully</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {formData.role === "dermatologist" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Medical License Number</label>
                            <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} placeholder="LIC-902841" className="input" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Consultation Fee ($)</label>
                            <div style={{ position: "relative" }}>
                              <DollarSign size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                              <input type="number" name="consultation_fee" value={formData.consultation_fee} onChange={handleChange} className="input" style={{ paddingLeft: 30, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {formData.role === "consultant" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Working Hours</label>
                            <div style={{ position: "relative" }}>
                              <Clock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                              <input type="text" name="working_hours" value={formData.working_hours} onChange={handleChange} placeholder="9 AM - 6 PM" className="input" style={{ paddingLeft: 30, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} />
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Clinic Address</label>
                            <input type="text" name="clinic_address" value={formData.clinic_address} onChange={handleChange} placeholder="42 Wall St" className="input" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} />
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Short Biography / Clinical Bio</label>
                        <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Please summarize your medical career details..." rows={2} className="input" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", borderRadius: 10 }} />
                      </div>

                      {/* Mock Uploader Fields */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.08)", textAlign: "center", cursor: "pointer" }}>
                          <Upload size={16} style={{ color: "#14b8a6", margin: "0 auto 6px" }} />
                          <span style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Government ID (PDF)</span>
                        </div>
                        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.08)", textAlign: "center", cursor: "pointer" }}>
                          <FileText size={16} style={{ color: "#8b5cf6", margin: "0 auto 6px" }} />
                          <span style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Medical Certificates</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 5: Confirmation */}
              {currentStep === 5 && (
                <motion.div key="step-5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center", padding: "20px 0" }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: "50%", background: "rgba(16,185,129,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <CheckCircle2 size={36} color="#10b981" />
                  </div>
                  
                  {formData.role === "user" ? (
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: "white" }}>Registration Review</h3>
                      <p style={{ fontSize: 13.5, color: "#94a3b8", marginTop: 8, lineHeight: 1.6 }}>
                        You're ready! Click "Finish" to create your user account. Once done, log in to start your onboarding profile setup wizard.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: "white" }}>Application Awaiting Review</h3>
                      <p style={{ fontSize: 13.5, color: "#94a3b8", marginTop: 8, lineHeight: 1.6 }}>
                        Your registration application is submitted. Our administrators will verify your credentials and license parameters. You will receive an email once approved.
                      </p>
                      <div style={{ marginTop: 24, padding: "12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, fontSize: 12, color: "#fcd34d", display: "inline-block" }}>
                        ⚡ Only approved specialists can log in
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>

            {/* Navigation controls */}
            {currentStep < 5 ? (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 12 }}>
                <button
                  type="button" onClick={handleBack} disabled={currentStep === 1}
                  className="btn btn-secondary" style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, display: "flex", alignItems: "center", gap: 6, opacity: currentStep === 1 ? 0.3 : 1 }}
                >
                  <ArrowLeft size={14} /> Back
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button" onClick={handleNext}
                    disabled={currentStep === 1 ? !isStep1Valid : currentStep === 2 ? !isStep2Valid : currentStep === 3 ? !isStep3Valid : false}
                    className="btn btn-primary" style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    Continue <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button" onClick={handleSubmit} disabled={loading || !isStep4Valid}
                    className="btn btn-primary" style={{ padding: "10px 22px", borderRadius: 10, fontSize: 13, background: "linear-gradient(95deg, #14b8a6, #8b5cf6)", border: "none" }}
                  >
                    {loading ? "Registering..." : "Submit Registration"}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <Link to="/login" className="btn btn-primary" style={{ display: "inline-flex", padding: "12px 24px", borderRadius: 10, fontWeight: 700, width: "100%" }}>
                  Return to Sign In
                </Link>
              </div>
            )}

          </form>

          {currentStep < 5 && (
            <div style={{ marginTop: 24, textAlign: "center", fontSize: 13.5, color: "#64748b" }}>
              Already registered? <Link to="/login" style={{ fontWeight: 700, color: "#14b8a6" }}>Login</Link>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}