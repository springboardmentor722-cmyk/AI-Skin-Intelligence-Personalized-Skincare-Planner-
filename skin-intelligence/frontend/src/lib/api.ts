import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401 once, then bounce to login if refresh also fails
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, null, { params: { refresh_token: refresh } });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface SkinAnalysis {
  skin_type: string;
  acne_severity: number;
  redness_level: number;
  wrinkle_severity: number;
  pigmentation_level: number;
  pore_visibility: number;
  oiliness_level: number;
  dryness_level: number;
  dark_circles_severity: number;
  estimated_skin_age: number;
  skin_tone_hex: string;
  confidence: number;
}

export const analyzeScan = async (imageBlob: Blob) => {
  const form = new FormData();
  form.append("image", imageBlob, "scan.jpg");
  const { data } = await api.post("/analysis/scan", form, { headers: { "Content-Type": "multipart/form-data" } });
  return data as { scan_id: string; analysis: SkinAnalysis };
};

export const generateRoutine = async (payload: {
  analysis: SkinAnalysis;
  sensitive_skin: boolean;
  season: string;
  budget_tier: string;
}) => {
  const { data } = await api.post("/routine/generate", payload);
  return data;
};
