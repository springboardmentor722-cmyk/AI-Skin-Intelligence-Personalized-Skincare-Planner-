import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, screenshotPath, signOut } from "./helpers";

// Milestone 2 — PROGRESS.md's own Pending list named this gap: skin profile &
// lifestyle, assessment, dashboard, recommendations, and progress (plus /routine,
// built this session) were all verified manually only, no automated e2e coverage.
// One chained real journey (same "real signup, real backend, no mocks" shape as
// cross-role-verification-journey.spec.ts) rather than six separate files each
// re-doing their own signup/rate-limit dance — all six screens are downstream of
// one signed-up user with a real skin profile.
//
// Milestone 2 P8: the assessment wizard now submits against a fixture, not the
// real skin-profile/lifestyle-log endpoints (docs/DECISIONS.md — full-auto session
// decision to follow MILESTONE_2_MASTER_PROMPT.md's §12 fixtures-first sequencing
// literally; assessment-wizard.spec.ts covers the wizard's own UI/state machine).
// This journey needs a real profile to exist for the downstream dashboard/routine/
// recommendations assertions below, so it's seeded directly (skin_profiles +
// skin_profile_concerns via SQL, lifestyle_logs via Mongo) instead of walking a
// wizard that no longer writes real data — same "direct setup, not a full UI
// walk, when only the end state matters" pattern already used below for
// backdating skin_assessments rows.
//
// Deliberately seeds "Sensitive" skin type so the dashboard/routine/
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

test("signup -> real profile -> dashboard/routine/recommendations/profile/check-in, all real", async ({
  page,
}, testInfo) => {
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

    // --- Real skin profile + lifestyle log, seeded directly (see file header —
    // the wizard submits against a fixture as of P8, so it can't create these
    // anymore; downstream dashboard/routine/recommendations need a real profile). ---
    const setupDb = pool();
    let skinProfileId: number;
    try {
      const { rows: typeRows } = await setupDb.query(
        "select skin_type_id from skin_types where skin_type_name = 'Sensitive'"
      );
      const { rows: concernRows } = await setupDb.query(
        "select concern_id from skin_concerns where concern_name = 'Acne'"
      );
      // age_group set so the dashboard's real Skin Age derivation (P10/ADR-028,
      // wired live as of P14) has something to compute — a real profile without
      // one is a legitimate empty state, but this journey represents a complete one.
      const { rows: profileRows } = await setupDb.query(
        "insert into skin_profiles (user_id, skin_type_id, age_group) values ($1, $2, $3) returning skin_profile_id",
        [userId, typeRows[0].skin_type_id, "25-34"]
      );
      skinProfileId = profileRows[0].skin_profile_id;
      await setupDb.query(
        "insert into skin_profile_concerns (skin_profile_id, concern_id, severity_rating, priority_level) values ($1, $2, $3, $4)",
        [skinProfileId, concernRows[0].concern_id, 7, 9]
      );
    } finally {
      await setupDb.end();
    }

    const { MongoClient } = await import("mongodb");
    const mongo = new MongoClient(process.env.MONGO_URI ?? "mongodb://localhost:27017/skinlytics");
    try {
      await mongo.connect();
      await mongo
        .db()
        .collection("lifestyle_logs")
        .insertOne({
          user_id: userId,
          log_date: new Date(new Date().toISOString().slice(0, 10)),
          sleep_hours: 7.5,
          water_intake_liters: 2.5,
          stress_level: 4,
          environmental_exposure: { sun_hours: 2 },
          logged_at: new Date(),
        });
    } finally {
      await mongo.close();
    }

    // The wizard's own results page (fixture-based as of P8) is exercised
    // separately by tests/e2e/assessment-wizard.spec.ts.
    //
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
      path: screenshotPath(testInfo, "../docs/milestones/milestone_2/build/user-dashboard"),
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
    // exact: true — the real ingested Sephora catalog (Phase 2) now has 14+
    // ingredient names containing "Retinol" as a substring (e.g. "0.5%
    // Retinol", "Retinol Eye Stick:"), which a non-exact getByRole match
    // resolves to ambiguously. This spec predates that real catalog, when
    // "Retinol" was the only match.
    await page.getByRole("option", { name: "Retinol", exact: true }).click();

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
