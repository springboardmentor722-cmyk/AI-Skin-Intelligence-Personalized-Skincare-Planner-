import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { registerUser } from "../../services/auth";

const ROLE_OPTIONS = [
  { value: "user", label: "User (skincare consumer)" },
  { value: "consultant", label: "Skincare consultant" },
  { value: "dermatologist", label: "Dermatologist" },
  { value: "admin", label: "Admin" },
];

function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

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

    try {
      await registerUser(formData);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center px-4 gap-8">
      <div className="hidden lg:block w-full max-w-[420px] h-[600px] rounded-2xl overflow-hidden">
        <img src="/images/auth-hero.png" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="glass w-full max-w-[420px] p-10">
        <h1 className="text-3xl font-semibold mb-8 text-center">Create account</h1>

        {error && (
          <p className="pill pill-flagged mb-4 w-full text-center py-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Full name"
            className="field"
            required
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="field"
            required
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="field"
            required
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="field"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <button
            type="submit"
            className="w-full bg-ocean-500 hover:bg-ocean-600 text-white py-3 rounded-xl font-medium transition"
          >
            Register
          </button>
        </form>

        <p className="text-ink-secondary mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-ocean-600 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
