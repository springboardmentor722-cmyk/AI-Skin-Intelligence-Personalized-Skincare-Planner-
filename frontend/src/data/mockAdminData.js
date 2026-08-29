// Single source of mock data for the admin dashboard tabs.
// Swap the exports below for real API calls (GET /admin/users, GET /admin/platform-stats)
// once those backend endpoints exist — every admin page imports from here,
// so wiring real data only needs to happen in one place.

export const MOCK_USERS = [
  { id: 1, name: "Riya Sharma", initials: "RS", email: "riya.sharma@example.com", role: "user", status: "active", joined: "2026-06-02" },
  { id: 2, name: "Arjun Kapoor", initials: "AK", email: "arjun.kapoor@example.com", role: "consultant", status: "pending", joined: "2026-06-11" },
  { id: 3, name: "Nisha Mehta", initials: "NM", email: "nisha.mehta@example.com", role: "dermatologist", status: "active", joined: "2026-05-28" },
  { id: 4, name: "Devraj Singh", initials: "DS", email: "devraj.singh@example.com", role: "user", status: "flagged", joined: "2026-06-14" },
  { id: 5, name: "Priya Nair", initials: "PN", email: "priya.nair@example.com", role: "user", status: "active", joined: "2026-06-16" },
  { id: 6, name: "Karan Verma", initials: "KV", email: "karan.verma@example.com", role: "user", status: "active", joined: "2026-06-18" },
  { id: 7, name: "Ananya Iyer", initials: "AI", email: "ananya.iyer@example.com", role: "consultant", status: "active", joined: "2026-06-19" },
];

export const MOCK_SIGNUP_TREND = [
  { label: "Mon", value: 34 },
  { label: "Tue", value: 41 },
  { label: "Wed", value: 38 },
  { label: "Thu", value: 52 },
  { label: "Fri", value: 47 },
  { label: "Sat", value: 29 },
  { label: "Sun", value: 33 },
];

export const ROLE_OPTIONS = ["All roles", "user", "consultant", "dermatologist", "admin"];
export const STATUS_OPTIONS = ["All statuses", "active", "pending", "flagged"];
