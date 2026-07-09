"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  User,
  Stethoscope,
  ClipboardPlus,
} from "lucide-react";

import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import {
  passwordStrength,
  signupSchema,
  SIGNUP_ROLES,
  type SignupValues,
} from "@/lib/schemas/auth";
import { GoogleIcon } from "@/components/auth/google-icon";
import { cn } from "@/lib/utils";

// docs/WIREFRAMES.md Registration "Accept": "consent stored with timestamp + policy
// version". Bump this whenever the Terms of Service / skin-photo processing copy
// below materially changes — docs/SUGGESTIONS.md's consent-ledger note ("re-prompt on
// material changes") is the reason a version string exists at all, not just a date.
const CONSENT_POLICY_VERSION = "2026-07-09";

const STRENGTH_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-warning",
  "bg-secondary",
  "bg-success",
];

const ROLE_CARDS: Record<
  (typeof SIGNUP_ROLES)[number],
  { icon: typeof User; label: string; blurb: string; requiresVerification: boolean }
> = {
  user: { icon: User, label: "User", blurb: "Improve my own skin", requiresVerification: false },
  consultant: {
    icon: Stethoscope,
    label: "Consultant",
    blurb: "Guide my clients",
    requiresVerification: true,
  },
  dermatologist: {
    icon: ClipboardPlus,
    label: "Dermatologist",
    blurb: "Manage patients",
    requiresVerification: true,
  },
};

// web/designs/wireframes/signup.html — role selector ("Step A: Who are you?") + two
// -column layout (AuthSplitLayout, shared with /login). Consultant/Dermatologist cards
// carry a "requires verification" note (matching the wireframe's "REQUIRED" badge) —
// docs/AGENTS.md: every new account still defaults to role `user`; professional roles
// are granted via admin verification after signup, never self-service here.
export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      requestedRole: "user",
      consent: false as unknown as true,
    },
  });

  const password = watch("password");
  const strength = passwordStrength(password);
  const requestedRole = watch("requestedRole");

  const onSubmit = async (values: SignupValues) => {
    setFormError(null);

    const { error } = await authClient.signUp.email({
      name: `${values.firstName} ${values.lastName}`,
      email: values.email,
      password: values.password,
      // Milestone 1 audit finding: consent was validated client-side only (this
      // schema's own `consent: z.literal(true)`) and never sent to or stored by the
      // backend — closes that gap. additionalFields wired in lib/auth.ts +
      // lib/auth-client.ts.
      consentAcceptedAt: new Date(),
      consentPolicyVersion: CONSENT_POLICY_VERSION,
    });

    if (error) {
      setFormError(
        error.status === 422
          ? "That email is already registered."
          : (error.message ?? "Something went wrong. Try again.")
      );
      return;
    }

    // New accounts default to role "user" (defaultRole, lib/auth.ts) regardless of
    // requestedRole — a Consultant applicant goes straight to the onboarding wizard
    // (Branch 4, docs/DECISIONS.md's professional-verification ADR), which is what
    // flips the role once their application is actually submitted, not this redirect
    // itself. Everyone else is sent to the guided assessment wizard first (not the
    // plain Skin profile form directly), matching docs/WIREFRAMES.md's documented
    // Registration "success" state (updated 2026-07-09, product-owner decision —
    // assessment results itself offers "Complete your skin profile" as its own next
    // step). Dermatologist keeps going to /assessment until its own onboarding wizard
    // exists (Branch 5) — not wired here to avoid a dead link mid-build.
    router.push(values.requestedRole === "consultant" ? "/consultant-onboarding" : "/assessment");
  };

  return (
    <AuthSplitLayout>
      <div className="border-border bg-card rounded-2xl border p-8">
        <header className="mb-6">
          <h1 className="font-heading text-on-surface text-xl font-semibold">
            Create your account
          </h1>
          <p className="text-on-surface-variant mt-1 font-sans text-sm">
            Start your personalized skin intelligence plan.
          </p>
        </header>

        {formError && (
          <div
            role="alert"
            className="bg-destructive/10 text-destructive mb-5 flex items-start gap-2 rounded-lg p-3 text-sm"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <Label className="font-geist text-on-surface-variant text-xs tracking-[0.05em] uppercase">
              Who are you?
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {SIGNUP_ROLES.map((role) => {
                const card = ROLE_CARDS[role];
                const selected = requestedRole === role;
                return (
                  <label
                    key={role}
                    className={cn(
                      "flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3 transition-colors",
                      selected
                        ? "border-secondary bg-secondary/5"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <input
                      type="radio"
                      value={role}
                      checked={selected}
                      onChange={() => setValue("requestedRole", role)}
                      className="sr-only"
                    />
                    <card.icon className="text-secondary size-5" strokeWidth={1.5} />
                    <span className="font-sans text-sm font-semibold">{card.label}</span>
                    <span className="text-on-surface-variant text-[11px] leading-tight">
                      {card.blurb}
                    </span>
                  </label>
                );
              })}
            </div>
            {ROLE_CARDS[requestedRole].requiresVerification && (
              <p className="text-on-surface-variant font-sans text-xs">
                {`${ROLE_CARDS[requestedRole].label} accounts require verification. You'll start with standard access and our team will follow up to verify your credentials.`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First name</Label>
              <input
                id="firstName"
                autoComplete="given-name"
                aria-invalid={!!errors.firstName}
                className="bg-muted text-on-surface focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-destructive text-xs">{errors.firstName.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <input
                id="lastName"
                autoComplete="family-name"
                aria-invalid={!!errors.lastName}
                className="bg-muted text-on-surface focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-destructive text-xs">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email address</Label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className="bg-muted text-on-surface focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-destructive text-xs">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                className="bg-muted text-on-surface focus:ring-secondary/40 w-full rounded-full border-none py-2.5 pr-10 pl-4 font-sans text-sm focus:ring-2 focus:outline-none"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="text-on-surface-variant hover:text-on-surface absolute top-1/2 right-4 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="size-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="size-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
            {password && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex h-1 flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "flex-1 rounded-full",
                        i < strength.score ? STRENGTH_COLORS[strength.score] : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <span className="font-geist text-on-surface-variant text-xs">
                  {strength.label}
                </span>
              </div>
            )}
            {errors.password && (
              <p className="text-destructive text-xs">{errors.password.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              className="bg-muted text-on-surface focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-xs">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex cursor-pointer items-start gap-2">
              <Checkbox
                checked={watch("consent")}
                onCheckedChange={(checked) =>
                  setValue("consent", (checked === true) as true)
                }
                className="mt-0.5"
              />
              <span className="text-on-surface-variant font-sans text-sm">
                I agree to the Terms of Service and consent to my skin-photo data being
                processed for analysis.
              </span>
            </label>
            {errors.consent && (
              <p className="text-destructive text-xs">{errors.consent.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || !watch("consent")}
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />}
            Create account
          </Button>

          <div className="relative py-2 text-center">
            <span className="font-geist text-on-surface-variant relative bg-transparent px-3 text-xs uppercase">
              or continue with
            </span>
            <div className="border-border absolute inset-x-0 top-1/2 -z-10 border-t" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() =>
              authClient.signIn.social({
                provider: "google",
                callbackURL: "/dashboard",
              })
            }
          >
            <GoogleIcon className="size-4" />
            Continue with Google
          </Button>
        </form>

        <p className="text-on-surface-variant mt-6 text-center font-sans text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-secondary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
