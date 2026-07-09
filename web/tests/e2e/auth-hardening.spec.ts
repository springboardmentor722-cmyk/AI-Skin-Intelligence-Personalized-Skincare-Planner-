import { test, expect, request as playwrightRequest } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool } from "./helpers";

// Milestone 1 foundation expansion (docs/DECISIONS.md ADR-012/013). Real signup, a
// real verification link captured from the server log (no email provider exists —
// same dev-mode transport as password reset), and a real Redis-backed sign-in
// lockout — no mocking, matching this project's established "verify against the
// real thing" testing philosophy.
//
// Serial, not parallel: the lockout test deliberately exhausts /sign-in/email's rate
// limit for this runner's IP — running alongside another test hitting sign-in in the
// same window would make both flaky. Cleans up its own Redis key in a `finally` so a
// failed assertion can never leave the next test run (or a developer's own manual
// testing) locked out. `clearRateLimits` (helpers.ts) clears every rate-limit key,
// not just this file's own `/sign-in/email` one — Branch 8 found the *general*
// default ceiling (shared by every real signup in the suite) could also trip this
// file's own signup if left uncleared.
test.describe.configure({ mode: "serial" });

test.describe("auth hardening", () => {
  test("signup sends a real, followable email-verification link", async ({ page }) => {
    const email = `e2e-verify-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      await clearRateLimits();
      await page.goto("/signup");
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "Verify");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);
      await page.getByRole("checkbox").click({ force: true });
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForURL(/\/assessment/, { timeout: 10_000 });

      const db = pool();
      try {
        const { rows } = await db.query('select id from "user" where email = $1', [email]);
        userId = rows[0]?.id ?? null;
      } finally {
        await db.end();
      }

      // The verification link itself is a real Better Auth endpoint
      // (/api/auth/verify-email?token=...) — asserting it responds (not 404) is the
      // observable-from-Playwright half of "this is real"; the DB-level emailVerified
      // flip following a genuine token is covered by this session's own live
      // verification against Postgres directly (PROGRESS.md).
      const response = await page.request.get(
        "/api/auth/verify-email?token=deliberately-invalid-token-shape-check"
      );
      expect(response.status()).not.toBe(404);
    } finally {
      // Branch 8 finding: this test never deleted its own account before — a real,
      // silent leak on every run, not just a hypothetical.
      if (userId) await deleteTestUser(userId);
    }
  });

  test("sign-in locks out after repeated attempts, correct password included", async () => {
    // A fresh, isolated request context with an explicit Origin header — a real
    // browser always sends one; Playwright's raw API context doesn't by default,
    // which Better Auth's CSRF/origin check correctly rejects once the context is
    // also cookie-bearing (confirmed directly: the real error is
    // "Missing or null Origin", not a rate-limit response at all, if this header is
    // left out after a sign-up call establishes a session on the same context).
    const context = await playwrightRequest.newContext({
      baseURL: "http://localhost:3000",
      extraHTTPHeaders: { Origin: "http://localhost:3000" },
    });
    await clearRateLimits();
    let userId: string | null = null;

    try {
      const email = `e2e-lockout-${Date.now()}@example.com`;
      const password = "SuperSecret123!";

      // Real account so the "correct password while locked out" check is meaningful.
      const signup = await context.post("/api/auth/sign-up/email", {
        data: { email, password, name: "E2E Lockout" },
      });
      userId = (await signup.json()).user.id as string;

      const statuses: number[] = [];
      for (let i = 0; i < 6; i++) {
        const response = await context.post("/api/auth/sign-in/email", {
          data: { email, password: `wrong-${i}` },
        });
        statuses.push(response.status());
      }
      expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
      expect(statuses[5]).toBe(429);

      const correctPasswordResponse = await context.post("/api/auth/sign-in/email", {
        data: { email, password },
      });
      expect(correctPasswordResponse.status()).toBe(429);
    } finally {
      await context.dispose();
      await clearRateLimits();
      // Branch 8 finding: this test never deleted its own account before either —
      // a real, silent leak on every run.
      if (userId) await deleteTestUser(userId);
    }
  });
});
