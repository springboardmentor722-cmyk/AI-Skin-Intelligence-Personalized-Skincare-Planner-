import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../../services/auth";
import { getMyProfile } from "../../services/profile";
import { useAuth } from "../../context/AuthContext";
import { FiMail, FiLock, FiArrowRight, FiCheckCircle } from "react-icons/fi";

const SparklesIcon = ({ className = "w-4 h-4 text-amber-300" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" />
  </svg>
);

const ROLE_HOME = {
  admin: "/admin",
  consultant: "/consultant",
  dermatologist: "/dermatologist",
};

const DEMO_ACCOUNTS = [
  { role: "User", email: "test@example.com", label: "User Account" },
  { role: "Admin", email: "admin@example.com", label: "Admin" },
  { role: "Consultant", email: "consultant@example.com", label: "Consultant" },
  { role: "Dermatologist", email: "derma@example.com", label: "Dermatologist" },
];

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleQuickFill = (email) => {
    setFormData({
      username: email,
      password: "password123",
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser(formData);
      const decoded = login(res.data.access_token);

      const roleHome = ROLE_HOME[decoded?.role];
      if (roleHome) {
        navigate(roleHome);
        return;
      }

      try {
        await getMyProfile();
        navigate("/dashboard");
      } catch (err) {
        if (err.response?.status === 404) {
          navigate("/create-profile");
        } else {
          setError("Unable to verify profile. Please try again.");
        }
      }
    } catch (err) {
      if (!err.response) {
        setError("Unable to connect to backend server. Please verify network or API settings.");
      } else {
        const detail = err.response.data?.detail;
        if (typeof detail === "string") {
          setError(detail);
        } else if (Array.isArray(detail)) {
          setError(detail.map((item) => item.msg || JSON.stringify(item)).join("; "));
        } else {
          setError(err.response.data?.message || "Login failed. Please check your credentials.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute top-12 left-12 w-72 h-72 bg-purple-400/25 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-12 right-12 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass w-full max-w-[960px] overflow-hidden grid grid-cols-1 lg:grid-cols-2 rounded-3xl shadow-2xl border border-purple-200/60 animate-in">
        
        {/* Left Side: Lavender Aesthetic Product Hero */}
        <div className="relative hidden lg:flex flex-col justify-between p-8 bg-gradient-to-b from-purple-900/30 to-purple-950/60 text-white overflow-hidden min-h-[580px]">
          <img
            src="/images/purple-auth-hero.png"
            alt="Skin AI Botanical Skincare"
            className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700 hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/80 via-purple-900/20 to-transparent"></div>

          {/* Top Brand Pill */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-white text-xs font-semibold tracking-wide">
              <SparklesIcon className="w-4 h-4 text-amber-300" />
              <span>Skin AI • Lavender Luxe</span>
            </div>
          </div>

          {/* Bottom Card Copy */}
          <div className="relative z-10 space-y-3">
            <span className="inline-block px-3 py-1 bg-purple-500/40 backdrop-blur-md border border-purple-300/40 rounded-full text-xs font-medium text-purple-100">
              Personalized Botanical Skincare
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight font-display">
              Gentle Intelligence for Radiantly Healthy Skin
            </h2>
            <p className="text-purple-100/90 text-sm leading-relaxed">
              Experience AI-driven skin assessments, botanical hydration analysis, and custom dermatologist recommendations.
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs font-medium text-purple-200">
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="text-purple-300" />
                <span>AI Skin Analysis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="text-purple-300" />
                <span>Derma Routines</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center bg-white/70 backdrop-blur-xl">
          <div className="mb-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-3">
              <SparklesIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>Welcome Back</span>
            </div>
            <h1 className="text-3xl font-bold text-purple-950 font-display">
              Sign in to Skin AI
            </h1>
            <p className="text-purple-700/70 text-sm mt-1">
              Enter your credentials to access your skincare dashboard
            </p>
          </div>

          {/* Quick Login Pill Shortcuts */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-purple-800/80 mb-2 uppercase tracking-wider">
              Quick Demo Accounts
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickFill(acc.email)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    formData.username === acc.email
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/30 scale-105"
                      : "bg-purple-100/80 text-purple-800 hover:bg-purple-200"
                  }`}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center animate-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                <FiMail />
              </div>
              <input
                type="email"
                name="username"
                placeholder="Email address"
                value={formData.username}
                onChange={handleChange}
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
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="field pl-10"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-purple-900/80 font-medium">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-purple-600 focus:ring-purple-500 border-purple-300"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-purple-700 font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base mt-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight className="text-lg" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-purple-900/70 mt-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-purple-700 font-bold hover:underline">
              Create account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;


