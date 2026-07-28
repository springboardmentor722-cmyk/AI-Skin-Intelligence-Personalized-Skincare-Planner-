import axios from "axios";

export const API_BASE_URL = "http://127.0.0.1:8080";
const apiClient = axios.create({ baseURL: API_BASE_URL });

// Attach the saved token automatically to every request, if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function extractErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return "Something went wrong. Please try again.";
}

export async function loginUser({ email, password }) {
  try {
    // Backend's /auth/login expects JSON matching LoginRequest { email, password } —
    // NOT form-urlencoded username/password (that's the OAuth2PasswordRequestForm style,
    // which this backend does not use).
    const response = await apiClient.post("/auth/login", {
      email,
      password,
    });
    const { access_token, user } = response.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("user", JSON.stringify(user));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function registerUser({ fullName, email, password, role }) {
  try {
    const response = await apiClient.post("/auth/register", {
      full_name: fullName,
      email,
      password,
      role,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function getCurrentUser() {
  try {
    const response = await apiClient.get("/auth/me");
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
}

export default apiClient;