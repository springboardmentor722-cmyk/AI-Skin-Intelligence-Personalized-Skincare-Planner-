import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, signOut } from "./helpers";

// Milestone 2 — PROGRESS.md's own Pending list named this gap: skin profile &
// lifestyle, assessment, dashboard, recommendations, and progress (plus /routine,
// built this session) were all verified manually only, no automated e2e coverage.
// One chained real journey (same "real signup, real backend, no mocks" shape as
// cross-role-verification-journey.spec.ts) rather than six separate files each
// re-doing their own signup/rate-limit dance — all six screens are downstream of
// one signed-up user completing the real assessment wizard.
//
// Deliberately picks "Sensitive" skin type in the wizard so the dashboard/routine/
// recommendations assertions below can also prove the ingredient_skintype_avoid
// safety filter holds end-to-end through the real UI, not just via the manual
// curl-based checks this session's earlier branches used.
test.describe.configure({ mode: "serial" });

// Known avoid-flagged actives for Sensitive skin (backend/app/db/seed.py) — the
// products carrying them must never appear anywhere in this Sensitive user's
// generated routine.
const AVOID_FLAGGED_PRODUCTS = [
  "Retinol 0.3% Night Treatment",
  "Vitamin C Brightening Serum",
  "2% Salicylic Acid Treatment",
  "8% Glycolic Acid Night Exfoliant",
];

