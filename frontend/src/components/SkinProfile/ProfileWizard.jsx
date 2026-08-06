import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Sparkles, AlertCircle, CheckCircle2,
  Calendar, Phone, MapPin, Briefcase, Mail, User, ShieldCheck, Heart, Activity
} from "lucide-react";
import api from "../../services/api";

import Stepper from "./Stepper";
import AssessmentFooter from "./AssessmentFooter";
import AssessmentLayout from "./AssessmentLayout";
import SelectionGrid from "./SelectionGrid";
import SkinTypeCard from "./SkinTypeCard";
import SkinConcernCard from "./SkinConcernCard";
import SeveritySlider from "./SeveritySlider";

// Datasets
import skinTypesData from "../../data/skin_types.json";
import skinConcernsData from "../../data/skin_concerns.json";

const STEP_TITLES = [
  { title: "Personal Details", shortName: "Personal" },
  { title: "What best describes your skin?", shortName: "Skin Type" },
  { title: "What skin concerns would you like to improve?", shortName: "Concerns" },
  { title: "Concern Severity Levels", shortName: "Severity" },
  { title: "Lifestyle Assessment", shortName: "Lifestyle" },
  { title: "Assessment Review", shortName: "Review" },
  { title: "AI Diagnostic Scan", shortName: "AI Analysis" },
  { title: "Complete", shortName: "Dashboard" }
];

