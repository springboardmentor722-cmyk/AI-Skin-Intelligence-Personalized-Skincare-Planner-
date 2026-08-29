import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/auth";
import { FiMail, FiArrowRight } from "react-icons/fi";

const SparklesIcon = ({ className = "w-4 h-4 text-purple-600" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" />
  </svg>
);

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devToken, setDevToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.data.message);
      if (res.data.dev_reset_token) setDevToken(res.data.dev_reset_token);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute top-12 left-12 w-72 h-72 bg-purple-400/25 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass w-full max-w-[460px] p-8 lg:p-10 rounded-3xl shadow-2xl border border-purple-200/60 animate-in bg-white/75 backdrop-blur-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-3">
            <SparklesIcon className="w-3.5 h-3.5 text-purple-600" />
            <span>Password Recovery</span>
          </div>
          <h1 className="text-2xl font-bold text-purple-950 font-display">Forgot Password</h1>
          <p className="text-purple-700/70 text-sm mt-1">
            Enter your email to receive a password reset code
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 rounded-xl bg-purple-100 border border-purple-200 text-purple-800 text-xs font-medium text-center">
            {message}
          </div>
        )}

        {devToken && (
          <div className="mb-4 p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 break-all space-y-2">
            <strong className="text-purple-700">Dev mode active</strong> — reset token generated:
            <div className="bg-white p-2 rounded border border-purple-200 font-mono text-[11px] select-all">
              {devToken}
            </div>
            <Link
              to={`/reset-password?token=${devToken}`}
              className="inline-flex items-center gap-1 text-purple-700 font-bold hover:underline pt-1"
            >
              <span>Continue to reset password</span>
              <FiArrowRight />
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
              <FiMail />
            </div>
            <input
              type="email"
              placeholder="Your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field pl-10"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
            {loading ? "Sending link..." : "Send Reset Link"}
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

export default ForgotPassword;


