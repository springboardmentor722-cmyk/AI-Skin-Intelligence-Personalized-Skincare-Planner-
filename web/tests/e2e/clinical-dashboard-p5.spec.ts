import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, promoteRole, screenshotPath, signOut } from "./helpers";

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
}, testInfo) => {
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
      // Milestone 2 P14 — the dashboard is real now (clinical_review's roster +
      // portfolio-stats endpoints, ADR-024's deferred consequence), so it needs a
      // real assigned client to render non-empty. backend/app/db/seed.py's own
      // demo cast, direct assignment (same "direct DB write for test setup"
      // pattern this file already uses for the profile approval above).
      await db.query(
        `insert into consultant_clients (consultant_id, user_id, status)
         values ($1, 'demo-client-ananya.verma', 'active')
         on conflict (consultant_id, user_id) do update set status = 'active'`,
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
    // HeroBand ("clinical" tint): reads as client-management intelligence, not a
    // reskinned end-user skin-hero.
    await expect(page.getByText("Client overview")).toBeVisible();
    await expect(page.getByText("Client Intelligence")).toBeVisible();
    await expect(page.getByText("Ananya Verma").first()).toBeVisible();
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
      path: screenshotPath(testInfo, "../docs/milestones/milestone_2/build/consultant-dashboard"),
      fullPage: false,
    });
  } finally {
    if (userId) {
      const cleanupDb = pool();
      try {
        // consultant_clients.consultant_id has no ON DELETE CASCADE (a real,
        // deliberate FK — an assignment audit trail shouldn't vanish silently) —
        // must clear it before deleteTestUser removes the "user" row, same class
        // of fix as the assessment_submissions ordering bug this session found.
        await cleanupDb.query("delete from consultant_clients where consultant_id = $1", [
          userId,
        ]);
      } finally {
        await cleanupDb.end();
      }
      await deleteTestUser(userId);
    }
  }
});

test("dermatologist dashboard: patient vocabulary, 4-cell footer w/ Stable, mixed-gender roster", async ({
  page,
}, testInfo) => {
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
      // Milestone 2 P14 — real assigned patients (backend/app/db/seed.py's demo
      // cast) so the mixed-gender roster assertion below is proving something
      // real, not a fixture. Rohit Sharma is the seed's one male demo client;
      // Kavya Nair is female, for a genuine mix.
      await db.query(
        `insert into consultant_clients (consultant_id, user_id, status)
         values ($1, 'demo-client-rohit.sharma', 'active'),
                ($1, 'demo-client-kavya.nair', 'active')
         on conflict (consultant_id, user_id) do update set status = 'active'`,
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
    // HeroBand ("clinical" tint), dermatologist copy divergence from Consultant.
    await expect(page.getByText("Patient overview")).toBeVisible();
    await expect(page.getByText("Clinical Intelligence")).toBeVisible();
    // 4-cell stat footer including the neutral "Stable" cell — UI_SPEC.md §4.3.
    await expect(page.getByText("Avg. Improvement").first()).toBeVisible();
    await expect(page.getByText("Patients Improved").first()).toBeVisible();
    await expect(page.getByText("Stable")).toBeVisible();
    await expect(page.getByText("Need Attention").first()).toBeVisible();
    // Mixed-gender roster (not all-female like Consultant's) — real seeded data,
    // not the fixture's "Hair Fall & Dandruff" (never a real seeded concern).
    await expect(page.getByText("Rohit Sharma").first()).toBeVisible();
    await expect(page.getByText("Oily Skin").first()).toBeVisible();
    // Deliberate copy divergence from Consultant.
    await expect(page.getByText("AI Clinical Insights")).toBeVisible();
    await expect(page.getByText("Skin Conditions Guide")).toBeVisible();
    await expect(page.getByText("Skin Concerns Guide")).not.toBeVisible();

    // Master prompt §5.6 closing-the-loop screenshots for tools/vision/extract.py.
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.screenshot({
      path: screenshotPath(testInfo, "../docs/milestones/milestone_2/build/dermatologist-dashboard"),
      fullPage: false,
    });
  } finally {
    if (userId) {
      const cleanupDb = pool();
      try {
        await cleanupDb.query("delete from consultant_clients where consultant_id = $1", [
          userId,
        ]);
      } finally {
        await cleanupDb.end();
      }
      await deleteTestUser(userId);
    }
  }
});
