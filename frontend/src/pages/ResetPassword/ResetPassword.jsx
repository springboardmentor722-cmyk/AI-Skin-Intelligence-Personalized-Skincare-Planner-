import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../../services/auth";
import { FiKey, FiLock } from "react-icons/fi";

const SparklesIcon = ({ className = "w-4 h-4 text-purple-600" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" />
  </svg>
);

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute top-12 right-12 w-72 h-72 bg-purple-400/25 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass w-full max-w-[460px] p-8 lg:p-10 rounded-3xl shadow-2xl border border-purple-200/60 animate-in bg-white/75 backdrop-blur-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-3">
            <SparklesIcon className="w-3.5 h-3.5 text-purple-600" />
            <span>Reset Credentials</span>
          </div>
          <h1 className="text-2xl font-bold text-purple-950 font-display">Create New Password</h1>
          <p className="text-purple-700/70 text-sm mt-1">
            Set a new secure password for your account
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
              <FiKey />
            </div>
            <input
              type="text"
              placeholder="Reset token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
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
              placeholder="New secure password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="field pl-10"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
            {loading ? "Resetting..." : "Save New Password"}
          </button>
        </form>

        <p className="text-center text-sm text-purple-900/70 mt-6">
          <Link to="/login" className="text-purple-700 font-bold hover:underline">
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;


