import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/Authcontext";
import LoginLayout from "../../components/Auth/LoginLayout";
import LoginForm from "../../components/Auth/LoginForm";

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoginSubmit = async (formData) => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/login", {
        email: formData.email,
        password: formData.password
      });

      const { access_token, refresh_token, user, next_page } = res.data;
      authLogin(user, access_token, refresh_token);

      // Role-based and onboarding sequence redirection
      if (user?.role === "consultant") {
        navigate("/consultant-dashboard");
      } else if (user?.role === "dermatologist") {
        navigate("/dermatologist-dashboard");
      } else if (user?.role === "admin") {
        navigate("/admin-dashboard");
      } else if (next_page) {
        navigate(next_page);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const resp = err.response?.data;
      const errMsg = resp?.message || resp?.detail || "Invalid email or password";
      setError(typeof errMsg === "object" ? (errMsg.message || JSON.stringify(errMsg)) : errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginLayout>
      <LoginForm
        onSubmit={handleLoginSubmit}
        loading={loading}
        error={error}
      />
    </LoginLayout>
  );
}
