// Mock client roster for the consultant dashboard.
// Swap for a real GET /consultant/clients call once the
// consultant_clients relationship table + endpoint exist.
// Field shape matches the real ProfileCreate schema (skin_type,
// skin_concerns, goals) so wiring real data later won't change the UI.

export const MOCK_CLIENTS = [
  {
    id: 1, name: "Riya Sharma", initials: "RS", age: 28,
    skin_type: "Oily", skin_concerns: "Blackheads, Whiteheads", goals: "Glowing Skin",
    assignedDate: "2026-06-02", status: "active",
  },
  {
    id: 2, name: "Devraj Singh", initials: "DS", age: 34,
    skin_type: "Dry", skin_concerns: "Fine Lines, Dullness", goals: "Anti-Aging, Hydration",
    assignedDate: "2026-06-14", status: "flagged",
  },
  {
    id: 3, name: "Priya Nair", initials: "PN", age: 24,
    skin_type: "Combination", skin_concerns: "Acne, Large Pores", goals: "Reduce Acne",
    assignedDate: "2026-06-16", status: "active",
  },
  {
    id: 4, name: "Karan Verma", initials: "KV", age: 31,
    skin_type: "Sensitive", skin_concerns: "Redness, Dryness", goals: "Sensitive Skin Care",
    assignedDate: "2026-06-18", status: "pending",
  },
];

export const STATUS_OPTIONS = ["All statuses", "active", "pending", "flagged"];
