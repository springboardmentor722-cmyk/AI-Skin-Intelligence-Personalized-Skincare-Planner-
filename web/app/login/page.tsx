"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { loginSchema, type LoginValues } from "@/lib/schemas/auth";
import { GoogleIcon } from "@/components/auth/google-icon";

// web/designs/wireframes/login.html — the form panel is a solid "diagnostic module"
// card, not glass (docs/DESIGN.md §3: glass is forbidden under forms — it frames data,
// never backgrounds it). Only the left branding panel (AuthSplitLayout) is glass.
export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);

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

    const { error } = await authClient.signIn.email({
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

    // Redirects to /dashboard for now — routing to Skin profile when none exists yet
    // waits on that service existing (PROGRESS.md pending: User Profile module).
    router.push("/dashboard");
  };

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
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
