import { test, expect } from "@playwright/test";

import { ROLE_HOME, type Role } from "@/lib/nav-config";

import { clearRateLimits, deleteTestUser, pool, promoteRole, signOut } from "./helpers";

// Milestone 2 P13 (MILESTONE_2_MASTER_PROMPT.md P13: "role-permission negative
// tests (a user cannot reach an admin route)"). The role layouts
// (web/app/{admin,consultant,dermatologist}/layout.tsx) client-side-redirect a
// mismatched session to its OWN ROLE_HOME rather than rendering the protected
// content — this proves that redirect fires for real, cross-role, not just that
// the matching role can reach its own route (already covered by app-shell.spec.ts
// and role-sidebar-labels.spec.ts).
test.describe.configure({ mode: "serial" });

async function signUpAs(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  role: Role
): Promise<string> {
  await clearRateLimits();
  await page.goto("/signup");
  await page.fill("#firstName", "Negative");
  await page.fill("#lastName", "Test");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.getByRole("checkbox").click({ force: true });
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/(assessment|consultant-onboarding|dermatologist-onboarding)/, {
    timeout: 10_000,
  });

  const db = pool();
  let userId: string;
  try {
    const { rows } = await db.query('select id from "user" where email = $1', [email]);
    userId = rows[0].id as string;
  } finally {
    await db.end();
  }

  if (role !== "user") {
    await promoteRole(userId, role);
    await signOut(page.request);
    await clearRateLimits();
    await page.goto("/login");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL(new RegExp(`/${role}`), { timeout: 10_000 });
  }

  return userId;
}

async function assertBlocked(
  page: import("@playwright/test").Page,
  sessionRole: Role,
  attemptedRoute: string,
  forbiddenText: string
) {
  await page.goto(attemptedRoute);
  await page.waitForURL(new RegExp(ROLE_HOME[sessionRole].replace(/\//g, "\\/")), {
    timeout: 10_000,
  });
  await expect(page.getByText(forbiddenText)).not.toBeVisible();
}

test("a user cannot reach an admin route", async ({ page }) => {
  const email = `e2e-negperm-user-${Date.now()}@example.com`;
  let userId: string | null = null;
  try {
    userId = await signUpAs(page, email, "SuperSecret123!", "user");
    await assertBlocked(page, "user", "/admin/dashboard", "Total Users");
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});

test("a user cannot reach a consultant route", async ({ page }) => {
  const email = `e2e-negperm-user2-${Date.now()}@example.com`;
  let userId: string | null = null;
  try {
    userId = await signUpAs(page, email, "SuperSecret123!", "user");
    await assertBlocked(page, "user", "/consultant/dashboard", "Total Clients");
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});

test("a consultant cannot reach an admin route", async ({ page }) => {
  const email = `e2e-negperm-consultant-${Date.now()}@example.com`;
  let userId: string | null = null;
  try {
    userId = await signUpAs(page, email, "SuperSecret123!", "consultant");
    await assertBlocked(page, "consultant", "/admin/dashboard", "Total Users");
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});

test("an admin cannot reach a dermatologist route", async ({ page }) => {
  const email = `e2e-negperm-admin-${Date.now()}@example.com`;
  let userId: string | null = null;
  try {
    userId = await signUpAs(page, email, "SuperSecret123!", "admin");
    await assertBlocked(page, "admin", "/dermatologist/dashboard", "Total Patients");
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});
