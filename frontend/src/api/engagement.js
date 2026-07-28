import apiClient from "./auth";

// --- Dashboard aggregates ---
export async function getConsultantDashboardData() {
  const res = await apiClient.get("/consultant/dashboard-data");
  return res.data;
}

export async function getDermatologistDashboardData() {
  const res = await apiClient.get("/dermatologist/dashboard-data");
  return res.data;
}

export async function getAdminDashboardStats() {
  const res = await apiClient.get("/admin/dashboard-stats");
  return res.data;
}

// --- Appointments ---
export async function bookAppointment({ professionalId, professionalType, scheduledAt, reason }) {
  const res = await apiClient.post("/appointments", {
    professional_id: professionalId,
    professional_type: professionalType,
    scheduled_at: scheduledAt,
    reason,
  });
  return res.data;
}

export async function getMyAppointments() {
  const res = await apiClient.get("/appointments/mine");
  return res.data;
}

export async function updateAppointmentStatus(appointmentId, statusValue) {
  const res = await apiClient.patch(`/appointments/${appointmentId}/status`, { status: statusValue });
  return res.data;
}

// --- Consultant client requests ---
export async function requestConsultant(professionalId) {
  const res = await apiClient.post("/consultant/request", { professional_id: professionalId });
  return res.data;
}

export async function updateClientLinkStatus(linkId, statusValue) {
  const res = await apiClient.patch(`/consultant/clients/${linkId}/status`, { status: statusValue });
  return res.data;
}

// --- Dermatologist patient requests ---
export async function requestDermatologist(professionalId) {
  const res = await apiClient.post("/dermatologist/request", { professional_id: professionalId });
  return res.data;
}

export async function updatePatientLinkStatus(linkId, statusValue) {
  const res = await apiClient.patch(`/dermatologist/patients/${linkId}/status`, { status: statusValue });
  return res.data;
}

// --- Notifications ---
export async function getMyNotifications() {
  const res = await apiClient.get("/notifications/mine");
  return res.data;
}

export async function markNotificationRead(notificationId) {
  const res = await apiClient.patch(`/notifications/${notificationId}/read`);
  return res.data;
}

// --- Appointment Wizard (new endpoints) ---

export async function getAvailableSlots(professionalId, slotDate) {
  const params = slotDate ? { slot_date: slotDate } : {};
  const res = await apiClient.get(`/appointments/availability/${professionalId}`, { params });
  return res.data;
}

export async function bookAppointmentWizard(payload) {
  // payload: { professional_id, professional_type, slot_date, slot_start_time, reason, skin_concern, message }
  const res = await apiClient.post("/appointments/book", payload);
  return res.data;
}

export async function getMyAppointmentsRich() {
  const res = await apiClient.get("/appointments/my");
  return res.data;
}

export async function getProfessionalIncomingAppointments() {
  try {
    const res = await apiClient.get("/appointments/professional/incoming");
    if (Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {}
  const res = await apiClient.get("/appointments/mine");
  return res.data?.as_professional || res.data || [];
}

export async function updateAppointmentStatusNew(appointmentId, statusValue) {
  const res = await apiClient.patch(`/appointments/${appointmentId}/status`, { status: statusValue });
  return res.data;
}