import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, promoteRole, signOut } from "./helpers";

// Branch 6 (feature/admin-panel) — drives the real admin UI (not raw API calls) for
// the three highest-value new screens: Users (search/ban/unban), the verification
// queue (review + approve), and the dashboard's real stats. Promoting a real
// signed-up user to admin needs a direct Postgres write (no seed-data admin exists),
// same pattern as admin-rbac.spec.ts. Serial + its own `finally` cleanup.
// `clearRateLimits` (helpers.ts, Branch 8) before every real signup/sign-in.
test.describe.configure({ mode: "serial" });

async function signInAsAdmin(
  page: import("@playwright/test").Page,
  email: string,
  password: string
): Promise<void> {
  await clearRateLimits();
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 10_000 });
}

test.describe("admin panel", () => {
  test("dashboard shows real stats, users page bans and unbans a real account", async ({
    page,
  }) => {
    const password = "SuperSecret123!";
    const adminEmail = `e2e-adminpanel-admin-${Date.now()}@example.com`;
    const targetEmail = `e2e-adminpanel-target-${Date.now()}@example.com`;
    let adminId: string | null = null;
    let targetId: string | null = null;

    try {
      await clearRateLimits();
      await page.goto("/signup");
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "Admin");
      await page.fill("#email", adminEmail);
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);
      await page.getByRole("checkbox").click({ force: true });
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForURL(/\/assessment/, { timeout: 10_000 });

      const db = pool();
      try {
        const adminResult = await db.query('select id from "user" where email = $1', [
          adminEmail,
        ]);
        adminId = adminResult.rows[0].id as string;
      } finally {
        await db.end();
      }

      const targetSignupResponse = await page.request.post("/api/auth/sign-up/email", {
        data: { email: targetEmail, password, name: "E2E Target" },
        headers: { Origin: "http://localhost:3000" },
      });
      targetId = (await targetSignupResponse.json()).user.id as string;

      await promoteRole(adminId, "admin");
      await signOut(page.request);
      await signInAsAdmin(page, adminEmail, password);

      // Dashboard: real KPI cards (Milestone 2 P4 layout — MILESTONE_2_UI_SPEC.md
      // §4.4, docs/DECISIONS.md ADR-023). "Admin dashboard" -> the real greeting
      // copy; "Consultants" moved from its own KPI card into the User Overview
      // donut's legend, still real data either way.
      await page.goto("/admin/dashboard");
      await expect(page.getByText(/welcome back, admin/i)).toBeVisible();
      await expect(page.getByText("Consultants", { exact: true })).toBeVisible();

      // Users: search for the throwaway target, ban it, confirm the badge flips.
      await page.goto("/admin/users");
      await page.getByPlaceholder("Search by email").fill(targetEmail);
      const targetRow = page.locator("tr", { hasText: targetEmail });
      await expect(targetRow).toBeVisible({ timeout: 10_000 });
      await targetRow.getByRole("button", { name: /^ban$/i }).click();
      await expect(targetRow.getByText("Banned")).toBeVisible({ timeout: 10_000 });

      await targetRow.getByRole("button", { name: /^unban$/i }).click();
      await expect(targetRow.getByText("Active")).toBeVisible({ timeout: 10_000 });
    } finally {
      if (adminId) await deleteTestUser(adminId);
      if (targetId) await deleteTestUser(targetId);
    }
  });

  test("verification queue approves a real pending consultant application", async ({
    page,
  }) => {
    const password = "SuperSecret123!";
    const adminEmail = `e2e-adminpanel-verify-${Date.now()}@example.com`;
    let adminId: string | null = null;
    let consultantId: string | null = null;

    try {
      await clearRateLimits();
      await page.goto("/signup");
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "VerifyAdmin");
      await page.fill("#email", adminEmail);
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);
      await page.getByRole("checkbox").click({ force: true });
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForURL(/\/assessment/, { timeout: 10_000 });

      const db = pool();
      try {
        const adminResult = await db.query('select id from "user" where email = $1', [
          adminEmail,
        ]);
        adminId = adminResult.rows[0].id as string;

        // A real pending consultant, created directly (the onboarding wizard itself
        // is covered end to end by consultant-onboarding.spec.ts — this test's job
        // is the admin review side, not re-proving submission).
        consultantId = `e2e-verify-consultant-${Date.now()}`;
        await db.query(
          'insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role) ' +
            "values ($1, $2, $3, false, now(), now(), 'consultant')",
          [consultantId, "E2E Pending Consultant", `${consultantId}@example.com`]
        );
        await db.query(
          "insert into consultant_profiles " +
            "(user_id, qualifications, biography, phone, verification_status, submitted_at) " +
            "values ($1, 'MD, Dermatology', 'Test bio', '+1 555 000 0000', 'pending', now())",
          [consultantId]
        );
      } finally {
        await db.end();
      }

      await promoteRole(adminId, "admin");
      await signOut(page.request);
      await signInAsAdmin(page, adminEmail, password);

      await page.goto("/admin/users/verification");
      const row = page.locator("tr", { hasText: consultantId });
      await expect(row).toBeVisible({ timeout: 10_000 });
      await row.getByRole("button", { name: /review/i }).click();

      await page.waitForURL(new RegExp(`/admin/users/verification/consultant/${consultantId}`));
      await expect(page.getByText("MD, Dermatology")).toBeVisible();
      await page.getByRole("button", { name: /^approve$/i }).click();

      await expect(page.getByText(/approved/i)).toBeVisible({ timeout: 10_000 });

      const verifyDb = pool();
      try {
        const result = await verifyDb.query(
          "select verification_status from consultant_profiles where user_id = $1",
          [consultantId]
        );
        expect(result.rows[0].verification_status).toBe("approved");
      } finally {
        await verifyDb.end();
      }
    } finally {
      // consultantId first: its consultant_profiles row's reviewed_by FK points at
      // adminId once approved, so deleting adminId first would violate that FK.
      if (consultantId) await deleteTestUser(consultantId);
      if (adminId) await deleteTestUser(adminId);
    }
  });
});
