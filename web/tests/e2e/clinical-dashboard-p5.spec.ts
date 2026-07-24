import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, promoteRole, signOut } from "./helpers";

// Milestone 2 P5 — Consultant & Dermatologist dashboard (MILESTONE_2_UI_SPEC.md
// §4.2/§4.3, docs/DECISIONS.md ADR-024). The full onboarding-review workflow is
// already covered end to end by cross-role-verification-journey.spec.ts; this test
// only needs an *approved* profile to reach the dashboard, so it writes the
// consultant_profiles/dermatologist_profiles row directly (same "direct DB write
// for test setup" pattern helpers.ts's promoteRole already uses) rather than
// re-walking the full onboarding wizard + admin review UI.
test.describe.configure({ mode: "serial" });

async function signUp(
  page: import("@playwright/test").Page,
  email: string,
  password: string
): Promise<string> {
  await clearRateLimits();
  await page.goto("/signup");
  await page.fill("#firstName", "Clinical");
  await page.fill("#lastName", "Dashboard");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.getByRole("checkbox").click({ force: true });
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/(assessment|consultant-onboarding|dermatologist-onboarding)/, {
    timeout: 10_000,
  });

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
  await page.waitForURL(/\/(consultant|dermatologist)/, { timeout: 10_000 });
}

test("consultant dashboard: client vocabulary, 3-cell footer, Skin Concerns Guide", async ({
  page,
}) => {
  const email = `e2e-clinical-consultant-${Date.now()}@example.com`;
  const password = "SuperSecret123!";
  let userId: string | null = null;

  try {
    userId = await signUp(page, email, password);
    await promoteRole(userId, "consultant");
    const db = pool();
    try {
      await db.query(
        `insert into consultant_profiles (user_id, verification_status) values ($1, 'approved')`,
        [userId]
      );
    } finally {
      await db.end();
    }
    await signOut(page.request);
    await signIn(page, email, password);
    await page.goto("/consultant/dashboard");

    for (const label of ["Total Clients", "Client Overview", "Clients by Skin Type"]) {
      await expect(page.getByText(label).first()).toBeVisible({ timeout: 10_000 });
    }
    // 3-cell stat footer (not 4) — UI_SPEC.md §4.2.
    await expect(page.getByText("Avg. Improvement").first()).toBeVisible();
    await expect(page.getByText("Clients Improved").first()).toBeVisible();
    await expect(page.getByText("Need Attention").first()).toBeVisible();
    await expect(page.getByText("Stable")).not.toBeVisible();
    // Deliberate copy divergence from Dermatologist.
    await expect(page.getByText("Consultant Tip")).toBeVisible();
    await expect(page.getByText("Skin Concerns Guide")).toBeVisible();
    await expect(page.getByText("Skin Conditions Guide")).not.toBeVisible();

    // Master prompt §5.6 closing-the-loop screenshot for tools/vision/extract.py.
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.screenshot({
      path: "../docs/milestones/milestone_2/build/consultant-dashboard.png",
      fullPage: false,
    });
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});

test("dermatologist dashboard: patient vocabulary, 4-cell footer w/ Stable, mixed-gender roster", async ({
  page,
}) => {
  const email = `e2e-clinical-derma-${Date.now()}@example.com`;
  const password = "SuperSecret123!";
  let userId: string | null = null;

  try {
    userId = await signUp(page, email, password);
    await promoteRole(userId, "dermatologist");
    const db = pool();
    try {
      await db.query(
        `insert into dermatologist_profiles (user_id, verification_status) values ($1, 'approved')`,
        [userId]
      );
    } finally {
      await db.end();
    }
    await signOut(page.request);
    await signIn(page, email, password);
    await page.goto("/dermatologist/dashboard");

    for (const label of ["Total Patients", "Patients Overview", "Skin Concerns Distribution"]) {
      await expect(page.getByText(label).first()).toBeVisible({ timeout: 10_000 });
    }
    // 4-cell stat footer including the neutral "Stable" cell — UI_SPEC.md §4.3.
    await expect(page.getByText("Avg. Improvement").first()).toBeVisible();
    await expect(page.getByText("Patients Improved").first()).toBeVisible();
    await expect(page.getByText("Stable")).toBeVisible();
    await expect(page.getByText("Need Attention").first()).toBeVisible();
    // Mixed-gender roster (not all-female like Consultant's).
    await expect(page.getByText("Rohit Sharma")).toBeVisible();
    await expect(page.getByText("Hair Fall & Dandruff")).toBeVisible();
    // Deliberate copy divergence from Consultant.
    await expect(page.getByText("AI Clinical Insights")).toBeVisible();
    await expect(page.getByText("Skin Conditions Guide")).toBeVisible();
    await expect(page.getByText("Skin Concerns Guide")).not.toBeVisible();

    // Master prompt §5.6 closing-the-loop screenshots for tools/vision/extract.py.
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.screenshot({
      path: "../docs/milestones/milestone_2/build/dermatologist-dashboard.png",
      fullPage: false,
    });
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});
