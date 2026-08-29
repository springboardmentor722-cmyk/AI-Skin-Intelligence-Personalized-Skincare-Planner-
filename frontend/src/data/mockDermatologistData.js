// Mock patient roster for the dermatologist dashboard.
// Swap for a real GET /dermatologist/patients call once the
// dermatologist_patients relationship table + endpoint exist.

export const MOCK_PATIENTS = [
  {
    id: 1, name: "Nisha Mehta", initials: "NM", age: 26,
    skin_type: "Combination", skin_concerns: "Pigmentation, Dark Spots", goals: "Even Skin Tone",
    assignedDate: "2026-05-28", risk: "low",
  },
  {
    id: 2, name: "Arjun Kapoor", initials: "AK", age: 41,
    skin_type: "Dry", skin_concerns: "Wrinkles, Redness", goals: "Anti-Aging",
    assignedDate: "2026-06-11", risk: "medium",
  },
  {
    id: 3, name: "Ananya Iyer", initials: "AI", age: 22,
    skin_type: "Oily", skin_concerns: "Acne, Sensitive Skin", goals: "Reduce Acne",
    assignedDate: "2026-06-19", risk: "high",
  },
];

export const RISK_OPTIONS = ["All risk levels", "low", "medium", "high"];

export const RISK_STYLE = {
  low: "pill-active",
  medium: "pill-pending",
  high: "pill-flagged",
};
