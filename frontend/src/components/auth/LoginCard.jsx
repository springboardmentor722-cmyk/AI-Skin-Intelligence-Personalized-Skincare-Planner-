import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

import { loginUser } from "../../services/authService";
import api from "../../services/api";

export default function LoginCard() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const data = await loginUser(email, password);

      localStorage.setItem("token", data.access_token);

      const profile = await api.get("/auth/profile");

      localStorage.setItem("role", profile.data.role);

      const role = profile.data.role;

      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "consultant") {
        navigate("/consultant/dashboard");
      } else if (role === "dermatologist") {
        navigate("/dermatologist/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      if (error.response) {
        alert(error.response.data.detail);
      } else {
        alert("Login Failed");
      }
    }
  };

  return (
    <div className="w-full max-w-[480px] bg-white/80 backdrop-blur-2xl border border-white rounded-[34px] shadow-[0_30px_80px_rgba(0,0,0,0.12)] px-10 py-12">

      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-700 to-emerald-500 flex items-center justify-center shadow-xl">
          <ShieldCheck size={36} className="text-white" />
        </div>
      </div>

      <h2 className="text-4xl font-bold text-center mt-8 text-gray-900">
        Welcome Back
      </h2>

      <p className="text-center text-gray-500 mt-3 mb-10">
        Continue your personalized skincare journey.
      </p>

      <form onSubmit={handleLogin} className="space-y-6">

        {/* Email */}

        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Email Address
          </label>

          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              className="w-full h-14 rounded-2xl border border-gray-200 bg-white pl-12 pr-4 focus:ring-2 focus:ring-green-500 outline-none transition"
            />
          </div>
        </div>

        {/* Password */}

        <div>

          <label className="block mb-2 font-semibold text-gray-700">
            Password
          </label>

          <div className="relative">

            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              className="w-full h-14 rounded-2xl border border-gray-200 bg-white pl-12 pr-12 focus:ring-2 focus:ring-green-500 outline-none transition"
            />

            <button
              type="button"
              onClick={()=>setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>

          </div>

        </div>

        <div className="flex justify-between text-sm">

          <label className="flex items-center gap-2 text-gray-600">
            <input
              type="checkbox"
              className="accent-green-600"
            />
            Remember Me
          </label>

          <button
            type="button"
            className="text-green-700 hover:underline"
          >
            Forgot Password?
          </button>

        </div>

        <button
          type="submit"
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-green-700 to-emerald-500 text-white text-lg font-semibold shadow-xl hover:scale-[1.02] transition"
        >
          ✨ Sign In
        </button>

        <div className="flex items-center gap-4">

          <div className="flex-1 h-px bg-gray-300"></div>

          <span className="text-gray-400 text-sm">
            OR
          </span>

          <div className="flex-1 h-px bg-gray-300"></div>

        </div>

        <div className="grid grid-cols-3 gap-3">

          <button
            type="button"
            className="h-14 rounded-2xl border hover:bg-gray-50 transition"
          >
            Google
          </button>

          <button
            type="button"
            className="h-14 rounded-2xl border hover:bg-gray-50 transition"
          >
            Apple
          </button>

          <button
            type="button"
            className="h-14 rounded-2xl border hover:bg-gray-50 transition"
          >
            Facebook
          </button>

        </div>

        <p className="text-center text-gray-600">

          Don't have an account?{" "}

          <Link
            to="/register"
            className="text-green-700 font-semibold hover:underline"
          >
            Create Account
          </Link>

        </p>

      </form>

    </div>
  );
}