test("signup -> assessment wizard -> dashboard/routine/recommendations/profile, all real", async ({
  page,
}) => {
  // Chained real journey (signup + 4-step wizard + 6 page loads against a real
  // backend) legitimately exceeds Playwright's 30s default.
  test.setTimeout(120_000);
  const password = "SuperSecret123!";
  const email = `e2e-journey-user-${Date.now()}@example.com`;
  let userId: string | null = null;

  try {
    // --- Signup -> real redirect to the assessment wizard (app/signup/page.tsx's
    // onboardingPath maps requestedRole: "user" to /assessment) ---
    await clearRateLimits();
    await page.goto("/signup");
    await page.getByRole("radio", { name: "User" }).click();
    await page.fill("#firstName", "Journey");
    await page.fill("#lastName", "User");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.fill("#confirmPassword", password);
    await page.getByRole("checkbox").click({ force: true });
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL("**/assessment", { timeout: 10_000 });

    const lookupDb = pool();
    try {
      const { rows } = await lookupDb.query('select id from "user" where email = $1', [email]);
      userId = rows[0]?.id ?? null;
    } finally {
      await lookupDb.end();
    }
    expect(userId).toBeTruthy();

    // --- Assessment wizard: basics ---
    await page.getByRole("button", { name: /begin assessment/i }).click();
    await page.waitForURL("**/assessment/basics");
    await page.getByRole("button", { name: "25-34" }).click();
    await page.getByRole("button", { name: /clearer skin/i }).click();
    await page.fill("#location", "London, United Kingdom");
    await page.getByRole("button", { name: "Continue" }).click();

    // --- skin-type: Sensitive, deliberately ---
    await page.waitForURL("**/assessment/skin-type");
    await page.getByRole("button", { name: "Sensitive" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // --- concerns: pick one real seeded concern ---
    await page.waitForURL("**/assessment/concerns");
    await page.getByRole("button", { name: "Acne" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // --- lifestyle: exercise a real allergy toggle, defaults are otherwise valid ---
    await page.waitForURL("**/assessment/lifestyle");
    await page.getByRole("button", { name: "Fragrance" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // --- results: real save + real score computation fires on mount
    // (useSubmitAssessment) — the ring/breakdown render the actual GET /api/v1/assessment/score
    // result, not a client-side estimate. ---
    await page.waitForURL("**/assessment/results");
    await expect(page.getByRole("heading", { name: "Diagnostic overview" })).toBeVisible({
      timeout: 10_000,
    });
    for (const label of ["Condition", "Lifestyle", "Routine", "Sleep", "Hydration"]) {
      await expect(page.getByText(new RegExp(`${label} \\(\\d+%\\)`, "i"))).toBeVisible();
    }

    // A brand-new signup has exactly one skin_assessments row (today), so the
    // Skin Health Progress trend chart legitimately renders its empty state
    // ("Check back after a few days") — correct behaviour, but it means the P4
    // vision-diff screenshot below would compare a real *empty* chart card against
    // the source screenshot's real *populated* one, which isn't the same fidelity
    // question. Backdating a few more real rows for the same user (same shape
    // get_recent_scores/scores_service.py already reads, no new column, no fixture)
    // gives the screenshot a fair, still-100%-real trend to render.
    const seedDb = pool();
    try {
      for (const [daysAgo, score] of [[21, 66], [14, 70], [7, 74]] as const) {
        await seedDb.query(
          `insert into skin_assessments (user_id, overall_score, calculated_at)
           values ($1, $2, now() - ($3 || ' days')::interval)`,
          [userId, score, daysAgo]
        );
      }
    } finally {
      await seedDb.end();
    }

    // --- Dashboard: real score, real routine, real recommendations (Milestone 2
    // P4 layout — MILESTONE_2_UI_SPEC.md §4.1's 4 rows, docs/DECISIONS.md ADR-023) ---
    await page.goto("/dashboard");
    await expect(
      page.getByText(/complete your skin profile to unlock your dashboard/i)
    ).not.toBeVisible();
    await expect(page.getByText("Skin Health Score")).toBeVisible({ timeout: 10_000 });
    for (const label of ["Skin Type", "Top Concerns", "Skin Age", "Hydration Level"]) {
      await expect(page.getByText(label).first()).toBeVisible();
    }
    await expect(page.getByText(/today's routine/i)).toBeVisible();
    // The AM/PM-only filter fixed this session — Weekly must never leak onto the
    // dashboard's daily checklist card.
    await expect(page.getByText("Evening Routine")).toBeVisible();
    await expect(page.getByText(/^weekly$/i)).not.toBeVisible();
    await expect(page.getByText("Recommended Products for You")).toBeVisible();
    for (const unsafe of AVOID_FLAGGED_PRODUCTS) {
      await expect(page.getByText(unsafe)).not.toBeVisible();
    }

    // Master prompt §5.6 closing-the-loop screenshot for tools/vision/extract.py.
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.screenshot({
      path: "../docs/milestones/milestone_2/build/user-dashboard.png",
      fullPage: false,
    });

    // --- /routine: all three tabs, safety filter, real checkbox persistence ---
    await page.goto("/routine");
    await expect(page.getByRole("heading", { name: "My Routine" }).last()).toBeVisible();
    for (const tabName of ["AM Routine", "PM Routine", "Weekly Care"]) {
      await page.getByRole("button", { name: tabName }).click();
      for (const unsafe of AVOID_FLAGGED_PRODUCTS) {
        await expect(page.getByText(unsafe)).not.toBeVisible();
      }
    }
    await page.getByRole("button", { name: "Weekly Care" }).click();
    const checkbox = page.locator('[data-slot="checkbox"]').first();
    await checkbox.click();
    await expect(checkbox).toHaveAttribute("data-checked", "", { timeout: 5_000 });
    await page.reload();
    await page.getByRole("button", { name: "Weekly Care" }).click();
    await expect(page.locator('[data-slot="checkbox"]').first()).toHaveAttribute(
      "data-checked",
      "",
      { timeout: 5_000 }
    );

    // --- /recommendations: real product grid ---
    await page.goto("/recommendations");
    await expect(page.getByText(/no recommendations yet/i)).not.toBeVisible();
    for (const unsafe of AVOID_FLAGGED_PRODUCTS) {
      await expect(page.getByText(unsafe)).not.toBeVisible();
    }

    // --- /profile: SkinProfileForm edit round-trip (separate write path from the
    // wizard's own save) ---
    await page.goto("/profile");
    await expect(page.getByText(/sensitive/i).first()).toBeVisible({ timeout: 10_000 });
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Dry" }).click();

    // Milestone 2 P7 (docs/DECISIONS.md ADR-026) — allergies are a real ingredient
    // search (GET /api/v1/ingredients?q=), not free text; "Retinol" is a real seeded
    // row (backend/app/db/seed.py), proving the structured id round-trips, not a tag.
    await page.getByPlaceholder("Search ingredients...").click();
    await page.getByPlaceholder("Search ingredients...").fill("Retinol");
    await page.getByRole("option", { name: "Retinol" }).click();

    await page.getByRole("button", { name: /save skin profile/i }).click();
    await expect(page.getByText(/^saved$/i)).toBeVisible({ timeout: 10_000 });
    await page.reload();
    await expect(page.getByText(/^dry$/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Retinol")).toBeVisible({ timeout: 10_000 });

    // --- /check-in: daily entry (sleep, water, stress, sun exposure) + 30-day
    // history — MILESTONE_2_MASTER_PROMPT.md P7's "Lifestyle & Habits" page ---
    await page.goto("/check-in");
    await expect(page.getByRole("heading", { name: "Daily check-in" })).toBeVisible();
    await expect(page.getByText(/stress level/i)).toBeVisible();
    await expect(page.getByText(/sun exposure/i)).toBeVisible();
    // The assessment wizard's "lifestyle" step (sleep/water/stress/sun) already
    // upserted today's lifestyle_logs row via the P9 submit pipeline, so this button
    // reads "Update today's check-in" rather than "Log today" — either way, saving
    // here must round-trip.
    await page.getByRole("button", { name: /log today|update today's check-in/i }).click();
    await expect(page.getByText(/today's check-in saved/i)).toBeVisible({ timeout: 10_000 });
    await page.reload();
    await expect(page.getByRole("button", { name: /update today's check-in/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("30-day history")).toBeVisible();
    await expect(page.getByText(/no check-ins logged yet/i)).not.toBeVisible();

    await signOut(page.request);
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});
