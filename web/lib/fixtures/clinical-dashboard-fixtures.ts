// Milestone 2 P5 — Consultant & Dermatologist dashboard fixtures.
// docs/DECISIONS.md ADR-024: fixtures-first here (reversing ADR-023's P4 default)
// because no real clinical dashboard exists to preserve, the real
// ClientSummaryRead schema is narrower than UI_SPEC.md §4.2/§4.3's roster columns
// (no age/gender/status/follow-up), and a real account has zero assigned
// clients/patients by default — producing 128+ plausible rows is P14's seed-data
// job. Values below are the master prompt's own literal screenshot numbers.

export interface ClinicalRosterRow {
  key: string;
  name: string;
  age: number;
  gender: "Female" | "Male";
  skinType: string;
  topConcern: string;
  score: number;
  lastAssessment: string;
  status: "Active" | "Follow-up Due";
  nextFollowUp: string;
}

export const CONSULTANT_ROSTER: ClinicalRosterRow[] = [
  { key: "1", name: "Ananya Verma", age: 24, gender: "Female", skinType: "Combination", topConcern: "Acne & Post Acne Marks", score: 78, lastAssessment: "May 18, 2025", status: "Active", nextFollowUp: "May 28, 2025" },
  { key: "2", name: "Riya Singh", age: 26, gender: "Female", skinType: "Oily", topConcern: "Acne", score: 65, lastAssessment: "May 15, 2025", status: "Follow-up Due", nextFollowUp: "May 25, 2025" },
  { key: "3", name: "Kavya Nair", age: 30, gender: "Female", skinType: "Dry", topConcern: "Dryness & Redness", score: 76, lastAssessment: "May 16, 2025", status: "Active", nextFollowUp: "May 30, 2025" },
  { key: "4", name: "Neha Gupta", age: 32, gender: "Female", skinType: "Sensitive", topConcern: "Sensitivity", score: 65, lastAssessment: "May 12, 2025", status: "Follow-up Due", nextFollowUp: "May 24, 2025" },
  { key: "5", name: "Meera Iyer", age: 25, gender: "Female", skinType: "Combination", topConcern: "Uneven Skin Tone", score: 82, lastAssessment: "May 10, 2025", status: "Active", nextFollowUp: "May 22, 2025" },
];

export const DERMATOLOGIST_ROSTER: ClinicalRosterRow[] = [
  { key: "1", name: "Ananya Verma", age: 24, gender: "Female", skinType: "Combination", topConcern: "Acne & Post Acne Marks", score: 78, lastAssessment: "May 18, 2025", status: "Active", nextFollowUp: "May 28, 2025" },
  // Deliberate: mixed-gender roster (UI_SPEC.md §4.3), not all-female like Consultant's.
  { key: "2", name: "Rohit Sharma", age: 32, gender: "Male", topConcern: "Hair Fall & Dandruff", skinType: "Oily", score: 70, lastAssessment: "May 15, 2025", status: "Active", nextFollowUp: "May 29, 2025" },
  { key: "3", name: "Kavya Nair", age: 30, gender: "Female", skinType: "Dry", topConcern: "Dryness & Redness", score: 76, lastAssessment: "May 16, 2025", status: "Active", nextFollowUp: "May 30, 2025" },
  { key: "4", name: "Neha Gupta", age: 32, gender: "Female", skinType: "Sensitive", topConcern: "Sensitivity", score: 65, lastAssessment: "May 12, 2025", status: "Follow-up Due", nextFollowUp: "May 24, 2025" },
  { key: "5", name: "Meera Iyer", age: 25, gender: "Female", skinType: "Combination", topConcern: "Uneven Skin Tone", score: 82, lastAssessment: "May 10, 2025", status: "Active", nextFollowUp: "May 22, 2025" },
];

export const CONSULTANT_KPIS = {
  totalClients: 128,
  assessmentsDone: 86,
  activeRoutines: 92,
  avgImprovement: 24,
  upcomingFollowUps: 14,
};

export const DERMATOLOGIST_KPIS = {
  totalPatients: 156,
  assessmentsDone: 203,
  activeTreatmentPlans: 128,
  patientsImproving: 68,
  followUpsDue: 23,
};

