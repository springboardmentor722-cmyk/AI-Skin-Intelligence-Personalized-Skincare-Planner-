import { z } from "zod";

// docs/WIREFRAMES.md "1. Login" / "2. Registration" — field-level rules only; server is
// still the source of truth for uniqueness/credential checks (email-taken, wrong
// password) surfaced via the API's error envelope, not duplicated here.

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});
export type LoginValues = z.infer<typeof loginSchema>;

// web/designs/wireframes/signup.html "Step A: Who are you?" — a declared/requested
// role, shown on the signup form. Per docs/AGENTS.md and docs/WIREFRAMES.md
// "Registration", every new account still defaults to role `user` at signup
// (Better Auth's defaultRole, lib/auth.ts) — consultant/dermatologist access is
// granted via admin verification afterward, never self-service at signup. This field
// is not sent to Better Auth's signUp.email call; it's captured for the signup UI only
// (no backend request-a-role endpoint exists yet — not invented here).
export const SIGNUP_ROLES = ["user", "consultant", "dermatologist"] as const;

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "At least one uppercase letter")
      .regex(/[0-9]/, "At least one number"),
    confirmPassword: z.string(),
    requestedRole: z.enum(SIGNUP_ROLES),
    // Skin-photo processing consent — required, docs/SUGGESTIONS.md P0.
    consent: z.literal(true, {
      error: "You must accept the Terms and consent to skin-photo processing",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type SignupValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}
