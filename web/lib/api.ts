import createClient from "openapi-fetch";

import { authClient } from "@/lib/auth-client";
import type { paths } from "@/lib/api-types";

// Typed FastAPI client — CONVENTIONS.md "Data: TanStack Query -> lib/api.ts (attaches
// the Better Auth JWT)". Types come from the real OpenAPI spec (`make openapi`), never
// hand-written (CONVENTIONS.md). `authClient.token()` mints a fresh short-lived JWT
// per Better Auth's JWT plugin — no manual token storage/refresh here.
export const api = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
});

api.use({
  async onRequest({ request }) {
    // jwtClient() only wraps a jwks() convenience action — GET /token isn't wrapped
    // with a named method, so it's called through the client's generic $fetch.
    // Confirmed working directly against the server (curl) before wiring this.
    const { data } = await authClient.$fetch<{ token: string }>("/token");
    if (data?.token) {
      request.headers.set("Authorization", `Bearer ${data.token}`);
    }
    return request;
  },
});
