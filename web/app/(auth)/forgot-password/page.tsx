"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/schemas/auth";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setFormError(null);
    // Always show the same success state regardless of whether the email exists —
    // don't leak account existence via a different response. `error` (not a thrown
    // rejection) is Better Auth's client convention for a failed request — the
    // previous version of this handler didn't check it at all, so a real failure
    // (e.g. reset temporarily disabled) left the user stuck on the form with no
    // feedback and no way to tell the request had failed.
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    if (error) {
      setFormError(error.message ?? "Couldn't send the reset link. Please try again.");
      return;
    }
    setSent(true);
  };

  return (
    <div className="border-border bg-card w-full max-w-md rounded-2xl border p-8">
      {sent ? (
        <div className="text-center">
          <CheckCircle2
            className="text-success mx-auto size-10"
            strokeWidth={1.5}
          />
          <h1 className="font-heading text-on-surface mt-4 text-xl font-semibold">
            Check your email
          </h1>
          <p className="text-on-surface-variant mt-2 font-sans text-sm">
            If an account exists for that address, we&apos;ve sent a link to
            reset your password.
          </p>
          <Link
            href="/login"
            className="text-secondary mt-6 inline-flex items-center gap-1 font-sans text-sm hover:underline"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <header className="mb-6">
            <h1 className="font-heading text-on-surface text-xl font-semibold">
              Reset your password
            </h1>
            <p className="text-on-surface-variant mt-1 font-sans text-sm">
              Enter the email on your account and we&apos;ll send a reset link.
            </p>
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
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
                <p className="text-destructive text-xs">
                  {errors.email.message}
                </p>
              )}
            </div>

            {formError && (
              <p className="text-destructive flex items-center gap-1.5 text-xs">
                <AlertCircle className="size-3.5 shrink-0" strokeWidth={1.5} />
                {formError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
              )}
              Send reset link
            </Button>
          </form>

          <Link
            href="/login"
            className="text-on-surface-variant hover:text-on-surface mt-6 flex items-center justify-center gap-1 font-sans text-sm"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}