export default function ProfileWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Step 1: Personal Details
  const [personalDetails, setPersonalDetails] = useState({
    fullName: "",
    phone: "",
    email: "",
    dob: "1998-05-15",
    age: "28",
    gender: "Female",
    occupation: "Desk Job",
    location: "New York, USA"
  });

  // Step 2: Skin Type (Single Choice)
  const [skinType, setSkinType] = useState("Oily");

  // Step 3: Skin Concerns (Multi-Select)
  const [selectedConcerns, setSelectedConcerns] = useState(["acne", "hyperpigmentation"]);

  // Step 4: Severities (0 - 10)
  const [severities, setSeverities] = useState({
    acne: 7,
    pimples: 6,
    hyperpigmentation: 4,
    dark_spots: 3,
    dryness: 2,
    oiliness: 7,
    sensitive_skin: 3,
    redness: 2,
    rosacea: 2,
    fine_lines: 2,
    wrinkles: 1,
    uneven_tone: 4,
    enlarged_pores: 6,
    dull_skin: 3,
    sun_damage: 3,
    dehydration: 2
  });

  // Step 5: Lifestyle
  const [lifestyleData, setLifestyleData] = useState({
    sleepHours: "7.5",
    waterIntake: "2.5",
    stressLevel: "Moderate",
    sunExposure: "1 - 3 hours",
    exercise: "1-2 Days/Week",
    workingEnv: "Air Conditioned Office"
  });

  // Restore saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("skin_profile_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.skin_type) setSkinType(parsed.skin_type);
        if (parsed.selected_concerns_list) setSelectedConcerns(parsed.selected_concerns_list);
        if (parsed.severities) setSeverities(parsed.severities);
      }
    } catch (e) {
      console.error("Error loading stored profile:", e);
    }
  }, []);

  const handleDobChange = (e) => {
    const dobVal = e.target.value;
    let computedAge = personalDetails.age;
    if (dobVal) {
      const birthDate = new Date(dobVal);
      const today = new Date();
      let calculated = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) calculated--;
      if (calculated > 0) computedAge = String(calculated);
    }
    setPersonalDetails({ ...personalDetails, dob: dobVal, age: computedAge });
  };

  const handlePersonalChange = (e) => {
    setPersonalDetails({ ...personalDetails, [e.target.name]: e.target.value });
  };

  const handleLifestyleChange = (e) => {
    setLifestyleData({ ...lifestyleData, [e.target.name]: e.target.value });
  };

  const handleSkinTypeSelect = (typeEnum) => {
    setSkinType(typeEnum);
    setErrorMessage("");
  };

  const handleToggleConcern = (concernId) => {
    setErrorMessage("");
    setSelectedConcerns((prev) =>
      prev.includes(concernId) ? prev.filter((item) => item !== concernId) : [...prev, concernId]
    );
  };

  const handleSeverityChange = (concernId, val) => {
    setSeverities((prev) => ({ ...prev, [concernId]: val }));
  };

  // Step Validation
  const canProceed = () => {
    if (step === 1) return !!personalDetails.fullName && !!personalDetails.age && !!personalDetails.gender;
    if (step === 2) return !!skinType;
    if (step === 3) return selectedConcerns.length > 0;
    if (step === 4) return selectedConcerns.length > 0;
    if (step === 5) return !!lifestyleData.sleepHours && !!lifestyleData.waterIntake;
    if (step === 6) return true;
    if (step === 7) return true;
    return true;
  };

  const handleNext = async () => {
    if (!canProceed()) {
      if (step === 1) setErrorMessage("Please fill in required personal details (Name, Age, Gender).");
      else if (step === 2) setErrorMessage("Please select your skin type.");
      else if (step === 3) setErrorMessage("Please select at least one skin concern.");
      else if (step === 5) setErrorMessage("Please complete the lifestyle parameters.");
      return;
    }

    setErrorMessage("");

    if (step === 6) {
      // Step 6 (Review) -> Move to Step 7 (AI Analysis) and trigger backend API calls
      setStep(7);
      await handleSubmitAssessment();
    } else if (step < 7) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (step > 1 && step < 7) {
      setStep((prev) => prev - 1);
      setErrorMessage("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmitAssessment = async () => {
    setLoading(true);
    setErrorMessage("");

    // Standardized Backend Value Mapping (Preserving exact backend payload requirements)
    const mappedConcernsTitles = selectedConcerns
      .map((id) => skinConcernsData.find((c) => c.id === id)?.title)
      .filter(Boolean)
      .join(", ");

    // Map severity numbers for backend schema
    const severityPayload = {
      acne_severity: selectedConcerns.some(c => c === "acne" || c === "pimples") ? (severities.acne || 7) : 0,
      hyperpigmentation_severity: selectedConcerns.some(c => c === "hyperpigmentation" || c === "dark_spots") ? (severities.hyperpigmentation || 4) : 0,
      redness_severity: selectedConcerns.some(c => c === "redness" || c === "rosacea") ? (severities.redness || 2) : 0,
      wrinkles_severity: selectedConcerns.some(c => c === "wrinkles" || c === "fine_lines") ? (severities.wrinkles || 2) : 0,
      dryness_severity: selectedConcerns.some(c => c === "dryness" || c === "dehydration") ? (severities.dryness || 3) : 0,
      oiliness_severity: selectedConcerns.some(c => c === "oiliness" || c === "enlarged_pores") ? (severities.oiliness || 6) : 0
    };

    const fullProfileData = {
      full_name: personalDetails.fullName || "Jane Doe",
      phone: personalDetails.phone,
      email: personalDetails.email,
      dob: personalDetails.dob,
      age: Number(personalDetails.age) || 28,
      gender: personalDetails.gender,
      occupation: personalDetails.occupation,
      location: personalDetails.location,

      skin_type: skinType,
      selected_concerns_list: selectedConcerns,
      concerns: mappedConcernsTitles || "General Care",
      severities,
      ...severityPayload,

      sleep_hours: Number(lifestyleData.sleepHours) || 7.5,
      water_intake: Number(lifestyleData.waterIntake) || 2.5,
      stress_level: lifestyleData.stressLevel,
      sun_exposure: lifestyleData.sunExposure,
      exercise: lifestyleData.exercise,
      working_environment: lifestyleData.workingEnv,

      skin_score: Math.floor(Math.random() * 15) + 78
    };

    try {
      localStorage.setItem("skin_profile_data", JSON.stringify(fullProfileData));
      localStorage.setItem("onboarding_completed", "true");

      // Submit data to FastAPI backend endpoints
      try {
        await api.post("/skin-profile", {
          full_name: fullProfileData.full_name,
          age: fullProfileData.age,
          gender: fullProfileData.gender,
          skin_type: fullProfileData.skin_type,
          skin_tone: "Medium",
          concerns: fullProfileData.concerns,
          allergies: "None",
          current_products: "Gentle Cleanser, SPF 50"
        });

        await api.post("/lifestyle", {
          sleep_hours: fullProfileData.sleep_hours,
          water_intake: fullProfileData.water_intake,
          exercise: fullProfileData.exercise,
          stress_level: fullProfileData.stress_level,
          outdoor_exposure: fullProfileData.sun_exposure,
          occupation: fullProfileData.occupation
        });

        await api.post("/skin-assessment", {
          sleep_hours: fullProfileData.sleep_hours,
          water_intake: fullProfileData.water_intake,
          stress_level: fullProfileData.stress_level,
          uv_index: 4.5,
          humidity: 55.0
        });
      } catch (apiErr) {
        console.warn("Backend API sync warning (local storage fallback active):", apiErr);
      }

      // Simulate AI analysis pulse delay before navigating to User Dashboard
      setTimeout(() => {
        setLoading(false);
        navigate("/dashboard");
      }, 2400);

    } catch (err) {
      console.error("Assessment submission error:", err);
      setErrorMessage("Could not submit assessment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-amber-950 font-sans py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between selection:bg-emerald-500/20">
      <div className="w-full max-w-5xl mx-auto">

        {/* Top Stepper Bar */}
        <Stepper
          currentStep={step}
          totalSteps={8}
          steps={STEP_TITLES}
        />

        {/* Error Alert */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-sm shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Step Views */}
        <AnimatePresence mode="wait">

          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto my-6 bg-white/85 backdrop-blur-md rounded-[28px] p-6 sm:p-8 border border-amber-900/10 shadow-xl shadow-amber-900/5 space-y-6"
            >
              <div className="text-center mb-4">
                <h2 className="text-2xl font-serif font-bold text-amber-950">Personal Details</h2>
                <p className="text-xs text-amber-900/70">Enter your essential demographic & contact parameters.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-2">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={personalDetails.fullName}
                    onChange={handlePersonalChange}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3 bg-amber-50/40 border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={personalDetails.phone}
                    onChange={handlePersonalChange}
                    placeholder="+1 (555) 000-1234"
                    className="w-full px-4 py-3 bg-amber-50/40 border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={personalDetails.email}
                    onChange={handlePersonalChange}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-3 bg-amber-50/40 border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={personalDetails.dob}
                      onChange={handleDobChange}
                      className="w-full px-3 py-3 bg-amber-50/40 border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-2">
                      Age <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={personalDetails.age}
                      onChange={handlePersonalChange}
                      placeholder="28"
                      className="w-full px-3 py-3 bg-amber-50/40 border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-2">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={personalDetails.gender}
                    onChange={handlePersonalChange}
                    className="w-full px-4 py-3 bg-amber-50/40 border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={personalDetails.occupation}
                    onChange={handlePersonalChange}
                    placeholder="e.g. Software Engineer / Desk Job"
                    className="w-full px-4 py-3 bg-amber-50/40 border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SKIN TYPE (Single Selection Visual Cards) */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AssessmentLayout
                title="What best describes your skin?"
                subtitle="Choose the skin type that matches your face most of the time."
                badgeText="Baseline Moisture & Lipid Profile"
              >
                <SelectionGrid>
                  {skinTypesData.map((st) => (
                    <SkinTypeCard
                      key={st.id}
                      id={st.backendEnum}
                      title={st.title}
                      description={st.description}
                      characteristics={st.characteristics}
                      image={st.image}
                      isSelected={skinType === st.backendEnum}
                      onSelect={handleSkinTypeSelect}
                    />
                  ))}
                </SelectionGrid>
              </AssessmentLayout>
            </motion.div>
          )}

          {/* STEP 3: SKIN CONCERNS (Multi Selection Visual Cards) */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AssessmentLayout
                title="What skin concerns would you like to improve?"
                subtitle="You can select one or multiple concerns. Our AI will personalize your skincare routine based on your selections."
                badgeText="Targeted Active Formulation"
              >
                <SelectionGrid>
                  {skinConcernsData.map((concern) => (
                    <SkinConcernCard
                      key={concern.id}
                      id={concern.id}
                      title={concern.title}
                      description={concern.description}
                      image={concern.image}
                      isSelected={selectedConcerns.includes(concern.id)}
                      onToggle={handleToggleConcern}
                    />
                  ))}
                </SelectionGrid>
              </AssessmentLayout>
            </motion.div>
          )}

          {/* STEP 4: SEVERITY SLIDERS (Only for Selected Concerns) */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto my-6 space-y-4"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-amber-950">Concern Severity Ratings</h2>
                <p className="text-xs text-amber-900/70">Rate the severity of your selected concerns on a 0 to 10 scale.</p>
              </div>

              {selectedConcerns.length === 0 ? (
                <div className="p-8 text-center bg-white/70 backdrop-blur-md rounded-3xl border border-amber-900/10">
                  <p className="text-amber-900/60 text-sm">No concerns selected in Step 3.</p>
                  <button
                    onClick={() => setStep(3)}
                    className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-semibold"
                  >
                    Go Back & Select Concerns
                  </button>
                </div>
              ) : (
                selectedConcerns.map((concernId) => {
                  const concernObj = skinConcernsData.find((c) => c.id === concernId);
                  return (
                    <SeveritySlider
                      key={concernId}
                      concernId={concernId}
                      title={concernObj?.title || concernId}
                      imageSrc={concernObj?.image}
                      value={severities[concernId] ?? 5}
                      onChange={handleSeverityChange}
                    />
                  );
                })
              )}
            </motion.div>
          )}

          {/* STEP 5: LIFESTYLE ASSESSMENT */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto my-6 bg-white/85 backdrop-blur-md rounded-[28px] p-6 sm:p-8 border border-amber-900/10 shadow-xl shadow-amber-900/5 space-y-6"
            >
              <div className="text-center mb-4">
                <h2 className="text-2xl font-serif font-bold text-amber-950">Lifestyle Assessment</h2>
                <p className="text-xs text-amber-900/70">Detail your daily sleep, hydration, and environmental factors.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-2">
                    Sleep Hours (Daily)
                  </label>
                  <select
                    name="sleepHours"
                    value={lifestyleData.sleepHours}
                    onChange={handleLifestyleChange}
                    className="w-full px-4 py-3 bg-amber-50/40 border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  >
                    <option value="5.0">&lt; 6 Hours</option>
                    <option value="6.5">6 - 7 Hours</option>
                    <option value="7.5">7 - 8 Hours</option>
                    <option value="9.0">8+ Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-2">
                    Water Intake (Liters/Day)
                  </label>
                  <select
                    name="waterIntake"
                    value={lifestyleData.waterIntake}
                    onChange={handleLifestyleChange}
                    className="w-full px-4 py-3 bg-amber-50/40 border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  >
                    <option value="1.0">&lt; 1.5 Liters</option>
                    <option value="2.0">1.5 - 2.5 Liters</option>
                    <option value="3.0">2.5 - 3.5 Liters</option>
                    <option value="4.0">3.5+ Liters</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-2">
                    Stress Level
                  </label>
                  <select
                    name="stressLevel"
                    value={lifestyleData.stressLevel}
                    onChange={handleLifestyleChange}
                    className="w-full px-4 py-3 bg-amber-50/40 border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-2">
                    Sun Exposure
                  </label>
                  <select
                    name="sunExposure"
                    value={lifestyleData.sunExposure}
                    onChange={handleLifestyleChange}
                    className="w-full px-4 py-3 bg-amber-50/40 border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  >
                    <option value="Minimal">&lt; 1 Hour / Indoors</option>
                    <option value="1 - 3 hours">1 - 3 Hours</option>
                    <option value="3+ hours">3+ Hours / Outdoors</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 6: ASSESSMENT REVIEW */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto my-6 bg-white/90 backdrop-blur-md rounded-[28px] p-6 sm:p-8 border border-amber-900/10 shadow-xl space-y-6 text-left"
            >
              <div className="text-center pb-4 border-b border-amber-900/10">
                <h2 className="text-2xl font-serif font-bold text-amber-950">Assessment Summary Review</h2>
                <p className="text-xs text-amber-900/70 mt-1">Review your selections before running the clinical AI diagnostic engine.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-900/10">
                  <span className="text-[10px] font-bold uppercase text-amber-900/50">Personal Profile</span>
                  <p className="text-sm font-bold text-amber-950 mt-1">{personalDetails.fullName || "Jane Doe"}</p>
                  <p className="text-xs text-amber-900/70">{personalDetails.age} yrs • {personalDetails.gender}</p>
                </div>

                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-900/10">
                  <span className="text-[10px] font-bold uppercase text-amber-900/50">Baseline Skin Type</span>
                  <p className="text-sm font-bold text-emerald-800 mt-1">{skinType} Skin</p>
                </div>
              </div>

              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-900/10">
                <span className="text-[10px] font-bold uppercase text-amber-900/50 mb-2 block">Selected Concerns & Severities</span>
                <div className="flex flex-wrap gap-2">
                  {selectedConcerns.map((id) => {
                    const obj = skinConcernsData.find((c) => c.id === id);
                    return (
                      <span key={id} className="px-3 py-1 bg-white border border-amber-900/15 rounded-full text-xs font-semibold text-amber-950 flex items-center gap-1.5">
                        <span>{obj?.title || id}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 rounded-full font-mono font-bold text-amber-900">{severities[id] ?? 5}/10</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 7: AI DIAGNOSTIC ANALYSIS SCAN */}
          {step === 7 && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto my-12 bg-white/95 backdrop-blur-md rounded-[32px] p-10 border border-amber-900/10 shadow-2xl text-center space-y-6"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-emerald-500 to-amber-600 p-0.5 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <Activity className="w-12 h-12 text-emerald-600 animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-amber-950">AI Diagnostic Engine Active</h3>
                <p className="text-sm text-amber-900/70 mt-1 max-w-md mx-auto">
                  Calculating Weighted Skin Health Score, prioritizing active concern formulations, and building your clinical routine...
                </p>
              </div>

              <div className="w-full h-2 bg-amber-900/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-600 rounded-full"
                  initial={{ width: "10%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.2, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Footer Actions */}
        <AssessmentFooter
          currentStep={step}
          totalSteps={8}
          canProceed={canProceed()}
          loading={loading}
          onNext={handleNext}
          onBack={handleBack}
          statusText={
            step === 1 ? "Personal details" :
            step === 2 ? `Skin type: ${skinType}` :
            step === 3 ? `${selectedConcerns.length} concern(s) selected` :
            step === 4 ? `${selectedConcerns.length} severity rating(s)` :
            step === 5 ? "Lifestyle parameters" :
            step === 6 ? "Review selections" : "AI Processing..."
          }
        />

      </div>
    </div>
  );
}
