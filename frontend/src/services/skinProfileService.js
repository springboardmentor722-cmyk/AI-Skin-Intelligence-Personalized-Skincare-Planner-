import api from "./api";

export const getSkinProfile = async () => {
  const response = await api.get("/skin-profile/");
  return response.data;
};

export const createSkinProfile = async (profile) => {
  const response = await api.post("/skin-profile/", profile);
  return response.data;
};

export const updateSkinProfile = async (profile) => {
  const response = await api.put("/skin-profile/", profile);
  return response.data;
};

export const deleteSkinProfile = async () => {
  const response = await api.delete("/skin-profile/");
  return response.data;
};