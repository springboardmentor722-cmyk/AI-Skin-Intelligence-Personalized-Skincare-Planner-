import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin, jwt } from "better-auth/plugins";
import { Pool } from "pg";

import {
  accessControl,
  adminRole,
  consultantRole,
  dermatologistRole,
  userRole,
} from "@/lib/permissions";

// Better Auth is the single auth authority — ADR-002/003. FastAPI never mints tokens,
// only validates (backend/app/core/security.py). Config verbatim from
// database_schemas/skinlytics_identity_betterauth.md.
export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    // Milestone 1 audit finding: without this callback Better Auth's own
    // /reset-password endpoint hard-rejects every request with `RESET_PASSWORD_DISABLED`
    // (node_modules/better-auth/dist/api/routes/password.mjs) — the forgot-password
    // form looked functional (real request, real UI) but silently could never work.
    // No email-sending integration exists anywhere in this project yet (confirmed —
    // docs/DATASETS_AND_APIS.md's external-services list has none, same gap ADR-011
    // already documents for email verification) — standing one up is a real,
    // separate infra decision (provider, API key, deliverability), not something to
    // invent here. This makes the reset flow genuinely work end-to-end in dev/local
    // by logging the reset link server-side instead of emailing it — same
    // "contract-first, real stub" treatment ADR-007 gives the AI surfaces. Swap the
    // body for a real adapter call once a provider is chosen; nothing else in the
    // reset flow (this callback's signature, the /reset-password page) needs to
    // change when that happens.
    sendResetPassword: async ({ user, url }) => {
      console.log(
        `[auth] Password reset requested for ${user.email} — no email adapter configured yet, reset link: ${url}`
      );
    },
  },
  socialProviders: {
    // Real provider config so the button works the moment real credentials land in
    // .env — no code change needed. Empty strings until then (never invent secrets).
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  // ADR-011 (docs/DECISIONS.md) — without this, "Sign in with Google" on an email that
  // already has a password account permanently 500s with `account_not_linked`, for
  // *every* such user, forever: Better Auth's default linking guard also requires the
  // *existing local* account's email to already be verified
  // (node_modules/better-auth/dist/oauth2/link-account.mjs — `requireLocalEmailVerified`,
  // default true, ANDed independently of `trustedProviders`), and this app has no
  // email-verification flow, so `user.emailVerified` is always false for every
  // email/password signup. `trustedProviders` alone (trusting Google's own verified
  // email) does not bypass that separate check.
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: false,
    },
  },
  // Milestone 1 audit finding: docs/WIREFRAMES.md's Registration accept criteria
  // ("consent stored with timestamp + policy version; no account without consent")
  // and docs/SUGGESTIONS.md's P0 "consent ledger" were never actually implemented —
  // the signup form's consent checkbox only gated the client-side Zod submit handler
  // (lib/schemas/auth.ts's `consent: z.literal(true)`); nothing was ever sent to or
  // stored by the backend. Optional, not required at the field level, since the
  // Google OAuth signup path doesn't go through this form/checkbox at all — closing
  // that gap (a consent step for social signup) is separate, out-of-scope work.
  user: {
    additionalFields: {
      consentAcceptedAt: { type: "date", required: false, input: true },
      consentPolicyVersion: { type: "string", required: false, input: true },
    },
  },
  plugins: [
    // Issues JWTs + exposes JWKS at /api/auth/jwks (creates the `jwks` table).
    jwt(),
    admin({
      ac: accessControl,
      roles: {
        user: userRole,
        consultant: consultantRole,
        dermatologist: dermatologistRole,
        admin: adminRole,
      },
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    // Must be last — lets server actions set cookies via Next.js's cookies() API.
    nextCookies(),
  ],
  // IDs: keep Better Auth defaults (string). Do NOT set useNumberId (ADR-003).
});
