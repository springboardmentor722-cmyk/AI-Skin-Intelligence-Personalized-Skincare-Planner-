import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool } from "./helpers";

// Milestone 2 P3 goal: "a Playwright smoke test on the showcase route passing" —
// /design-system sits behind proxy.ts's session check (not in PUBLIC_PATHS), so this
// signs a real account up first, same pattern as every other authenticated e2e spec.
test("design system showcase renders every widget kit section with no console errors", async ({
  page,
}) => {
  const email = `e2e-design-system-${Date.now()}@example.com`;
  const password = "SuperSecret123!";
  let userId: string | null = null;
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    await clearRateLimits();
    await page.goto("/signup");
    await page.fill("#firstName", "Showcase");
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
      userId = rows[0].id as string;
    } finally {
      await db.end();
    }

    await page.goto("/design-system");
    await expect(page.getByRole("heading", { name: "Design System Showcase" })).toBeVisible();

    for (const widget of [
      "StatCard",
      "ScoreRing",
      "ScoreChip",
      "DonutBreakdown",
      "TrendChart",
      "RankedBarList",
      "RosterTable",
      "TimelineList",
      "ChecklistStrip",
      "RoutineChain",
      "ProductCarousel",
      "InsightBanner",
      "StatusTileGrid",
      "QuickActionGrid",
    ]) {
      await expect(page.getByText(widget, { exact: true }).first()).toBeVisible();
    }

    await page.screenshot({ path: "../docs/milestones/milestone_2/build/design-system-showcase.png", fullPage: true });
    expect(consoleErrors, `console errors: ${consoleErrors.join("\n")}`).toEqual([]);
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});
