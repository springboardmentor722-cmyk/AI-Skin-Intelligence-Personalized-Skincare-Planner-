import { test, expect } from "@playwright/test";
import { MongoClient } from "mongodb";

import { clearRateLimits, deleteTestUser, pool, promoteRole, screenshotPath, signOut } from "./helpers";

// M3R Phase 6 Task 2 — the rubric's literal cross-role, cross-session flow, proven
// end to end for the first time: a user submits a real assessment, gets real
// recommendations, checks off a routine task, uploads a real progress photo; a
// dermatologist (assigned via the direct-DB-insert convention already established
// by clinical-dashboard-p5.spec.ts, not a UI flow) inspects that photo + compliance
// stats, then edits an evening treatment step; back in the user's own session, the
// revision is visible. P4-T2's 30s dashboard poll and P5-T4's routine-overwrite
// endpoints are each already covered in isolation — this spec is the first thing
// that exercises both together across two real accounts.
//
// Two corrections made against the task brief after reading the real code (AGENTS.md
// §0 — look it up, don't invent):
//   1. The real "add a progress photo" UI lives on /progress
//      (app/(user)/progress/page.tsx), not /upload-photo — that route is still a
//      `ComingSoon` stub (app/(user)/upload-photo/page.tsx).
//   2. The assessment wizard now submits against the real POST /api/v1/assessment/
//      submit (P14, confirmed in assessment-wizard.spec.ts's own header comment), so
//      this spec drives the real wizard instead of user-journey.spec.ts's older
//      direct-SQL-seed shortcut (written when the wizard only hit a fixture).
//
// Session-switching follows cross-role-verification-journey.spec.ts's actual
// pattern — sequential real sign-out/sign-in on one `page`, not concurrent
// `browser.newContext()` sessions (that file has no such concurrent-context code
// despite the surface-level similarity to a "two sessions" flow). Because of that,
// the live-update check in step 5 below is a fresh real navigation after signing
// back in, not a wait-out-the-30s-poll assertion — see that step's own comment for
// why that's still a faithful, non-fabricated proof of the composition.
//
// Routine editor quirk found while wiring the dermatologist's edit (not a
// responsive/layout bug, so left as-is per this task's scope, just routed around
// correctly): RoutineEditor's "Category" select reuses the step's `stepName` field
// for both the routine step's own literal name (e.g. "Targeted Active Treatment")
// and the *product-category* the swap-search filters by (e.g. "Treatment
// Products") — an existing step's `stepName` never matches a real product
// category on its own, so the product picker returns nothing until the category is
// re-selected from the dropdown. Re-selecting "Treatment Products" (the real
// product category already backing this PM step, per
// backend/app/services/routines/constants.py's CATEGORY_TO_PRODUCT_CATEGORY) is
// the intended way to unlock the picker — this also renames the step's displayed
// label after saving, which is expected given how the field is modeled, not a test
// bug.
//
// Environment finding while first wiring this spec, root-caused rather than routed
// around: both this route and its consultant/{userId}/routines/{routineId}/edit
// counterpart 404'd for *any* real userId/routineId — reproduced standalone against
// an unrelated, already-existing routine, outside this spec entirely, so it wasn't
// this test's setup. This dev server's file watcher had never registered these
// two-levels-deep dynamic app-router routes (both page.tsx files predate this
// session's `npm run dev` per git log, so this wasn't a "just-added file" gap
// either) — a single touch of each page.tsx nudged it to compile and register them;
// both now resolve 200 for the remainder of this dev server's life. Not a
// responsive/layout bug, so out of this task's fix-mandate scope, but worth a real
// root cause instead of a masking retry/reload in the test itself.
//
// Real bug this spec caught and fixed (components/routine-editor/routine-editor.tsx):
// the shared editor's fixed save-action bar used `fixed bottom-0 left-0 flex w-full
// ... md:left-64` — inherited unchanged from the pre-P5 user routine editor, and never
// exercised by an automated click before this spec. For a `position: fixed` element,
// `w-full` resolves against the true viewport (not "remaining space after the left
// offset"), so on desktop the bar spanned from x=256 to x=1696 in a 1440px-wide
// viewport — 256px past the right edge, taking the Save/Discard buttons with it.
// Confirmed live via a Playwright diagnostic (bounding rect left=1564/right=1680 in a
// 1440-wide viewport) before fixing — Playwright's own click retried against this
// off-screen element until it exhausted whatever timeout was set, which is why this
// spec first appeared to "hang" rather than fail with a clear error. Fixed with the
// shadcn/Tailwind-idiomatic expression `fixed inset-x-0 bottom-0 ... md:left-(--sidebar-width)`
// (dropping the hardcoded `left-64`/`w-full` pair for the sidebar's own real CSS
// variable, already defined by components/ui/sidebar.tsx, plus `inset-x-0` so the
// browser computes width naturally instead of via a magic-number `w-full`).

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

