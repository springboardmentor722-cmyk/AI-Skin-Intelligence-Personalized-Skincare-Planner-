import api from "./api";

export const getTreatment = async () => {

  const response = await api.get("/user/treatment");

  return response.data;

};