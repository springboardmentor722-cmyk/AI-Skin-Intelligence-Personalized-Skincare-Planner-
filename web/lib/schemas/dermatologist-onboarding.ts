import { z } from "zod";

// AGENTS.md's mega-prompt Dermatologist onboarding field list, minus what Better Auth
// already owns (full name -> user.name, email -> user.email, profile photo/documents
// -> uploads, not form fields). Field-level rules only — the backend's
// DermatologistProfileSubmit (backend/app/services/dermatologist_profile/schemas.py)
// is the real source of truth for required-ness; kept in lockstep by hand since types
// aren't shared cross-language here. A distinct schema from
// lib/schemas/consultant-onboarding.ts, not a shared/parameterized one — the two
// roles' real fields genuinely differ (medical registration/council vs. license/
// consultation modes).

export const dermatologistBackgroundSchema = z.object({
  medicalRegistrationNumber: z.string().trim().min(1, "Medical registration number is required"),
  medicalCouncil: z.string().trim().min(1, "Medical council is required"),
  hospitalClinic: z.string().trim().optional(),
  yearsOfPractice: z
    .number({ error: "Years of practice is required" })
    .min(0, "Must be 0 or more")
    .max(80, "Enter a realistic number of years"),
  degrees: z.array(z.string()).min(1, "Add at least one degree"),
});
export type DermatologistBackgroundValues = z.infer<typeof dermatologistBackgroundSchema>;

export const dermatologistPracticeSchema = z.object({
  boardCertifications: z.array(z.string()).optional(),
  specializations: z.array(z.string()).min(1, "Select at least one specialization"),
  researchInterests: z.string().trim().optional(),
  professionalBiography: z.string().trim().min(1, "A short biography is required"),
});
export type DermatologistPracticeValues = z.infer<typeof dermatologistPracticeSchema>;

export const dermatologistContactSchema = z.object({
  phone: z.string().trim().min(1, "Phone number is required"),
  location: z.string().trim().optional(),
});
export type DermatologistContactValues = z.infer<typeof dermatologistContactSchema>;

export const dermatologistOnboardingSchema = dermatologistBackgroundSchema
  .extend(dermatologistPracticeSchema.shape)
  .extend(dermatologistContactSchema.shape);
export type DermatologistOnboardingValues = z.infer<typeof dermatologistOnboardingSchema>;
