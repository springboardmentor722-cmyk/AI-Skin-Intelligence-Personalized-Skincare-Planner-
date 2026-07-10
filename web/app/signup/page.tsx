"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react";

import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

// Geist, uppercase, tracked — docs/DESIGN.md §9's "Geist label above field" spec,
// same LABEL_CLASS convention already established on the onboarding wizards
// (app/consultant-onboarding/*). Login/signup predate that convention; not touching
// login here, but signup's own redesign is the right place to actually follow it.
const LABEL_CLASS =
  "font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase";
// Level-1 tonal fill at rest (docs/DESIGN.md §9), a real Royal Blue border appearing
// only on focus (not just a ring) — the fix for a small pre-existing gap where
// `border-none` meant no border ever showed, contradicting that spec. `lg:py-2` (not
// smaller universally) trims height back at the same breakpoint AuthSplitLayout
// switches to its 2-column split — the one place this fuller form needs the room;
// mobile/tablet keep the more comfortable touch-sized py-2.5.
const INPUT_CLASS =
  "bg-muted text-on-surface placeholder:text-on-surface-variant/50 w-full rounded-full border border-transparent px-4 py-2.5 font-sans text-sm transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary/30 focus:outline-none aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 lg:py-2";

const ROLE_CARDS: Record<
  (typeof SIGNUP_ROLES)[number],
  {
    icon: typeof User;
    label: string;
    description: string;
    requiresVerification: boolean;
    iconClassName: string;
    checkedClassName: string;
  }
> = {
  user: {
    icon: User,
    label: "User",
    description: "Track and improve your own skin health",
    requiresVerification: false,
    iconClassName: "bg-secondary/10 text-secondary",
    checkedClassName:
      "data-checked:border-secondary data-checked:bg-secondary/[0.06] dark:data-checked:bg-secondary/10",
  },
  consultant: {
    icon: Sparkles,
    label: "Skincare Consultant",
    description: "Guide clients through personalized skincare routines",
    requiresVerification: true,
    iconClassName: "bg-tertiary/10 text-tertiary",
    checkedClassName:
      "data-checked:border-tertiary data-checked:bg-tertiary/[0.06] dark:data-checked:bg-tertiary/10",
  },
  dermatologist: {
    icon: Stethoscope,
    label: "Dermatologist",
    description: "Review patients' clinical skin assessments",
    requiresVerification: true,
    iconClassName: "bg-primary/10 text-primary",
    checkedClassName:
      "data-checked:border-primary data-checked:bg-primary/[0.05] dark:data-checked:bg-primary/15",
  },
};

