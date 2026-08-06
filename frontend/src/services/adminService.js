import api from "./api";

// Get all users
export const getAllUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

// Update user role
export const updateUserRole = async (userId, role) => {
  const response = await api.put(
    `/admin/users/${userId}/role`,
    {
      role: role,
    }
  );

  return response.data;
};

// Delete user
export const deleteUser = async (userId) => {
  const response = await api.delete(
    `/admin/users/${userId}`
  );

  return response.data;
};