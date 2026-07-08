"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import {
  passwordStrength,
  registerSchema,
  type RegisterValues,
} from "@/lib/schemas/auth";
import { GoogleIcon } from "@/components/auth/google-icon";
import { cn } from "@/lib/utils";

const STRENGTH_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-warning",
  "bg-secondary",
  "bg-success",
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      consent: false as unknown as true,
    },
  });

  const password = watch("password");
  const strength = passwordStrength(password);

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null);

    const { error } = await authClient.signUp.email({
      name: `${values.firstName} ${values.lastName}`,
      email: values.email,
      password: values.password,
    });

    if (error) {
      setFormError(
        error.status === 422
          ? "That email is already registered."
          : (error.message ?? "Something went wrong. Try again.")
      );
      return;
    }

    // New accounts default to role "user" (defaultRole, lib/auth.ts) — no skin profile
    // exists yet, so this routes to Dashboard until the Skin Profile module lands
    // (PROGRESS.md pending), matching docs/WIREFRAMES.md's real target once it does.
    router.push("/dashboard");
  };

  return (
    <div className="glass w-full max-w-md p-8">
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <input
              id="firstName"
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
              className="bg-muted text-on-surface focus:ring-secondary/40 w-full rounded-lg border-none px-3 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="text-destructive text-xs">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <input
              id="lastName"
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              className="bg-muted text-on-surface focus:ring-secondary/40 w-full rounded-lg border-none px-3 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="text-destructive text-xs">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className="bg-muted text-on-surface focus:ring-secondary/40 w-full rounded-lg border-none px-3 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              className="bg-muted text-on-surface focus:ring-secondary/40 w-full rounded-lg border-none py-2.5 pr-10 pl-3 font-sans text-sm focus:ring-2 focus:outline-none"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-on-surface-variant hover:text-on-surface absolute top-1/2 right-3 -translate-y-1/2"
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
                      i < strength.score
                        ? STRENGTH_COLORS[strength.score]
                        : "bg-muted"
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
            <p className="text-destructive text-xs">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            className="bg-muted text-on-surface focus:ring-secondary/40 w-full rounded-lg border-none px-3 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-destructive text-xs">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-start gap-2">
            <Checkbox
              checked={watch("consent")}
              onCheckedChange={(checked) =>
                setValue("consent", (checked === true) as true)
              }
              className="mt-0.5"
            />
            <span className="text-on-surface-variant font-sans text-sm">
              I agree to the Terms of Service and consent to my skin-photo data
              being processed for analysis.
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
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
          )}
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
        <Link
          href="/login"
          className="text-secondary font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
