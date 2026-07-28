import apiClient from "./auth";

function extractErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return "Something went wrong. Please try again.";
}

export async function createSkinProfile(payload) {
  try {
    const response = await apiClient.post("/skin-profile/", {
      age: payload.age,
      gender: payload.gender,
      skin_type: payload.skin_type,
      skin_concerns: payload.skin_concerns,
      allergies: payload.allergies,
      sensitivities: payload.sensitivities,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function getSkinProfile() {
  try {
    const response = await apiClient.get("/skin-profile/");
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function updateSkinProfile(payload) {
  try {
    const response = await apiClient.put("/skin-profile/", payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function createLifestyleLog(payload) {
  try {
    const response = await apiClient.post("/lifestyle/", {
      sleep_hours: payload.sleep_hours,
      water_intake_liters: payload.water_intake_liters,
      exercise_minutes: payload.exercise_minutes,
      stress_level: payload.stress_level,
      environmental_exposure: payload.environmental_exposure,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}