export const CONSULTANT_SKIN_TYPE_DONUT = [
  { key: "combination", label: "Combination", value: 45, percent: 35, color: "var(--chart-1)" },
  { key: "oily", label: "Oily", value: 32, percent: 25, color: "var(--chart-2)" },
  { key: "dry", label: "Dry", value: 26, percent: 20, color: "var(--chart-3)" },
  { key: "sensitive", label: "Sensitive", value: 15, percent: 12, color: "var(--chart-4)" },
  { key: "normal", label: "Normal", value: 10, percent: 8, color: "var(--chart-5)" },
];

export const DERMATOLOGIST_CONCERN_DONUT = [
  { key: "acne", label: "Acne & Post Acne Marks", value: 38, percent: 24, color: "var(--chart-1)" },
  { key: "hyperpigmentation", label: "Hyperpigmentation", value: 28, percent: 18, color: "var(--chart-2)" },
  { key: "dryness", label: "Dryness", value: 22, percent: 14, color: "var(--chart-3)" },
  { key: "sensitive", label: "Sensitive Skin", value: 20, percent: 13, color: "var(--chart-4)" },
  { key: "oily", label: "Oily Skin", value: 18, percent: 12, color: "var(--chart-5)" },
  { key: "others", label: "Others", value: 30, percent: 19, color: "var(--chart-1)" },
];

export const TOP_SKIN_CONCERNS_BARS = [
  { key: "acne", label: "Acne & Post Acne Marks", percent: 42 },
  { key: "hyperpigmentation", label: "Hyperpigmentation", percent: 24 },
  { key: "dryness", label: "Dryness", percent: 18 },
  { key: "uneven_tone", label: "Uneven Skin Tone", percent: 9 },
  { key: "sensitivity", label: "Sensitivity & Redness", percent: 7 },
];

export const CONSULTANT_PROGRESS_SERIES = [
  { x: "May 1", y: 68 }, { x: "May 7", y: 71 }, { x: "May 14", y: 73 }, { x: "May 21", y: 74 }, { x: "May 28", y: 76 },
];
export const DERMATOLOGIST_PROGRESS_SERIES = [
  { x: "May 1", y: 60 }, { x: "May 7", y: 63 }, { x: "May 14", y: 65 }, { x: "May 21", y: 67 }, { x: "May 28", y: 68 },
];

// 3-cell (Consultant) vs 4-cell incl. neutral "Stable" (Dermatologist) — deliberately
// preserved divergence, UI_SPEC.md §4.2/§4.3.
export const CONSULTANT_STAT_FOOTER = [
  { key: "avg_improvement", label: "Avg. Improvement", value: "24%", deltaLabel: "↑6%" },
  { key: "improved", label: "Clients Improved", value: "18", deltaLabel: "↑8%" },
  { key: "need_attention", label: "Need Attention", value: "7", deltaLabel: "↓2%" },
];
export const DERMATOLOGIST_STAT_FOOTER = [
  { key: "avg_improvement", label: "Avg. Improvement", value: "68%", deltaLabel: "↑8%" },
  { key: "improved", label: "Patients Improved", value: "106", deltaLabel: "↑12%" },
  { key: "stable", label: "Stable", value: "28", deltaLabel: "—" },
  { key: "need_attention", label: "Need Attention", value: "22", deltaLabel: "↓6%" },
];

export const RECENT_ASSESSMENTS = [
  { key: "1", name: "Ananya Verma", initials: "AV", when: "May 18, 2025 · 10:30 AM", score: 78 },
  { key: "2", name: "Kavya Nair", initials: "KN", when: "May 16, 2025 · 11:45 AM", score: 76 },
  { key: "3", name: "Neha Gupta", initials: "NG", when: "May 12, 2025 · 09:10 AM", score: 65 },
];

export const UPCOMING_FOLLOW_UPS = [
  { key: "1", name: "Riya Singh", when: "May 25, 2025", daysLeft: "Tomorrow" },
  { key: "2", name: "Neha Gupta", when: "May 24, 2025", daysLeft: "3 days left" },
  { key: "3", name: "Meera Iyer", when: "May 30, 2025", daysLeft: "9 days left" },
];

export const CONSULTANT_TIP = {
  title: "Consultant Tip",
  lines: ["Clients who follow routines consistently show 2x better improvement. Encourage hydration and sunscreen daily!"],
};
export const DERMATOLOGIST_INSIGHT = {
  title: "AI Clinical Insights",
  lines: [
    "Patients with combination skin type show 15% faster improvement when prescribed a dual-cleanse routine.",
    "Consider niacinamide for better results on patients reporting persistent redness.",
  ],
};
