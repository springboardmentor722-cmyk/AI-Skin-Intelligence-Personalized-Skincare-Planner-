import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, promoteRole, signOut } from "./helpers";

// /login and /signup previously had no session awareness at all: an
// already-authenticated visitor (browser tab left open, back button, a hand-typed
// URL) was shown the form again instead of being sent to their own dashboard, the
// same bug class as the landing page's header/hero/CTAs (authenticated-landing-
// header.spec.ts). Reuses lib/use-current-user.ts, not a new auth check.
test.describe.configure({ mode: "serial" });

test.describe("auth pages redirect an already-authenticated visitor", () => {
  test("unauthenticated visitor still sees the login and signup forms, unchanged", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();

    await page.goto("/signup");
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("a signed-in user visiting /login or /signup is redirected to their dashboard", async ({
    page,
  }) => {
    const email = `e2e-authredirect-user-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      await clearRateLimits();
      await page.goto("/signup");
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "AuthRedirect");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);
      await page.getByRole("checkbox").click({ force: true });
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForURL(/\/assessment/, { timeout: 10_000 });

      const lookupDb = pool();
      try {
        const { rows } = await lookupDb.query('select id from "user" where email = $1', [email]);
        userId = rows[0]?.id ?? null;
      } finally {
        await lookupDb.end();
      }

      await page.goto("/login");
      await page.waitForURL(/\/dashboard/, { timeout: 5000 });
      await expect(page.getByRole("button", { name: /^sign in$/i })).toHaveCount(0);

      await page.goto("/signup");
      await page.waitForURL(/\/dashboard/, { timeout: 5000 });
      await expect(page.getByRole("button", { name: /create account/i })).toHaveCount(0);
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test("a signed-in admin visiting /login is sent to /admin/dashboard, not /dashboard", async ({
    page,
  }) => {
    const email = `e2e-authredirect-admin-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      await clearRateLimits();
      await page.goto("/signup");
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "AuthRedirectAdmin");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);
      await page.getByRole("checkbox").click({ force: true });
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForURL(/\/assessment/, { timeout: 10_000 });

      const lookupDb = pool();
      try {
        const { rows } = await lookupDb.query('select id from "user" where email = $1', [email]);
        userId = rows[0]?.id ?? null;
      } finally {
        await lookupDb.end();
      }
      expect(userId).not.toBeNull();
      await promoteRole(userId as string, "admin");

      // promoteRole updates the DB directly; the session already held by the
      // browser was created at signup with the old "user" role and won't pick up
      // the change until it's replaced by a fresh sign-in (same reasoning as
      // admin-panel.spec.ts's signInAsAdmin helper).
      await signOut(page.request);
      await clearRateLimits();
      await page.goto("/login");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.getByRole("button", { name: /^sign in$/i }).click();
      await page.waitForURL(/\/admin\/dashboard/, { timeout: 10_000 });

      await page.goto("/login");
      await page.waitForURL(/\/admin\/dashboard/, { timeout: 5000 });
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test("/login?from=... is still honored for an already-authenticated visitor", async ({
    page,
  }) => {
    const email = `e2e-authredirect-from-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      await clearRateLimits();
      await page.goto("/signup");
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "AuthRedirectFrom");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);
      await page.getByRole("checkbox").click({ force: true });
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForURL(/\/assessment/, { timeout: 10_000 });

      const lookupDb = pool();
      try {
        const { rows } = await lookupDb.query('select id from "user" where email = $1', [email]);
        userId = rows[0]?.id ?? null;
      } finally {
        await lookupDb.end();
      }

      await page.goto("/login?from=%2Fsettings");
      await page.waitForURL(/\/settings/, { timeout: 5000 });
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });
});