// 2026 redesign (feature/signup-page-redesign) — web/designs/wireframes/signup-dark.html
// used only as inspiration (per-role icon tinting, a full-width role-row layout, "OR
// CONTINUE WITH" divider, the trailing "Log In" link), not copied: its two-step wizard
// (role screen, then a separate details screen) adds a click with no real benefit here
// — this app already has dedicated post-signup onboarding wizards for the two
// professional roles (Branch 4/5), so a *second*, pre-signup wizard step would just be
// redundant friction. Kept as one page, redesigned for real width/spacing/role-selector
// quality instead. Every account still defaults to role "user" at signup
// (docs/AGENTS.md) — professional roles are granted via admin verification after
// signup, never self-service here.
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
  const consent = watch("consent");

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

    toast.success("Account created", {
      description: "Let's get your skin intelligence plan started.",
    });

    // New accounts default to role "user" (defaultRole, lib/auth.ts) regardless of
    // requestedRole — a Consultant/Dermatologist applicant goes straight to their own
    // onboarding wizard (Branch 4/5, docs/DECISIONS.md's professional-verification
    // ADR), which is what flips the role once their application is actually
    // submitted, not this redirect itself. A plain "user" is sent to the guided
    // assessment wizard first (not the plain Skin profile form directly), matching
    // docs/WIREFRAMES.md's documented Registration "success" state (updated
    // 2026-07-09, product-owner decision — assessment results itself offers
    // "Complete your skin profile" as its own next step).
    const onboardingPath: Record<SignupValues["requestedRole"], string> = {
      user: "/assessment",
      consultant: "/consultant-onboarding",
      dermatologist: "/dermatologist-onboarding",
    };
    router.push(onboardingPath[values.requestedRole]);
  };

  return (
    <AuthSplitLayout formClassName="max-w-2xl" sectionClassName="p-6 md:p-8 lg:py-3">
      <div className="border-border bg-card rounded-2xl border p-7 shadow-sm sm:p-8 lg:p-4">
        <header className="mb-4 lg:mb-3">
          <h1 className="font-heading text-on-surface text-xl font-semibold">
            Create your account
          </h1>
          <p className="text-on-surface-variant mt-1 font-sans text-sm">
            Start your personalized skin intelligence plan — it takes less than a minute.
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

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4 lg:gap-1.5">
            <FieldSet>
              <FieldLegend variant="label" className={cn(LABEL_CLASS, "mb-0")}>
                Who are you?
              </FieldLegend>
              <RadioGroup
                value={requestedRole}
                onValueChange={(value) =>
                  setValue("requestedRole", value as SignupValues["requestedRole"])
                }
                aria-label="Who are you?"
                className="gap-1.5"
              >
                {SIGNUP_ROLES.map((role) => {
                  const card = ROLE_CARDS[role];
                  return (
                    <RadioGroupItem
                      key={role}
                      value={role}
                      className={cn(
                        // The base radio-group.tsx style is sized/shaped for a tiny
                        // dot (aspect-square size-4 rounded-full, border-input,
                        // data-checked:border-primary/bg-primary) — every one of
                        // those is overridden below so this renders as a real,
                        // full-width row instead of overflowing a 16px box. Checked
                        // styling is driven by the real data-checked attribute Base
                        // UI sets, not a parallel JS boolean, so it can never drift
                        // out of sync with the actual widget state.
                        // min-w-0: CSS Grid items default to `min-width: auto`, so
                        // without it each row refuses to shrink below its own
                        // content's intrinsic width — the grid (RadioGroup) then
                        // sizes its single implicit column to match, overflowing the
                        // card on narrow viewports (the same class of bug field.tsx's
                        // FieldSet needed fixing for, one level up).
                        "group/role relative flex size-auto aspect-auto w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-border bg-transparent p-2.5 text-left transition-colors sm:gap-3.5 sm:p-3 lg:p-2",
                        "hover:border-secondary/40 hover:bg-muted/60",
                        "focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                        card.checkedClassName
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors lg:size-8",
                          card.iconClassName
                        )}
                      >
                        <card.icon className="size-4.5" strokeWidth={1.75} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-sans text-sm font-semibold text-on-surface">
                          {card.label}
                        </span>
                        <span className="text-on-surface-variant truncate text-xs leading-tight">
                          {card.description}
                        </span>
                      </span>
                      {card.requiresVerification && (
                        <Badge
                          variant="outline"
                          className="text-on-surface-variant hidden shrink-0 font-normal md:inline-flex"
                        >
                          Verification required
                        </Badge>
                      )}
                      {/* Hand-rolled radio dot (not the default RadioGroupItem
                          indicator, unreachable once `children` is passed) — same
                          data-checked-driven visibility as everything else here. */}
                      <span
                        aria-hidden="true"
                        className="border-input flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors group-data-checked/role:border-transparent"
                      >
                        <span
                          className={cn(
                            "size-2.5 scale-0 rounded-full transition-transform group-data-checked/role:scale-100",
                            role === "user" && "bg-secondary",
                            role === "consultant" && "bg-tertiary",
                            role === "dermatologist" && "bg-primary"
                          )}
                        />
                      </span>
                    </RadioGroupItem>
                  );
                })}
              </RadioGroup>
              {ROLE_CARDS[requestedRole].requiresVerification && (
                <FieldDescription className="text-xs leading-snug">
                  {`${ROLE_CARDS[requestedRole].label} accounts require verification. You'll start with standard access and our team will follow up to verify your credentials.`}
                </FieldDescription>
              )}
            </FieldSet>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={!!errors.firstName}>
                <FieldLabel htmlFor="firstName" className={LABEL_CLASS}>
                  First name <span className="text-destructive">*</span>
                </FieldLabel>
                <input
                  id="firstName"
                  autoComplete="given-name"
                  placeholder="Jane"
                  required
                  aria-invalid={!!errors.firstName}
                  className={INPUT_CLASS}
                  {...register("firstName")}
                />
                <FieldError>{errors.firstName?.message}</FieldError>
              </Field>
              <Field data-invalid={!!errors.lastName}>
                <FieldLabel htmlFor="lastName" className={LABEL_CLASS}>
                  Last name <span className="text-destructive">*</span>
                </FieldLabel>
                <input
                  id="lastName"
                  autoComplete="family-name"
                  placeholder="Doe"
                  required
                  aria-invalid={!!errors.lastName}
                  className={INPUT_CLASS}
                  {...register("lastName")}
                />
                <FieldError>{errors.lastName?.message}</FieldError>
              </Field>
            </div>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email" className={LABEL_CLASS}>
                Email address <span className="text-destructive">*</span>
              </FieldLabel>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                aria-invalid={!!errors.email}
                className={INPUT_CLASS}
                {...register("email")}
              />
              <FieldError>{errors.email?.message}</FieldError>
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password" className={LABEL_CLASS}>
                  Password <span className="text-destructive">*</span>
                </FieldLabel>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    required
                    aria-describedby="password-requirements"
                    aria-invalid={!!errors.password}
                    className={cn(INPUT_CLASS, "pr-10")}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="text-on-surface-variant hover:text-on-surface absolute top-1/2 right-4 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="size-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                {/* Static helper text before typing starts, live strength feedback
                    once it has — showing both at once would just repeat the same
                    rules twice and cost extra height for nothing. */}
                {!password && (
                  <FieldDescription id="password-requirements" className="text-xs leading-snug">
                    8+ characters, 1 uppercase letter, 1 number
                  </FieldDescription>
                )}
                {password && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex h-1 flex-1 gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={cn(
                            "flex-1 rounded-full transition-colors",
                            i < strength.score ? STRENGTH_COLORS[strength.score] : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-geist text-on-surface-variant shrink-0 text-xs">
                      {strength.label}
                    </span>
                  </div>
                )}
                <FieldError>{errors.password?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.confirmPassword}>
                <FieldLabel htmlFor="confirmPassword" className={LABEL_CLASS}>
                  Confirm password <span className="text-destructive">*</span>
                </FieldLabel>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  required
                  aria-invalid={!!errors.confirmPassword}
                  className={INPUT_CLASS}
                  {...register("confirmPassword")}
                />
                <FieldError>{errors.confirmPassword?.message}</FieldError>
              </Field>
            </div>

            <Field data-invalid={!!errors.consent}>
              <label className="flex cursor-pointer items-start gap-2">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(checked) => setValue("consent", (checked === true) as true)}
                  aria-invalid={!!errors.consent}
                  className="mt-0.5"
                />
                <span className="text-on-surface-variant font-sans text-sm">
                  I agree to the Terms of Service and Privacy Policy, and consent to my
                  skin-photo data being processed for analysis.
                </span>
              </label>
              <FieldError>{errors.consent?.message}</FieldError>
            </Field>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !consent}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </Button>

            <div className="relative py-1 text-center">
              <span className="font-geist text-on-surface-variant bg-card relative px-3 text-xs uppercase">
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
          </FieldGroup>
        </form>

        <p className="text-on-surface-variant mt-4 text-center font-sans text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-secondary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
