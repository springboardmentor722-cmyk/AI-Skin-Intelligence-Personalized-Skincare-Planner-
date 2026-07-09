import { test, expect, request as playwrightRequest } from "@playwright/test";

import { clearRateLimits, deleteTestUser, promoteRole } from "./helpers";

// Branch 3 (feature/rbac) — the Next.js side of the admin role-assignment wrapper
// (app/api/admin/set-role/route.ts). No admin UI exists yet (Branch 6), so this drives
// the route directly, the same raw-request-context pattern already proven in
// auth-hardening.spec.ts. Promoting a real signed-up user to admin needs a direct
// Postgres write (there is no seed-data admin account). Serial + its own `finally`
// cleanup for the same reason as auth-hardening.spec.ts: real accounts, never left
// behind for the next run. `clearRateLimits` (helpers.ts, Branch 8) before every real
// signup/sign-in — this file's own repeated account creation was found to be able to
// trip the general rate-limit ceiling when run alongside the rest of the suite.
test.describe.configure({ mode: "serial" });

test.describe("admin role-assignment wrapper", () => {
  test("a non-admin session is rejected", async () => {
    await clearRateLimits();
    const context = await playwrightRequest.newContext({
      baseURL: "http://localhost:3000",
      extraHTTPHeaders: { Origin: "http://localhost:3000" },
    });
    let nonAdminId: string | null = null;
    try {
      const email = `e2e-setrole-nonadmin-${Date.now()}@example.com`;
      const password = "SuperSecret123!";
      const signup = await context.post("/api/auth/sign-up/email", {
        data: { email, password, name: "E2E NonAdmin" },
      });
      nonAdminId = (await signup.json()).user.id as string;

      const response = await context.post("/api/admin/set-role", {
        data: { userId: "whatever", role: "admin" },
      });
      expect(response.status()).toBe(403);
    } finally {
      await context.dispose();
      if (nonAdminId) await deleteTestUser(nonAdminId);
    }
  });

  test("an admin changes a real user's role and it's logged to audit_logs", async () => {
    await clearRateLimits();
    const context = await playwrightRequest.newContext({
      baseURL: "http://localhost:3000",
      extraHTTPHeaders: { Origin: "http://localhost:3000" },
    });
    let adminId: string | null = null;
    let targetId: string | null = null;

    try {
      const password = "SuperSecret123!";
      const adminEmail = `e2e-setrole-admin-${Date.now()}@example.com`;
      const targetEmail = `e2e-setrole-target-${Date.now()}@example.com`;

      const adminSignup = await context.post("/api/auth/sign-up/email", {
        data: { email: adminEmail, password, name: "E2E Admin" },
      });
      adminId = (await adminSignup.json()).user.id as string;

      const targetSignup = await context.post("/api/auth/sign-up/email", {
        data: { email: targetEmail, password, name: "E2E Target" },
      });
      targetId = (await targetSignup.json()).user.id as string;

      await promoteRole(adminId, "admin");
      // Better Auth caches the session's user snapshot at sign-in time — the DB write
      // above doesn't retroactively update the already-established session, so a
      // fresh sign-in is required to pick up the new role (confirmed live, same
      // finding as the manual verification this branch's commit describes).
      await context.post("/api/auth/sign-out");
      await clearRateLimits();
      await context.post("/api/auth/sign-in/email", { data: { email: adminEmail, password } });

      const response = await context.post("/api/admin/set-role", {
        data: { userId: targetId, role: "consultant", reason: "e2e verification" },
      });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.user.role).toBe("consultant");
    } finally {
      await context.dispose();
      if (adminId) await deleteTestUser(adminId);
      if (targetId) await deleteTestUser(targetId);
    }
  });
});