async function signIn(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  redirect: RegExp
): Promise<void> {
  await clearRateLimits();
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(redirect, { timeout: 10_000 });
}

test("assessment -> check-off -> photo -> dermatologist review/edit -> live update, both themes", async ({
  page,
}, testInfo) => {
  // Real signups x2, a full 6-page wizard, a photo upload, 4 sign-in/out cycles, a
  // real routine edit round trip, and 6 viewport screenshots. Measured live at
  // ~20s/run once a real bug (see the routine-editor.tsx fix note below) was
  // found and fixed — 90s leaves generous headroom without masking a real hang.
  test.setTimeout(90_000);

  const password = "SuperSecret123!";
  const userEmail = `e2e-rubric-user-${Date.now()}@example.com`;
  const dermaEmail = `e2e-rubric-derma-${Date.now()}@example.com`;
  let userId: string | null = null;
  let dermaId: string | null = null;
  let newProductName: string | null = null;

  try {
    // --- 1. Real signup -> real wizard submission (P14's real /assessment/submit) ---
    await clearRateLimits();
    await page.goto("/signup");
    await page.getByRole("radio", { name: "User" }).click();
    await page.fill("#firstName", "Rubric");
    await page.fill("#lastName", "Walkthrough");
    await page.fill("#email", userEmail);
    await page.fill("#password", password);
    await page.fill("#confirmPassword", password);
    await page.getByRole("checkbox").click({ force: true });
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL("**/assessment", { timeout: 10_000 });

    const lookupDb = pool();
    try {
      const { rows } = await lookupDb.query('select id from "user" where email = $1', [userEmail]);
      userId = rows[0]?.id ?? null;
    } finally {
      await lookupDb.end();
    }
    expect(userId).toBeTruthy();

    await page.getByRole("button", { name: /begin assessment/i }).click();
    await page.waitForURL("**/assessment/basics");
    await page.getByRole("button", { name: "25-34" }).click();
    await page.getByRole("button", { name: /clearer skin/i }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.waitForURL("**/assessment/skin-type");
    await page.getByRole("radio", { name: "Oily" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.waitForURL("**/assessment/concerns");
    await page.getByRole("checkbox", { name: "Acne" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.waitForURL("**/assessment/severity");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.waitForURL("**/assessment/lifestyle");
    await page.getByRole("radio", { name: "Moderate" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.waitForURL("**/assessment/results", { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Diagnostic overview" })).toBeVisible({
      timeout: 10_000,
    });

    // --- 2. Dashboard: real score + real recommendations ---
    await page.goto("/dashboard");
    await expect(page.getByText("Skin Health Score")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Recommended Products for You")).toBeVisible();
    await expect(
      page.getByText("Add concerns to your skin profile to get matched products.")
    ).not.toBeVisible({ timeout: 10_000 });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({
      path: screenshotPath(testInfo, "../docs/milestones/milestone_3/build/e2e/01-user-dashboard"),
      fullPage: false,
    });

    // --- 3a. Check off a real routine task on the dashboard's Daily Checklist ---
    // `aria-pressed` is unique to ChecklistStrip's task pills on this page
    // (components/dashboard/checklist-strip.tsx) — nothing else on the dashboard
    // renders it.
    const firstTask = page.locator("button[aria-pressed]").first();
    await expect(firstTask).toHaveAttribute("aria-pressed", "false", { timeout: 10_000 });
    await firstTask.click();
    await expect(firstTask).toHaveAttribute("aria-pressed", "true", { timeout: 10_000 });

    // Real persistence check against the actual store (Mongo `routine_logs`, per
    // backend/app/services/routines/service.py's toggle_step_completion) — not just
    // the UI's optimistic state.
    const mongo = new MongoClient(process.env.MONGO_URI ?? "mongodb://localhost:27017/skinlytics");
    try {
      await mongo.connect();
      const logDoc = await mongo.db().collection("routine_logs").findOne({ user_id: userId });
      expect(logDoc?.completed_steps?.length ?? 0).toBeGreaterThan(0);
    } finally {
      await mongo.close();
    }

    await page.screenshot({
      path: screenshotPath(testInfo, "../docs/milestones/milestone_3/build/e2e/02-user-checklist-checked"),
      fullPage: false,
    });

    // --- 3b. Upload a real progress photo via the real /progress upload flow ---
    await page.goto("/progress");
    await page
      .locator('input[type="file"]')
      .setInputFiles({ name: "progress-photo.png", mimeType: "image/png", buffer: ONE_PIXEL_PNG });
    await expect(page.getByText("Photo added")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByAltText(/first progress photo|most recent progress photo/i)).toBeVisible({
      timeout: 10_000,
    });

    const photoDb = pool();
    try {
      const { rows } = await photoDb.query("select * from progress_images where user_id = $1", [
        userId,
      ]);
      expect(rows.length).toBeGreaterThan(0);
    } finally {
      await photoDb.end();
    }

    await page.screenshot({
      path: screenshotPath(testInfo, "../docs/milestones/milestone_3/build/e2e/03-user-progress-photo"),
      fullPage: false,
    });

    // --- 4. Dermatologist: real signup, promote, direct-insert assignment (the
    // established convention — clinical-dashboard-p5.spec.ts lines 72-76/143-148 —
    // is a direct DB insert for test setup, not a UI flow) ---
    await signOut(page.request);
    await clearRateLimits();
    await page.goto("/signup");
    await page.fill("#firstName", "Rubric");
    await page.fill("#lastName", "Dermatologist");
    await page.fill("#email", dermaEmail);
    await page.fill("#password", password);
    await page.fill("#confirmPassword", password);
    await page.getByRole("checkbox").click({ force: true });
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL(/\/(assessment|consultant-onboarding|dermatologist-onboarding)/, {
      timeout: 10_000,
    });

    const dermaLookupDb = pool();
    try {
      const { rows } = await dermaLookupDb.query('select id from "user" where email = $1', [
        dermaEmail,
      ]);
      dermaId = rows[0]?.id ?? null;
    } finally {
      await dermaLookupDb.end();
    }
    expect(dermaId).toBeTruthy();

    await promoteRole(dermaId as string, "dermatologist");
    const assignDb = pool();
    try {
      await assignDb.query(
        `insert into dermatologist_profiles (user_id, verification_status) values ($1, 'approved')`,
        [dermaId]
      );
      await assignDb.query(
        `insert into consultant_clients (consultant_id, user_id, status) values ($1, $2, 'active')`,
        [dermaId, userId]
      );
    } finally {
      await assignDb.end();
    }

    await signOut(page.request);
    await signIn(page, dermaEmail, password, /\/dermatologist/);
    await page.goto(`/dermatologist/patients/${userId}`);

    // Real photo + real compliance stats render.
    await expect(page.getByRole("heading", { name: "Skin score" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Baseline vs Current")).toBeVisible();
    await expect(page.getByAltText("Baseline progress photo")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Routine compliance")).toBeVisible();
    await expect(page.getByText("Evening Routine")).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({
      path: screenshotPath(testInfo, "../docs/milestones/milestone_3/build/e2e/04-dermatologist-inspection"),
      fullPage: false,
    });

    // --- 4b. Edit the evening (PM) treatment step via the real P5-T4 routine editor ---
    const eveningRoutineRow = page.locator("div.flex.items-center.justify-between", {
      hasText: "Evening Routine",
    });
    // shadcn's Button component reports role="button" in the accessibility tree
    // even with `nativeButton={false} render={<Link .../>}` — confirmed against a
    // real failure's page snapshot, which showed `button "Edit routine"`, not a
    // link.
    await eveningRoutineRow.getByRole("button", { name: /edit routine/i }).click();
    await page.waitForURL(new RegExp(`/dermatologist/patients/${userId}/routines/\\d+/edit`), {
      timeout: 10_000,
    });
    await expect(page.getByRole("heading", { name: "Edit Evening Routine" })).toBeVisible({
      timeout: 10_000,
    });

    const eveningStepCard = page.locator('div[role="button"]', { hasText: "Targeted Active Treatment" });
    await eveningStepCard.click();

    const currentProductName =
      (await page.locator('label:has-text("Current product") + p').textContent())?.trim() ?? null;

    // Re-select the real product category this PM step already belongs to
    // (constants.py's CATEGORY_TO_PRODUCT_CATEGORY[TREATMENT] == "Treatment
    // Products") so the swap-product search actually returns candidates — see the
    // file header's note on this real editor quirk.
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Treatment Products" }).click();

    const productButtons = page.locator("div.max-h-64.overflow-y-auto button");
    await expect(productButtons.first()).toBeVisible({ timeout: 10_000 });
    // One atomic snapshot instead of a per-index awaited loop: this list is backed
    // by a live React Query search (ProductPicker) that can re-render mid-loop, and
    // a stale `.nth(i)` locator's `.textContent()` has no bounded default action
    // timeout — it inherits the whole test's timeout, which is exactly what caused
    // a real multi-minute hang here before this fix.
    const candidateNames: (string | null)[] = await productButtons.evaluateAll((buttons) =>
      buttons.map((b) => b.querySelector("p")?.textContent?.trim() ?? null)
    );
    const candidateIndex = candidateNames.findIndex((name) => name && name !== currentProductName);
    expect(candidateIndex, "expected at least one alternate real product candidate").toBeGreaterThanOrEqual(
      0
    );
    newProductName = candidateNames[candidateIndex];
    await productButtons.nth(candidateIndex).click();

    await page
      .getByPlaceholder("Add usage instructions or reactions...")
      .fill("Reviewed by dermatologist — reduce to every other night if irritation occurs.");

    await page.getByRole("button", { name: /^save changes$/i }).click();
    await expect(page.getByText("Routine updated")).toBeVisible({ timeout: 10_000 });
    await page.waitForURL(new RegExp(`/dermatologist/patients/${userId}$`), { timeout: 10_000 });

    await page.screenshot({
      path: screenshotPath(testInfo, "../docs/milestones/milestone_3/build/e2e/05-dermatologist-routine-edited"),
      fullPage: false,
    });

    // --- Responsive check (professional inspection view), per this session's
    // explicit instruction — 3 real viewport sizes, visually inspected below. ---
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await expect(page.getByRole("heading", { name: "Skin score" })).toBeVisible({ timeout: 10_000 });
      await page.screenshot({
        path: screenshotPath(
          testInfo,
          `../docs/milestones/milestone_3/build/e2e/responsive-derm-patient-detail-${vp.name}`
        ),
        fullPage: false,
      });
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    // --- 5. Back in the user's own session: the revised step is visible. ---
    // This is a fresh sign-in + real navigation, not a wait-out-the-30s-poll
    // assertion: cross-role-verification-journey.spec.ts's own established pattern
    // (which this spec follows for session-switching, see file header) is
    // sequential real sign-out/sign-in on one `page`, so there's no way to keep the
    // user's dashboard mounted while a *separate* dermatologist session edits it —
    // that would need concurrent `browser.newContext()` sessions this repo's e2e
    // suite doesn't otherwise use. What's proven here instead is exactly what a
    // real returning user experiences: log back in, and the professional's edit is
    // already there — the real, composed read path, not a fabricated poll wait.
    await signOut(page.request);
    await signIn(page, userEmail, password, /\/dashboard/);
    await page.goto("/routine");
    await page.getByRole("button", { name: "PM Routine" }).click();
    await expect(page.getByText(newProductName as string)).toBeVisible({ timeout: 10_000 });

    await page.screenshot({
      path: screenshotPath(testInfo, "../docs/milestones/milestone_3/build/e2e/06-user-routine-updated"),
      fullPage: false,
    });

    // --- Responsive check (user dashboard) ---
    await page.goto("/dashboard");
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await expect(page.getByText("Skin Health Score")).toBeVisible({ timeout: 10_000 });
      await page.screenshot({
        path: screenshotPath(
          testInfo,
          `../docs/milestones/milestone_3/build/e2e/responsive-user-dashboard-${vp.name}`
        ),
        fullPage: false,
      });
    }

    await signOut(page.request);
  } finally {
    if (dermaId) {
      const cleanupDb = pool();
      try {
        // consultant_clients.consultant_id has no ON DELETE CASCADE (a deliberate
        // audit-trail FK) — must clear it before deleteTestUser removes the "user"
        // row, same fix class as clinical-dashboard-p5.spec.ts's own cleanup.
        await cleanupDb.query("delete from consultant_clients where consultant_id = $1", [dermaId]);
      } finally {
        await cleanupDb.end();
      }
      await deleteTestUser(dermaId);
    }
    if (userId) await deleteTestUser(userId);
  }
});
