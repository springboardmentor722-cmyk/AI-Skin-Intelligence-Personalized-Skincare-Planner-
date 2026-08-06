import api from "./api";

export const getIngredients = async (skip = 0, limit = 20) => {
  const response = await api.get(
    `/ingredients?skip=${skip}&limit=${limit}`
  );
  return response.data;
};

export const searchIngredients = async (params) => {
  const response = await api.get("/ingredients/search", {
    params,
  });
  return response.data;
};

export const getIngredientById = async (id) => {
  const response = await api.get(`/ingredients/${id}`);
  return response.data;
};

export const getIngredientCategories = async () => {
  const response = await api.get("/ingredients/categories");
  return response.data;
};