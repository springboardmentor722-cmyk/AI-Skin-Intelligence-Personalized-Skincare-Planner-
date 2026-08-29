import { authApi } from "./api";

export const getAllUsers = () => {
  return authApi.get("/auth/users");
};
