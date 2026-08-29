import { authApi } from "./api";

export const registerUser = (data) => authApi.post("/auth/register", data);

export const loginUser = (data) =>
  authApi.post("/auth/login", new URLSearchParams(data), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

export const getUsersByRole = (role) => authApi.get(`/auth/users/by-role/${role}`);

export const forgotPassword = (email) => authApi.post("/auth/forgot-password", { email });

export const resetPassword = (token, new_password) =>
  authApi.post("/auth/reset-password", { token, new_password });
