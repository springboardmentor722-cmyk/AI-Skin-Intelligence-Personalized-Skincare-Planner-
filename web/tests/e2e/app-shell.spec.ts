import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, promoteRole, signOut } from "./helpers";

// Rewritten for Branch 8 (feature/testing) — this file predated two real changes and
// had been failing (or asserting things that were never quite true) ever since:
// (1) proxy.ts's route protection (Milestone 1 audit) means every one of these routes
// now requires a real signed-in session, not just a visit; (2) the M1 audit's
// disabled-nav-item pattern meant an unbuilt nav item rendered as a disabled
// <button>, never a real link. Milestone 2 P2 replaced that pattern: every item is
// now a real Link to a titled empty-state stub page (app-sidebar.tsx,
// components/app-shell/coming-soon.tsx) — "zero href='#', zero dead links" — so a
// role's full nav, built or not, is link-navigable. Rewritten against the actual
// current DOM (verified live) rather than patched piecemeal.
test.describe.configure({ mode: "serial" });

async function signUpAndLand(
  page: import("@playwright/test").Page,
  email: string,
  password: string
): Promise<string> {
  await clearRateLimits();
  await page.goto("/signup");
  await page.fill("#firstName", "Shell");
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

async function signIn(
  page: import("@playwright/test").Page,
  email: string,
  password: string
): Promise<void> {
  await clearRateLimits();
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/(dashboard|admin|consultant|dermatologist)/, { timeout: 10_000 });
}

test.describe("app shell", () => {
  test("User role shows its AGENTS.md nav list", async ({ page }) => {
    const email = `e2e-shell-user-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      userId = await signUpAndLand(page, email, password);
      await page.goto("/dashboard");

      // Labels per lib/nav-config.ts's Milestone 2 P2 transcription of UI_SPEC.md §3
      // ("Product Recommendations" was "Products", "Progress Tracking" was
      // "Progress", "Lifestyle & Habits" was "Daily Check-in") — all real links now
      // (P2 replaced the disabled-placeholder pattern with real stub pages).
      for (const label of [
        "Dashboard",
        "My Routine",
        "Lifestyle & Habits",
        "Product Recommendations",
        "Progress Tracking",
        "Settings",
      ]) {
        await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
      }

      // Dashboard is the active item — the real shadcn Sidebar marks this via a
      // boolean-style data-active attribute (present with an empty value, not
      // data-active="true"), not aria-current.
      await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
        "data-active",
        ""
      );
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test("Consultant/Admin routes are prefixed and don't collide", async ({ page }) => {
    const password = "SuperSecret123!";
    const consultantEmail = `e2e-shell-consultant-${Date.now()}@example.com`;
    const adminEmail = `e2e-shell-admin-${Date.now()}@example.com`;
    let consultantId: string | null = null;
    let adminId: string | null = null;

    try {
      consultantId = await signUpAndLand(page, consultantEmail, password);
      await promoteRole(consultantId, "consultant");
      await signOut(page.request);
      await signIn(page, consultantEmail, password);
      await page.goto("/consultant/dashboard");
      await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
        "href",
        "/consultant/dashboard"
      );

      await signOut(page.request);

      adminId = await signUpAndLand(page, adminEmail, password);
      await promoteRole(adminId, "admin");
      await signOut(page.request);
      await signIn(page, adminEmail, password);
      await page.goto("/admin/dashboard");
      await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
        "href",
        "/admin/dashboard"
      );
      // Users (admin) is a real built item (Branch 6) — a genuinely distinct route
      // prefix from the consultant/admin "Dashboard" links checked above.
      await expect(page.getByRole("link", { name: "Users" })).toHaveAttribute(
        "href",
        "/admin/users"
      );
    } finally {
      if (consultantId) await deleteTestUser(consultantId);
      if (adminId) await deleteTestUser(adminId);
    }
  });

  test("sidebar collapse hides nav labels", async ({ page }) => {
    const email = `e2e-shell-collapse-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      userId = await signUpAndLand(page, email, password);
      await page.goto("/dashboard");

      await expect(page.getByText("My Routine", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Toggle Sidebar" }).first().click();
      await expect(page.getByText("My Routine", { exact: true })).toBeHidden();
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test("collapsed sidebar centers nav icons in their button box", async ({ page }) => {
    // Regression guard for a real bug: the shared collapsed-icon square
    // (group-data-[collapsible=icon]:size-8!/p-2! in ui/sidebar.tsx) has no
    // justify-center of its own, so once the label span is hidden the icon sat
    // flush at the flex-start edge instead of centered under its active/hover
    // background. Fixed via group-data-[collapsible=icon]:justify-center on
    // app-sidebar.tsx's per-item className.
    const email = `e2e-shell-collapse-icon-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      userId = await signUpAndLand(page, email, password);
      await page.goto("/dashboard");
      await page.getByRole("button", { name: "Toggle Sidebar" }).first().click();

      const button = page.locator('[data-sidebar="content"] [data-sidebar="menu-button"]').first();
      const icon = button.locator("svg").first();
      const buttonBox = await button.boundingBox();
      const iconBox = await icon.boundingBox();
      if (!buttonBox || !iconBox) throw new Error("expected a visible collapsed sidebar icon button");

      const dx = Math.abs(buttonBox.x + buttonBox.width / 2 - (iconBox.x + iconBox.width / 2));
      expect(dx).toBeLessThanOrEqual(1);
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test("account menu and command palette open", async ({ page }) => {
    const email = `e2e-shell-menu-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      userId = await signUpAndLand(page, email, password);
      await page.goto("/dashboard");

      await page.getByRole("button", { name: /shell test/i }).first().click();
      await expect(page.getByText("Sign out")).toBeVisible();

      await page.keyboard.press("Escape");
      await page.keyboard.press("Meta+k");
      await expect(page.getByPlaceholder("Search…")).toBeVisible();
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });
});
