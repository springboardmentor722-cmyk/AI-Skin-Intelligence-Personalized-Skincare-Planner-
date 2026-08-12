import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../../services/auth";
import { getMyProfile } from "../../services/profile";
import { useAuth } from "../../context/AuthContext";

// Where each role lands right after login. Add consultant/dermatologist
// here once those dashboards exist — until then they fall through to
// the default "user" branch below.
const ROLE_HOME = {
  admin: "/admin",
  consultant: "/consultant",
  dermatologist: "/dermatologist",
};

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await loginUser(formData);
      const decoded = login(res.data.access_token);

      const roleHome = ROLE_HOME[decoded?.role];
      if (roleHome) {
        navigate(roleHome);
        return;
      }

      // Default "user" flow: does a profile already exist?
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
      setError(err.response?.data?.detail || "Login failed. Check your email and password.");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center px-4 gap-8">
      <div className="hidden lg:block w-full max-w-[420px] h-[600px] rounded-2xl overflow-hidden">
        <img src="/images/auth-hero.png" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="glass w-full max-w-[420px] p-10">
        <h1 className="text-3xl font-semibold mb-8 text-center">Login</h1>

        {error && (
          <p className="pill pill-flagged mb-4 w-full text-center py-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="username"
            placeholder="Email"
            value={formData.username}
            onChange={handleChange}
            className="field"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="field"
            required
          />

          <button
            type="submit"
            className="w-full bg-ocean-500 hover:bg-ocean-600 text-white py-3 rounded-xl font-medium transition"
          >
            Login
          </button>
        </form>

        <p className="text-center text-sm mt-3">
          <Link to="/forgot-password" className="text-ocean-600 font-medium">Forgot password?</Link>
        </p>

        <p className="text-ink-secondary mt-6 text-center text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-ocean-600 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
