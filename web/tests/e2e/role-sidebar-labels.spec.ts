import { test, expect } from "@playwright/test";

import { NAV_SECTIONS, ROLE_HOME, type Role } from "@/lib/nav-config";

import { clearRateLimits, deleteTestUser, pool, promoteRole, signOut } from "./helpers";

// Milestone 2 P2 goal: "every label AND subtitle from UI_SPEC section 3 is present
// per role" — asserted directly against NAV_SECTIONS (lib/nav-config.ts), the single
// source both the sidebar and the vision-diff loop consume, so this test fails the
// moment the config drifts from what's actually rendered, not from a hand-copied
// string list that could itself go stale.
test.describe.configure({ mode: "serial" });

async function signUpAndLand(
  page: import("@playwright/test").Page,
  email: string,
  password: string
): Promise<string> {
  await clearRateLimits();
  await page.goto("/signup");
  await page.fill("#firstName", "Sidebar");
  await page.fill("#lastName", "Test");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.getByRole("checkbox").click({ force: true });
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/assessment/, { timeout: 10_000 });

  const db = pool();
  try {
    const { rows } = await db.query('select id from "user" where email = $1', [email]);
    return rows[0].id as string;
  } finally {
    await db.end();
  }
}

const ROLES: Role[] = ["user", "consultant", "dermatologist", "admin"];

test.describe("role sidebar — every label and subtitle present (UI_SPEC §3)", () => {
  for (const role of ROLES) {
    test(`${role} sidebar shows every configured label and subtitle`, async ({ page }) => {
      const email = `e2e-sidebar-${role}-${Date.now()}@example.com`;
      const password = "SuperSecret123!";
      let userId: string | null = null;

      try {
        userId = await signUpAndLand(page, email, password);
        if (role !== "user") {
          await promoteRole(userId, role);
          await signOut(page.request);
          await clearRateLimits();
          await page.goto("/login");
          await page.fill("#email", email);
          await page.fill("#password", password);
          await page.getByRole("button", { name: /^sign in$/i }).click();
          await page.waitForURL(/\/(dashboard|admin|consultant|dermatologist)/, {
            timeout: 10_000,
          });
        }

        await page.goto(ROLE_HOME[role]);

        for (const section of NAV_SECTIONS[role]) {
          for (const item of section.items) {
            await expect(page.getByText(item.label, { exact: true }).first()).toBeVisible();
            if (item.subtitle) {
              await expect(
                page.getByText(item.subtitle, { exact: true }).first()
              ).toBeVisible();
            }
          }
        }

        // Master prompt §5.6 closing-the-loop screenshot — fed to
        // tools/vision/extract.py strings/diff against the source PNG.
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.screenshot({
          path: `../docs/milestones/milestone_2/build/${role}-dashboard.png`,
          fullPage: false,
        });
      } finally {
        if (userId) await deleteTestUser(userId);
      }
    });
  }
});
