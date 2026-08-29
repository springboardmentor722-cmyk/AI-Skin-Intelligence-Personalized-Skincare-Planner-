import { profileApi } from "./api";
 
export const getMyProfile = () => profileApi.get("/profile/me");
 
export const createProfile = (data) => profileApi.post("/profile/create", data);
 
export const updateProfile = (data) => profileApi.put("/profile/update", data);
 
export const getConsultantClients = () => profileApi.get("/consultant/clients");
 
export const getDermatologistPatients = () => profileApi.get("/dermatologist/patients");
 
export const addTreatmentNote = (patientId, text) =>
  profileApi.post(`/dermatologist/patients/${patientId}/notes`, { text });
 
export const getTreatmentNotes = (patientId) =>
  profileApi.get(`/dermatologist/patients/${patientId}/notes`);