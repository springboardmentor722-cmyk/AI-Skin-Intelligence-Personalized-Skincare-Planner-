import api from "./api";

export const getProducts = async (skip = 0, limit = 20) => {
  const response = await api.get(
    `/products/?skip=${skip}&limit=${limit}`
  );
  return response.data;
};

export const searchProducts = async (params) => {
  const response = await api.get("/products/search", {
    params,
  });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getBrands = async () => {
  const response = await api.get("/products/brands");
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get("/products/categories");
  return response.data;
};

export const deleteProduct = async (productId) => {

  const token = localStorage.getItem("token");

  const response = await fetch(
    `http://127.0.0.1:8000/products/${productId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete product");
  }

  return response.json();
};

export const updateProduct = async (productId, productData) => {

  const response = await api.put(
    `/products/${productId}`,
    productData
  );

  return response.data;

};