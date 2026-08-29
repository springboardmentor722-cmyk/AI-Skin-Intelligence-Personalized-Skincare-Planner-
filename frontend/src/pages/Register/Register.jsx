import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { registerUser } from "../../services/auth";
import { FiUser, FiMail, FiLock, FiArrowRight, FiCheckCircle, FiShield } from "react-icons/fi";

const SparklesIcon = ({ className = "w-4 h-4 text-amber-300" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" />
  </svg>
);

const ROLE_OPTIONS = [
  { value: "user", label: "User (Skincare Consumer)" },
  { value: "consultant", label: "Skincare Consultant" },
  { value: "dermatologist", label: "Dermatologist" },
  { value: "admin", label: "System Administrator" },
];

function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "user",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerUser(formData);
      navigate("/login");
    } catch (err) {
      if (!err.response) {
        setError("Unable to connect to backend server. Please verify network or API settings.");
      } else {
        const detail = err.response.data?.detail;
        if (typeof detail === "string") {
          setError(detail);
        } else if (Array.isArray(detail)) {
          const msgs = detail.map((item) => item.msg || JSON.stringify(item)).join("; ");
          setError(msgs || "Registration failed due to invalid form data.");
        } else if (typeof detail === "object" && detail !== null) {
          setError(detail.message || JSON.stringify(detail));
        } else {
          setError(err.response.data?.message || "Registration failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute top-12 right-12 w-80 h-80 bg-purple-400/25 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-12 left-12 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass w-full max-w-[960px] overflow-hidden grid grid-cols-1 lg:grid-cols-2 rounded-3xl shadow-2xl border border-purple-200/60 animate-in">
        
        {/* Left Side: Lavender Aesthetic Product Hero */}
        <div className="relative hidden lg:flex flex-col justify-between p-8 bg-gradient-to-b from-purple-900/30 to-purple-950/60 text-white overflow-hidden min-h-[620px]">
          <img
            src="/images/purple-auth-hero.png"
            alt="Skin AI Botanical Care"
            className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700 hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/85 via-purple-900/30 to-transparent"></div>

          {/* Top Brand Pill */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-white text-xs font-semibold tracking-wide">
              <SparklesIcon className="w-4 h-4 text-amber-300" />
              <span>Skin AI • Botanical Intelligence</span>
            </div>
          </div>

          {/* Bottom Card Copy */}
          <div className="relative z-10 space-y-3">
            <span className="inline-block px-3 py-1 bg-purple-500/40 backdrop-blur-md border border-purple-300/40 rounded-full text-xs font-medium text-purple-100">
              Start Your Skincare Journey
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight font-display">
              Unveil Your Natural Glow with AI Precision
            </h2>
            <p className="text-purple-100/90 text-sm leading-relaxed">
              Create an account to receive AI skin condition mapping, custom ingredient analysis, and clinical care connection.
            </p>

            <div className="pt-2 flex flex-col gap-2 text-xs font-medium text-purple-200">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-purple-300" />
                <span>Instant Face & Barrier Condition Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-purple-300" />
                <span>Dermatologist & Consultant Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center bg-white/70 backdrop-blur-xl">
          <div className="mb-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-3">
              <SparklesIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>New Account</span>
            </div>
            <h1 className="text-3xl font-bold text-purple-950 font-display">
              Create Your Account
            </h1>
            <p className="text-purple-700/70 text-sm mt-1">
              Join Skin AI to personalize your skincare routine
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center animate-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                <FiUser />
              </div>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Full name"
                className="field pl-10"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                <FiMail />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                className="field pl-10"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                <FiLock />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="field pl-10"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                <FiShield />
              </div>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="field pl-10 appearance-none bg-white/80 cursor-pointer"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base mt-2"
            >
              {loading ? (
                <span>Registering...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <FiArrowRight className="text-lg" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-purple-900/70 mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-700 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Register;


