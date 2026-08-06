import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/authService";

import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Users,
  UserPlus,
} from "lucide-react";
export default function RegisterCard() {

const navigate = useNavigate();

const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const [formData, setFormData] = useState({
  full_name: "",
  email: "",
  password: "",
  confirmPassword: "",
  age: "",
  gender: "",
});

const [loading, setLoading] = useState(false);

const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        age: Number(formData.age),
        gender: formData.gender
      });

      alert("Registration Successful!");

      navigate("/login");

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
        "Registration Failed"
      );
    } finally {
      setLoading(false);
    }
}

  return (

<div className="w-full max-w-[480px] bg-white/80 backdrop-blur-2xl border border-white rounded-[34px] shadow-[0_30px_80px_rgba(0,0,0,0.12)] px-10 py-10">

    {/* Icon */}

    <div className="flex justify-center">

        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-700 to-emerald-500 flex items-center justify-center shadow-xl">

            <UserPlus size={36} className="text-white"/>

        </div>

    </div>

    <h2 className="text-4xl font-bold text-center mt-8 text-gray-900">

        Create Account

    </h2>

    <p className="text-center text-gray-500 mt-3 mb-10">

        Start your personalized skincare journey.

    </p>

<form
onSubmit={handleRegister}
className="space-y-5"
>

<div>
  <label className="block mb-2 font-semibold text-gray-700">
    Full Name
  </label>

  <div className="relative">

    <User
      size={20}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
    />

    <input
      type="text"
      name="full_name"
      placeholder="Enter your full name"
      value={formData.full_name}
      onChange={handleChange}
      required
      className="w-full h-14 rounded-2xl border border-gray-200 bg-white pl-12 pr-4 focus:ring-2 focus:ring-green-500 outline-none transition"
    />

  </div>
</div>

<div>
  <label className="block mb-2 font-semibold text-gray-700">
    Email Address
  </label>

  <div className="relative">

    <Mail
      size={20}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
    />

    <input
      type="email"
      name="email"
      placeholder="Enter your email"
      value={formData.email}
      onChange={handleChange}
      required
      className="w-full h-14 rounded-2xl border border-gray-200 bg-white pl-12 pr-4 focus:ring-2 focus:ring-green-500 outline-none transition"
    />

  </div>
</div>

<div>

  <label className="block mb-2 font-semibold text-gray-700">
    Password
  </label>

  <div className="relative">

    <Lock
      size={20}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
    />

    <input
      type={showPassword ? "text" : "password"}
      name="password"
      placeholder="Create Password"
      value={formData.password}
      onChange={handleChange}
      required
      className="w-full h-14 rounded-2xl border border-gray-200 bg-white pl-12 pr-12 focus:ring-2 focus:ring-green-500 outline-none transition"
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-4 top-1/2 -translate-y-1/2"
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>

  </div>

</div>

<div>

  <label className="block mb-2 font-semibold text-gray-700">
    Confirm Password
  </label>

  <div className="relative">

    <Lock
      size={20}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
    />

    <input
      type={showConfirmPassword ? "text" : "password"}
      name="confirmPassword"
      placeholder="Confirm Password"
      value={formData.confirmPassword}
      onChange={handleChange}
      required
      className="w-full h-14 rounded-2xl border border-gray-200 bg-white pl-12 pr-12 focus:ring-2 focus:ring-green-500 outline-none transition"
    />

    <button
      type="button"
      onClick={() =>
        setShowConfirmPassword(!showConfirmPassword)
      }
      className="absolute right-4 top-1/2 -translate-y-1/2"
    >
      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>

  </div>

</div>

<div className="grid grid-cols-2 gap-4">

  {/* Age */}

  <div>

    <label className="block mb-2 font-semibold text-gray-700">
      Age
    </label>

    <div className="relative">

      <Calendar
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        type="number"
        name="age"
        placeholder="Age"
        value={formData.age}
        onChange={handleChange}
        required
        className="w-full h-14 rounded-2xl border border-gray-200 bg-white pl-12 pr-4 focus:ring-2 focus:ring-green-500 outline-none transition"
      />

    </div>

  </div>

  {/* Gender */}

  <div>

    <label className="block mb-2 font-semibold text-gray-700">
      Gender
    </label>

    <div className="relative">

      <Users
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10"
      />

      <select
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        required
        className="w-full h-14 rounded-2xl border border-gray-200 bg-white pl-12 pr-4 appearance-none focus:ring-2 focus:ring-green-500 outline-none transition"
      >
        <option value="">Gender</option>
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>

    </div>

  </div>

</div>

<button
  type="submit"
  disabled={loading}
  className="w-full h-14 rounded-2xl bg-gradient-to-r from-green-700 to-emerald-500 text-white text-lg font-semibold shadow-xl hover:scale-[1.02] transition disabled:opacity-70"
>
  {loading ? "Creating Account..." : "✨ Create Account"}
</button>




<p className="text-center text-gray-600">

  Already have an account?{" "}

  <Link
    to="/login"
    className="text-green-700 font-semibold hover:underline"
  >
    Sign In
  </Link>

</p>





   </form>
   </div>

    );
}
