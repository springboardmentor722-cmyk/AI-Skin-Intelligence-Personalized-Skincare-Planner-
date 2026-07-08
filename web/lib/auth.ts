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
