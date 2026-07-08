import { createAuthClient } from "better-auth/react";
import { adminClient, jwtClient } from "better-auth/client/plugins";

// database_schemas/skinlytics_identity_betterauth.md says Better Auth has no
// `useSession` hook and to poll `getSession()` in an effect — that's stale against the
// installed version (better-auth 1.6.23), which does export `useSession` from
// better-auth/react (see PROGRESS.md). Using the real hook: it's reactive (updates
// automatically on sign-in/out) instead of a manual poll.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [jwtClient(), adminClient()],
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
  requestPasswordReset,
  resetPassword,
} = authClient;
