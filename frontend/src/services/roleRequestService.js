import api from "./api";



// Apply for Role
export const applyRole = async (formData) => {
  const response = await api.post(
    "/role-request/apply",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
// View my requests
export const getMyRequests = async () => {
  const response = await api.get("/role-request/me");
  return response.data;
};

// Admin - View pending requests
export const getPendingRequests = async () => {
  const response = await api.get("/role-request/pending");
  return response.data;
};

// Admin - Approve request
export const approveRequest = async (id) => {
  const response = await api.put(
    `/role-request/${id}/approve`
  );

  return response.data;
};

// Admin - Reject request
export const rejectRequest = async (id) => {
  const response = await api.put(
    `/role-request/${id}/reject`
  );

  return response.data;
};

