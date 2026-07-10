import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, promoteRole, signOut } from "./helpers";

// Rewritten for Branch 8 (feature/testing) — this file predated two real changes and
// had been failing (or asserting things that were never quite true) ever since:
// (1) proxy.ts's route protection (Milestone 1 audit) means every one of these routes
// now requires a real signed-in session, not just a visit; (2) the M1 audit's
// disabled-nav-item pattern (app-sidebar.tsx) means an unbuilt nav item renders as a
// disabled <button>, never a real link — the original test asserted a link role/href
// on "Clients", which has never been built. Rewritten against the actual current DOM
// (verified live) rather than patched piecemeal.
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

      // Dashboard/Products/Progress are built (real links); My Routine/Daily
      // Check-in/Settings are disabled placeholders (app-sidebar.tsx) — all six stay
      // visible per AGENTS.md's fixed nav list either way, this only asserts
      // presence, not link-vs-button.
      for (const label of [
        "Dashboard",
        "My Routine",
        "Daily Check-in",
        "Products",
        "Progress",
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
