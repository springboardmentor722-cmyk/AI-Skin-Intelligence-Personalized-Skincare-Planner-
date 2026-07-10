import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool } from "./helpers";

// Branch 5 (feature/dermatologist-module) — same shape as
// consultant-onboarding.spec.ts, distinct medical field set. Real onboarding wizard
// -> submission -> locked dashboard journey, driven through the actual UI, with a
// direct Postgres check that the role really flipped and the profile really landed.
// `clearRateLimits` (helpers.ts, Branch 8) before the signup — see
// consultant-onboarding.spec.ts's comment for why.
test.describe.configure({ mode: "serial" });

test.describe("dermatologist onboarding", () => {
  test("signup as dermatologist -> submit application -> locked pending dashboard", async ({
    page,
  }) => {
    const email = `e2e-dermatologist-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      await clearRateLimits();
      await page.goto("/signup");
      await page.getByRole("radio", { name: /^Dermatologist/i }).click();
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "Dermatologist");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);
      await page.getByRole("checkbox").click({ force: true });
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForURL(/\/dermatologist-onboarding$/, { timeout: 10_000 });

      // Captured immediately (not just after the final DB assertions below) so a
      // later failure anywhere in the wizard still cleans up this real account,
      // rather than leaking a signed-up test user on every early failure.
      const lookupDb = pool();
      try {
        const { rows } = await lookupDb.query('select id from "user" where email = $1', [email]);
        userId = rows[0]?.id ?? null;
      } finally {
        await lookupDb.end();
      }
      await page.getByRole("button", { name: /start application/i }).click();

      await page.waitForURL(/\/dermatologist-onboarding\/background/);
      await page.fill("#medicalRegistrationNumber", "MED-REG-E2E-001");
      await page.fill("#medicalCouncil", "General Medical Council");
      await page.fill("#yearsOfPractice", "10");
      const degreesInput = page.getByLabel("Degrees");
      await degreesInput.fill("MBBS");
      await degreesInput.press("Enter");
      await page.getByRole("button", { name: /^continue$/i }).click();

      await page.waitForURL(/\/dermatologist-onboarding\/practice/);
      const specializationsInput = page.getByLabel("Specializations");
      await specializationsInput.fill("Psoriasis");
      await specializationsInput.press("Enter");
      await page.fill(
        "#professionalBiography",
        "Consultant dermatologist, 10 years of practice."
      );
      await page.getByRole("button", { name: /^continue$/i }).click();

      await page.waitForURL(/\/dermatologist-onboarding\/contact/);
      await page.fill("#phone", "+44 20 9999 8888");
      await page.getByRole("button", { name: /^continue$/i }).click();

      await page.waitForURL(/\/dermatologist-onboarding\/review/);
      await expect(page.getByText("MED-REG-E2E-001")).toBeVisible();
      await expect(page.getByText("Psoriasis")).toBeVisible();
      await page.getByRole("button", { name: /submit application/i }).click();

      await page.waitForURL(/\/dermatologist\/dashboard/, { timeout: 10_000 });
      await expect(page.getByText(/under review/i)).toBeVisible();
      await expect(page.getByText("MED-REG-E2E-001")).toBeVisible();

      expect(userId).not.toBeNull();
      const db = pool();
      try {
        const userResult = await db.query('select role from "user" where id = $1', [userId]);
        expect(userResult.rows).toHaveLength(1);
        expect(userResult.rows[0].role).toBe("dermatologist");

        const profileResult = await db.query(
          "select verification_status, medical_registration_number from dermatologist_profiles where user_id = $1",
          [userId]
        );
        expect(profileResult.rows).toHaveLength(1);
        expect(profileResult.rows[0].verification_status).toBe("pending");
        expect(profileResult.rows[0].medical_registration_number).toBe("MED-REG-E2E-001");
      } finally {
        await db.end();
      }
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });
});
