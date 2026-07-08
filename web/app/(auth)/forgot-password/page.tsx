"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/schemas/auth";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    // Always show the same success state regardless of whether the email exists —
    // don't leak account existence via a different response.
    await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    setSent(true);
  };

  return (
    <div className="glass w-full max-w-md p-8">
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
