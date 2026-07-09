import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, promoteRole } from "./helpers";

// Branch 8 (feature/testing) — the one flow in the whole app that spans two
// different roles' real sessions: a consultant's real onboarding submission, an
// admin's real review (reject, then approve after a real resubmission), and the
// consultant seeing both outcomes on their own dashboard. Each half already has its
// own narrower coverage (consultant-onboarding.spec.ts, admin-panel.spec.ts) — this
// test chains them for real, end to end, rather than seeding state directly.
test.describe.configure({ mode: "serial" });

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
  await page.waitForURL(/\/(dashboard|admin|consultant)/, { timeout: 10_000 });
}

test("consultant onboarding -> admin reject -> resubmit -> admin approve -> unlocked dashboard", async ({
  page,
}) => {
  const password = "SuperSecret123!";
  const consultantEmail = `e2e-journey-consultant-${Date.now()}@example.com`;
  const adminEmail = `e2e-journey-admin-${Date.now()}@example.com`;
  let consultantId: string | null = null;
  let adminId: string | null = null;

  try {
    // --- Consultant: real signup + real onboarding wizard submission ---
    await clearRateLimits();
    await page.goto("/signup");
    await page.locator('input[type="radio"][value="consultant"]').click({ force: true });
    await page.fill("#firstName", "Journey");
    await page.fill("#lastName", "Consultant");
    await page.fill("#email", consultantEmail);
    await page.fill("#password", password);
    await page.fill("#confirmPassword", password);
    await page.getByRole("checkbox").click({ force: true });
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL(/\/consultant-onboarding$/, { timeout: 10_000 });

    const lookupDb = pool();
    try {
      const { rows } = await lookupDb.query('select id from "user" where email = $1', [
        consultantEmail,
      ]);
      consultantId = rows[0]?.id ?? null;
    } finally {
      await lookupDb.end();
    }

    await page.getByRole("button", { name: /start application/i }).click();
    await page.waitForURL(/\/consultant-onboarding\/background/);
    await page.fill("#qualifications", "MD, Dermatology");
    await page.fill("#yearsOfExperience", "6");
    await page.getByRole("button", { name: /^continue$/i }).click();

    await page.waitForURL(/\/consultant-onboarding\/practice/);
    const specializationsInput = page.getByLabel("Specializations");
    await specializationsInput.fill("Acne");
    await specializationsInput.press("Enter");
    const languagesInput = page.getByLabel("Languages");
    await languagesInput.fill("English");
    await languagesInput.press("Enter");
    await page.getByRole("button", { name: "Video call" }).click();
    await page.fill("#biography", "Board-certified dermatologist.");
    await page.getByRole("button", { name: /^continue$/i }).click();

    await page.waitForURL(/\/consultant-onboarding\/contact/);
    await page.fill("#phone", "+1 555 000 1234");
    await page.getByRole("button", { name: /^continue$/i }).click();

    await page.waitForURL(/\/consultant-onboarding\/review/);
    await page.getByRole("button", { name: /submit application/i }).click();
    await page.waitForURL(/\/consultant\/dashboard/, { timeout: 10_000 });
    await expect(page.getByText(/under review/i)).toBeVisible();

    // --- Admin: real signup, promote, real review via the UI, reject with a reason ---
    await page.request.post("/api/auth/sign-out");
    await clearRateLimits();
    await page.goto("/signup");
    await page.fill("#firstName", "Journey");
    await page.fill("#lastName", "Admin");
    await page.fill("#email", adminEmail);
    await page.fill("#password", password);
    await page.fill("#confirmPassword", password);
    await page.getByRole("checkbox").click({ force: true });
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL(/\/assessment/, { timeout: 10_000 });

    const adminLookupDb = pool();
    try {
      const { rows } = await adminLookupDb.query('select id from "user" where email = $1', [
        adminEmail,
      ]);
      adminId = rows[0]?.id ?? null;
    } finally {
      await adminLookupDb.end();
    }
    expect(adminId).not.toBeNull();
    await promoteRole(adminId as string, "admin");
    await page.request.post("/api/auth/sign-out");
    await signIn(page, adminEmail, password);

    await page.goto("/admin/users/verification");
    const row = page.locator("tr", { hasText: consultantId as string });
    await expect(row).toBeVisible({ timeout: 10_000 });
    await row.getByRole("button", { name: /review/i }).click();
    await page.waitForURL(new RegExp(`/admin/users/verification/consultant/${consultantId}`));

    await page.fill("#reason", "Please provide a license number.");
    await page.getByRole("button", { name: /^reject$/i }).click();
    await expect(page.getByText(/rejected/i).first()).toBeVisible({ timeout: 10_000 });

    // --- Consultant: sees the rejection + reviewer's note, resubmits ---
    await page.request.post("/api/auth/sign-out");
    await clearRateLimits();
    await signIn(page, consultantEmail, password);
    await page.goto("/consultant/dashboard");
    await expect(page.getByText(/wasn't approved/i)).toBeVisible();
    await expect(page.getByText("Please provide a license number.")).toBeVisible();

    await page.getByRole("button", { name: /edit profile/i }).click();
    await page.waitForURL(/\/consultant-onboarding\/background/);
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.waitForURL(/\/consultant-onboarding\/practice/);
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.waitForURL(/\/consultant-onboarding\/contact/);
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.waitForURL(/\/consultant-onboarding\/review/);
    await page.getByRole("button", { name: /submit application/i }).click();
    await page.waitForURL(/\/consultant\/dashboard/, { timeout: 10_000 });
    await expect(page.getByText(/under review/i)).toBeVisible();

    // --- Admin: approves the resubmission ---
    await page.request.post("/api/auth/sign-out");
    await clearRateLimits();
    await signIn(page, adminEmail, password);
    await page.goto(`/admin/users/verification/consultant/${consultantId}`);
    await page.getByRole("button", { name: /^approve$/i }).click();
    // Not anchored — the "currently <status>" text this matches sits inside a
    // larger paragraph (user id + "— currently approved"), not its own element.
    await expect(page.getByText(/currently approved/i)).toBeVisible({ timeout: 10_000 });

    // --- Consultant: dashboard is now unlocked ---
    await page.request.post("/api/auth/sign-out");
    await clearRateLimits();
    await signIn(page, consultantEmail, password);
    await page.goto("/consultant/dashboard");
    await expect(page.getByText(/you're verified/i)).toBeVisible();
    // The isApproved-only "coming soon" cards (not the sidebar nav, which always
    // shows "Clients" regardless of verification status) — confirms the dashboard
    // itself switched out of the locked/pending view.
    await expect(page.getByText("Client management is coming in a later milestone.")).toBeVisible();

    const finalDb = pool();
    try {
      const result = await finalDb.query(
        "select verification_status from consultant_profiles where user_id = $1",
        [consultantId]
      );
      expect(result.rows[0].verification_status).toBe("approved");
    } finally {
      await finalDb.end();
    }
  } finally {
    if (consultantId) await deleteTestUser(consultantId);
    if (adminId) await deleteTestUser(adminId);
  }
});
