import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, promoteRole, signOut } from "./helpers";

// Milestone 2 P4 — Admin dashboard's 4-row rebuild (MILESTONE_2_UI_SPEC.md §4.4,
// docs/DECISIONS.md ADR-023). Confirms both the real KPIs (platform_counts,
// top_concerns — the two backend additions this phase made) and the documented
// fixture-only cells render without error.
test("admin dashboard renders all 4 rows with real platform counts", async ({ page }) => {
  const email = `e2e-admin-dashboard-${Date.now()}@example.com`;
  const password = "SuperSecret123!";
  let userId: string | null = null;

  try {
    await clearRateLimits();
    await page.goto("/signup");
    await page.fill("#firstName", "Admin");
    await page.fill("#lastName", "Dashboard");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.fill("#confirmPassword", password);
    await page.getByRole("checkbox").click({ force: true });
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL(/\/assessment/, { timeout: 10_000 });

    const db = pool();
    try {
      const { rows } = await db.query('select id from "user" where email = $1', [email]);
      userId = rows[0].id as string;
    } finally {
      await db.end();
    }
    await promoteRole(userId, "admin");
    await signOut(page.request);
    await clearRateLimits();
    await page.goto("/login");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL(/\/admin/, { timeout: 10_000 });

    await page.goto("/admin/dashboard");

    // Row 1 — 6 KPIs, 4 real + 2 fixture (ADR-023)
    for (const label of [
      "Total Users",
      "Assessments Completed",
      "Active Routines",
      "Total Products",
      "Platform Revenue",
      "System Uptime",
    ]) {
      await expect(page.getByText(label).first()).toBeVisible({ timeout: 10_000 });
    }

    // Row 2
    for (const label of ["User Overview", "User Growth", "Assessments Overview"]) {
      await expect(page.getByText(label).first()).toBeVisible();
    }

    // Row 3
    for (const label of ["Top Skin Concerns", "Revenue Overview", "Recent Activity"]) {
      await expect(page.getByText(label).first()).toBeVisible();
    }

    // Row 4
    for (const label of ["System Health", "Quick Actions", "Platform Analytics"]) {
      await expect(page.getByText(label).first()).toBeVisible();
    }

    // Master prompt §5.6 closing-the-loop screenshot for tools/vision/extract.py.
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.screenshot({
      path: "../docs/milestones/milestone_2/build/admin-dashboard.png",
      fullPage: false,
    });
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});
