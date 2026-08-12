"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { loginSchema, type LoginValues } from "@/lib/schemas/auth";
import { ROLE_HOME, roleOwnsPath, type Role } from "@/lib/nav-config";
import { useCurrentUser } from "@/lib/use-current-user";
import { GoogleIcon } from "@/components/auth/google-icon";

// web/designs/wireframes/login.html — the form panel is a solid "diagnostic module"
// card, not glass (docs/DESIGN.md §3: glass is forbidden under forms — it frames data,
// never backgrounds it). Only the left branding panel (AuthSplitLayout) is glass.
// Only accept a same-origin relative path — `from` is attacker-controllable (a
// hand-crafted /login?from=... link) — this guards against an open-redirect
// (`//evil.com`, `https://evil.com`, etc.) rather than trusting the query param
// outright. Falls back to `fallback` (the signed-in account's own ROLE_HOME), not a
// hardcoded "/dashboard" — that hardcoding used to send every role, including admin,
// to the User dashboard regardless of who actually signed in.
//
// Also requires `from` to actually belong to the signed-in `role` (roleOwnsPath) —
// found live: sign out of one role (proxy.ts's redirect sets ?from=<that role's path>),
// then sign in as a DIFFERENT role on the same still-open /login tab without a fresh
// navigation. The stale `from` from the previous role got trusted unconditionally,
// sending the new sign-in to a dashboard its role doesn't own, which that page's own
// role guard (app/*/layout.tsx) would then redirect away from — a real, separate
// correctness bug (a wrong intermediate landing page) independent of the hard-
// navigation fix below (onSubmit's own comment) for the actual stuck-forever hang.
function safeRedirectTarget(from: string | null, role: Role, fallback: string): string {
  if (from && from.startsWith("/") && !from.startsWith("//") && roleOwnsPath(role, from)) {
    return from;
  }
  return fallback;
}

