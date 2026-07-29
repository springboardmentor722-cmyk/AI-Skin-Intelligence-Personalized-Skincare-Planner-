import { z } from "zod";

// docs/WIREFRAMES.md "4. Skin profile & lifestyle" — field-level rules only.

export const AGE_GROUPS = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

// "gender (optional, inclusive options)" — WIREFRAMES.md doesn't enumerate a specific
// list; kept short and inclusive rather than inventing an exhaustive taxonomy.
export const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say", "Other"];

export const ALCOHOL_OPTIONS = ["none", "occasional", "regular"] as const;
export const POLLUTION_OPTIONS = ["low", "moderate", "high"] as const;

const concernSelectionSchema = z.object({
  concern_id: z.number(),
  severity_rating: z.number().min(1).max(10),
  priority_level: z.number().min(1).max(10),
});

// docs/DECISIONS.md ADR-026 — allergies are structured ingredient ids, not free text.
const allergyIngredientSchema = z.object({
  ingredient_id: z.number(),
  ingredient_name: z.string(),
});

export const skinProfileFormSchema = z.object({
  skin_type_id: z.number({ error: "Select your skin type" }),
  age_group: z.string().optional(),
  gender: z.string().optional(),
  concerns: z.array(concernSelectionSchema),
  allergies: z.array(allergyIngredientSchema),
  sensitivities: z.array(z.string()),
});
export type SkinProfileFormValues = z.infer<typeof skinProfileFormSchema>;

export const lifestyleFormSchema = z.object({
  sleep_hours: z.number().min(0).max(24).optional(),
  sleep_quality: z.number().min(1).max(10).optional(),
  water_intake_liters: z.number().min(0).optional(),
  stress_level: z.number().min(1).max(10).optional(),
  diet_quality: z.number().min(1).max(10).optional(),
  exercise_frequency: z.number().min(0).optional(),
  smoking: z.boolean(),
  alcohol_consumption: z.enum(ALCOHOL_OPTIONS).optional(),
  sun_hours: z.number().min(0).max(24).optional(),
  pollution_level: z.enum(POLLUTION_OPTIONS).optional(),
  ac_exposure_hours: z.number().min(0).max(24).optional(),
});
export type LifestyleFormValues = z.infer<typeof lifestyleFormSchema>;
