"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/schemas/auth";

// The page Better Auth's own /reset-password/:token callback redirects the browser to
// (web/lib/auth.ts's sendResetPassword builds that link) — it appends the verified
// token as ?token=, which resetPassword() below sends back to confirm the change.
// Previously this page didn't exist at all: forgot-password's redirectTo pointed here
// and 404'd (Milestone 1 audit finding), and the request itself failed server-side
// regardless (RESET_PASSWORD_DISABLED — no sendResetPassword configured, fixed
// alongside this in the same change).
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<div className="border-border bg-card w-full max-w-md rounded-2xl border p-8" />}
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) return;
    setFormError(null);
    const { error } = await authClient.resetPassword({
      newPassword: values.newPassword,
      token,
    });
    if (error) {
      setFormError(error.message ?? "Couldn't reset your password. Request a new link and try again.");
      return;
    }
    setDone(true);
  };

  return (
    <div className="border-border bg-card w-full max-w-md rounded-2xl border p-8">
      {!token ? (
        <div className="text-center">
          <AlertCircle className="text-destructive mx-auto size-10" strokeWidth={1.5} />
          <h1 className="font-heading text-on-surface mt-4 text-xl font-semibold">
            Invalid or expired link
          </h1>
          <p className="text-on-surface-variant mt-2 font-sans text-sm">
            This password reset link is missing its token — request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="text-secondary mt-6 inline-flex items-center gap-1 font-sans text-sm hover:underline"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Request a new link
          </Link>
        </div>
      ) : done ? (
        <div className="text-center">
          <CheckCircle2 className="text-success mx-auto size-10" strokeWidth={1.5} />
          <h1 className="font-heading text-on-surface mt-4 text-xl font-semibold">
            Password updated
          </h1>
          <p className="text-on-surface-variant mt-2 font-sans text-sm">
            Your password has been reset — sign in with your new password.
          </p>
          <Button className="mt-6 w-full" size="lg" onClick={() => router.push("/login")}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <>
          <header className="mb-6">
            <h1 className="font-heading text-on-surface text-xl font-semibold">
              Set a new password
            </h1>
            <p className="text-on-surface-variant mt-1 font-sans text-sm">
              Choose a new password for your account.
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
                className="bg-muted text-on-surface focus:ring-secondary/40 w-full rounded-lg border-none px-3 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-destructive text-xs">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                className="bg-muted text-on-surface focus:ring-secondary/40 w-full rounded-lg border-none px-3 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>
              )}
            </div>

            {formError && (
              <p className="text-destructive flex items-center gap-1.5 text-xs">
                <AlertCircle className="size-3.5 shrink-0" strokeWidth={1.5} />
                {formError}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />}
              Reset password
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