// useSearchParams (for the post-login ?from= redirect target) requires a Suspense
// boundary around any client component that calls it, or `next build` fails
// prerendering this route — the form itself has no meaningful fallback UI to show
// during the sub-millisecond gap, so the fallback is just the same page shell.
export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSplitLayout><div className="border-border bg-card rounded-2xl border p-8" /></AuthSplitLayout>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);

  // A visitor who already holds a valid session (browser tab left open, back
  // button, a hand-typed /login) shouldn't be asked to sign in again — same
  // useCurrentUser() every other session-aware surface in this app already shares,
  // not a second auth-reading implementation. `from` is still honored so this
  // plays nice with the "session expired mid-page, redirected here" flow too.
  //
  // Checked once, on initial mount, not reactively on every `role` change: a
  // *successful sign-in on this very page* also flips `role` from null to a real
  // value, which would otherwise race this effect against onSubmit's own explicit
  // redirect below — whichever navigation call landed last would silently win.
  // `checkedInitialSession` gates this to "was there already a session when this
  // page loaded," never "did a role change happen for any reason."
  const { role, isPending } = useCurrentUser();
  const checkedInitialSession = useRef(false);

  useEffect(() => {
    if (isPending || checkedInitialSession.current) return;
    checkedInitialSession.current = true;
    if (role) {
      // Hard navigation (window.location), not router.replace() — the reproduced,
      // confirmed race is on onSubmit's post-sign-in redirect below (its own comment
      // has the full evidence); this path reads the exact same `role` from the exact
      // same useCurrentUser() call inside the same component, so it's exposed to the
      // identical hazard shape even though it wasn't independently reproduced here —
      // matching mechanisms, not an unproven guess applied for its own sake.
      window.location.replace(safeRedirectTarget(searchParams.get("from"), role, ROLE_HOME[role]));
    }
  }, [isPending, role, searchParams]);

  useEffect(() => {
    if (!rateLimitedUntil) return;
    const timer = setTimeout(
      () => setRateLimitedUntil(null),
      rateLimitedUntil - Date.now()
    );
    return () => clearTimeout(timer);
  }, [rateLimitedUntil]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    setRateLimitedUntil(null);

    const { data, error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,
    });

    if (error) {
      if (error.status === 429) {
        // Better Auth's typed client error doesn't surface the Retry-After header
        // value here, only the status — a generic wait message is what's actually
        // available, not a precise countdown.
        setRateLimitedUntil(Date.now() + 60_000);
        setFormError("Too many attempts. Wait a minute and try again.");
      } else {
        setFormError(error.message ?? "Incorrect email or password.");
      }
      return;
    }

    // Redirects back to a same-origin ?from= if one was given, else the signed-in
    // account's own role home (ROLE_HOME) — never a hardcoded "/dashboard" (that's
    // the User role's home, not a universal default; an admin/consultant/
    // dermatologist account landing there used to be rendered as a plain user).
    const signedInRole = data.user.role as Role;
    const fallback = ROLE_HOME[signedInRole] ?? "/dashboard";
    // A hard navigation (window.location.replace), not router.push — found live,
    // reproduced 5+ times via real sign-ins: App Router's client-side transition
    // renders the target route more than once before committing (same framework
    // behavior PROGRESS.md's 2026-07-15 assessment/results bug already hit), and
    // during that window this page's own render — gated on `role` from
    // useCurrentUser(), which flips true the instant signIn.email() resolves —
    // can win the commit race and get stuck showing its own "already signed in"
    // spinner forever instead of the target page ever landing. A hard navigation
    // is a real browser navigation, not a React transition, so it isn't subject
    // to that race at all — matches the fact that every hard/full navigation in
    // testing landed correctly on the first try, every client-side push did not.
    // `.replace`, not a plain href assignment, so a signed-in visitor pressing Back
    // never lands on the login form they just submitted (matches the mount-effect's
    // own `.replace` above).
    window.location.replace(safeRedirectTarget(searchParams.get("from"), signedInRole, fallback));
  };

  if (isPending || role) {
    return (
      <AuthSplitLayout>
        <div className="border-border bg-card flex min-h-[420px] items-center justify-center rounded-2xl border p-8">
          <Loader2 className="text-on-surface-variant size-6 animate-spin" strokeWidth={1.5} />
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <div className="border-border bg-card rounded-2xl border p-8">
        <header className="mb-6">
          <h1 className="font-heading text-on-surface text-xl font-semibold">
            Secure sign in
          </h1>
          <p className="text-on-surface-variant mt-1 font-sans text-sm">
            Enter your credentials to continue.
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

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail
                className="text-on-surface-variant absolute top-1/2 left-4 size-4 -translate-y-1/2"
                strokeWidth={1.5}
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="bg-muted text-on-surface placeholder:text-on-surface-variant/60 focus:ring-secondary/40 w-full rounded-full border-none py-2.5 pr-3 pl-11 font-sans text-sm focus:ring-2 focus:outline-none"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-destructive text-xs">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-secondary font-sans text-xs hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock
                className="text-on-surface-variant absolute top-1/2 left-4 size-4 -translate-y-1/2"
                strokeWidth={1.5}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className="bg-muted text-on-surface placeholder:text-on-surface-variant/60 focus:ring-secondary/40 w-full rounded-full border-none py-2.5 pr-10 pl-11 font-sans text-sm focus:ring-2 focus:outline-none"
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
            {errors.password && (
              <p id="password-error" className="text-destructive text-xs">
                {errors.password.message}
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={watch("rememberMe")}
              onCheckedChange={(checked) =>
                setValue("rememberMe", checked === true)
              }
            />
            <span className="text-on-surface-variant font-sans text-sm">
              Remember me
            </span>
          </label>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || !!rateLimitedUntil}
          >
            {isSubmitting && (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            )}
            Sign in
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
          New to Skinlytics?{" "}
          <Link
            href="/signup"
            className="text-secondary font-medium hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
