import { test, expect } from "@playwright/test";
import { Pool } from "pg";

// Branch 4 (feature/consultant-module) — the real onboarding wizard -> submission ->
// locked dashboard journey, driven through the actual UI (not raw API calls), with a
// direct Postgres check that the role really flipped and the profile really landed.
// Serial + a real Postgres connection to clean up its own account afterward, same
// discipline as auth-hardening.spec.ts / admin-rbac.spec.ts.
test.describe.configure({ mode: "serial" });

function pool(): Pool {
  return new Pool({
    connectionString:
      process.env.DATABASE_URL ?? "postgresql://skinlytics:skinlytics@localhost:5432/skinlytics",
  });
}

async function deleteTestUser(userId: string): Promise<void> {
  const db = pool();
  try {
    await db.query("delete from audit_logs where actor_user_id = $1 or target_id = $1", [
      userId,
    ]);
    await db.query("delete from verification_documents where owner_user_id = $1", [userId]);
    await db.query("delete from consultant_profiles where user_id = $1", [userId]);
    await db.query('delete from session where "userId" = $1', [userId]);
    await db.query('delete from account where "userId" = $1', [userId]);
    await db.query('delete from "user" where id = $1', [userId]);
  } finally {
    await db.end();
  }
}

test.describe("consultant onboarding", () => {
  test("signup as consultant -> submit application -> locked pending dashboard", async ({
    page,
  }) => {
    const email = `e2e-consultant-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      await page.goto("/signup");
      await page.locator('input[type="radio"][value="consultant"]').click({ force: true });
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "Consultant");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);
      await page.getByRole("checkbox").click({ force: true });
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForURL(/\/consultant-onboarding$/, { timeout: 10_000 });

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

      await page.waitForURL(/\/consultant-onboarding\/background/);
      await page.fill("#qualifications", "MD, Dermatology");
      await page.fill("#yearsOfExperience", "6");
      await page.fill("#licenseNumber", "LIC-E2E-001");
      await page.getByRole("button", { name: /^continue$/i }).click();

      await page.waitForURL(/\/consultant-onboarding\/practice/);
      const specializationsInput = page.getByLabel("Specializations");
      await specializationsInput.fill("Acne");
      await specializationsInput.press("Enter");
      const languagesInput = page.getByLabel("Languages");
      await languagesInput.fill("English");
      await languagesInput.press("Enter");
      await page.getByRole("button", { name: "Video call" }).click();
      await page.fill("#biography", "Board-certified dermatologist, 6 years of practice.");
      await page.getByRole("button", { name: /^continue$/i }).click();

      await page.waitForURL(/\/consultant-onboarding\/contact/);
      await page.fill("#phone", "+1 555 000 1234");
      await page.getByRole("button", { name: /^continue$/i }).click();

      await page.waitForURL(/\/consultant-onboarding\/review/);
      await expect(page.getByText("MD, Dermatology")).toBeVisible();
      await expect(page.getByText("Acne")).toBeVisible();
      await page.getByRole("button", { name: /submit application/i }).click();

      await page.waitForURL(/\/consultant\/dashboard/, { timeout: 10_000 });
      await expect(page.getByText(/under review/i)).toBeVisible();
      await expect(page.getByText("MD, Dermatology")).toBeVisible();

      expect(userId).not.toBeNull();
      const db = pool();
      try {
        const userResult = await db.query('select role from "user" where id = $1', [userId]);
        expect(userResult.rows).toHaveLength(1);
        expect(userResult.rows[0].role).toBe("consultant");

        const profileResult = await db.query(
          "select verification_status, qualifications from consultant_profiles where user_id = $1",
          [userId]
        );
        expect(profileResult.rows).toHaveLength(1);
        expect(profileResult.rows[0].verification_status).toBe("pending");
        expect(profileResult.rows[0].qualifications).toBe("MD, Dermatology");
      } finally {
        await db.end();
      }
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });
});
