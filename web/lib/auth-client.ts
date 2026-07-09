import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields, jwtClient } from "better-auth/client/plugins";

import type { auth } from "@/lib/auth";

// database_schemas/skinlytics_identity_betterauth.md says Better Auth has no
// `useSession` hook and to poll `getSession()` in an effect — that's stale against the
// installed version (better-auth 1.6.23), which does export `useSession` from
// better-auth/react (see PROGRESS.md). Using the real hook: it's reactive (updates
// automatically on sign-in/out) instead of a manual poll.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  // `inferAdditionalFields<typeof auth>()` is a type-only import of the server config
  // (tree-shaken, never bundled) — gives signUp.email() and the session's `user`
  // object real types for consentAcceptedAt/consentPolicyVersion (lib/auth.ts)
  // instead of silently dropping/untyping them.
  plugins: [jwtClient(), adminClient(), inferAdditionalFields<typeof auth>()],
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
  requestPasswordReset,
  resetPassword,
} = authClient;
