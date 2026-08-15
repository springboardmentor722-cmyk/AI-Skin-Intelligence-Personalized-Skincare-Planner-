/**
 * Auth context — holds the current user and session helpers.
 * Persists the JWT and a lightweight user object in localStorage so
 * that a page refresh keeps the user signed in (session persistence).
 */

import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password, rememberMe) => {
    const res = await api.post("/auth/login", {
      email,
      password,
      remember_me: rememberMe,
    });
    localStorage.setItem("access_token", res.data.access_token);
    const meRes = await api.get("/auth/me");
    setUser(meRes.data);
    localStorage.setItem("user", JSON.stringify(meRes.data));
    return meRes.data;
  };

  const register = async (payload) => {
    const res = await api.post("/auth/register", payload);
    localStorage.setItem("access_token", res.data.access_token);
    const meRes = await api.get("/auth/me");
    setUser(meRes.data);
    localStorage.setItem("user", JSON.stringify(meRes.data));
    return meRes.data;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
