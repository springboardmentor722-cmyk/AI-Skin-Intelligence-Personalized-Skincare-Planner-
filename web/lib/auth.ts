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
