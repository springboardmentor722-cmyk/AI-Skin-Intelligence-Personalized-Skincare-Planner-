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
// (Better Auth's defaultRole, lib/auth.ts) — this field is never sent to Better
// Auth's signUp.email call itself, so the *account* never self-escalates its own
// role at signup. What it *does* drive (Branch 4, docs/DECISIONS.md) is the
// post-signup redirect: a Consultant applicant goes straight to
// /consultant-onboarding, whose own submission is what actually flips the role
// (app/api/consultant-onboarding/submit/route.ts) — a real, reviewed, self-service
// transition, just not this field/call. Dermatologist has no onboarding wizard yet
// (Branch 5) and still redirects to /assessment like a plain user.
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

// Same password rules as signupSchema — kept as a separate schema (not reused
// directly) since this form has no name/email/role/consent fields.
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "At least one uppercase letter")
      .regex(/[0-9]/, "At least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

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
