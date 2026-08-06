import api from "./api";

export const getLifestyle = async () => {
  const response = await api.get("/lifestyle/");
  return response.data;
};

export const createLifestyle = async (lifestyle) => {
  const response = await api.post("/lifestyle/", lifestyle);
  return response.data;
};

export const updateLifestyle = async (lifestyle) => {
  const response = await api.put("/lifestyle/", lifestyle);
  return response.data;
};

export const deleteLifestyle = async () => {
  const response = await api.delete("/lifestyle/");
  return response.data;
};