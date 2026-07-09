import { z } from "zod";

// AGENTS.md's mega-prompt Consultant onboarding field list, minus what Better Auth
// already owns (full name -> user.name, email -> user.email, profile photo -> a
// document upload, not a form field). Field-level rules only — the backend's
// ConsultantProfileSubmit (backend/app/services/consultant_profile/schemas.py) is
// the real source of truth for required-ness; kept in lockstep by hand since types
// aren't shared cross-language here.

// Free-form tag inputs, not fixed enums — neither AGENTS.md's field list nor the
// backend schema (ConsultantProfileSubmit) pins consultation modes/specializations/
// languages to a specific enumerated set, so inventing one here would just be a
// second, disagreeing source of truth. Suggested chips in the UI are starting points,
// not a closed list.
export const SUGGESTED_CONSULTATION_MODES = ["Video call", "Chat", "In person", "Phone"];

export const consultantBackgroundSchema = z.object({
  qualifications: z.string().trim().min(1, "Qualifications are required"),
  yearsOfExperience: z
    .number({ error: "Years of experience is required" })
    .min(0, "Must be 0 or more")
    .max(80, "Enter a realistic number of years"),
  currentOrganization: z.string().trim().optional(),
  licenseNumber: z.string().trim().optional(),
});
export type ConsultantBackgroundValues = z.infer<typeof consultantBackgroundSchema>;

export const consultantPracticeSchema = z.object({
  specializations: z.array(z.string()).min(1, "Select at least one specialization"),
  areasOfExpertise: z.array(z.string()).optional(),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  consultationModes: z.array(z.string()).min(1, "Add at least one consultation mode"),
  availability: z.string().trim().optional(),
  biography: z.string().trim().min(1, "A short biography is required"),
});
export type ConsultantPracticeValues = z.infer<typeof consultantPracticeSchema>;

export const consultantContactSchema = z.object({
  phone: z.string().trim().min(1, "Phone number is required"),
  location: z.string().trim().optional(),
  clinicAddress: z.string().trim().optional(),
  linkedinUrl: z.url("Enter a valid URL").optional().or(z.literal("")),
  portfolioUrl: z.url("Enter a valid URL").optional().or(z.literal("")),
});
export type ConsultantContactValues = z.infer<typeof consultantContactSchema>;

export const consultantOnboardingSchema = consultantBackgroundSchema
  .extend(consultantPracticeSchema.shape)
  .extend(consultantContactSchema.shape);
export type ConsultantOnboardingValues = z.infer<typeof consultantOnboardingSchema>;
