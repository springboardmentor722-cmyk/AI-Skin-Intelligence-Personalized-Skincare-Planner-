import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool } from "./helpers";

async function signUp(page: import("@playwright/test").Page, email: string): Promise<string> {
  const password = "SuperSecret123!";
  await clearRateLimits();
  await page.goto("/signup");
  await page.fill("#firstName", "Reports");
  await page.fill("#lastName", "Tester");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.getByRole("checkbox").click({ force: true });
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/assessment/, { timeout: 10_000 });

  const db = pool();
  try {
    const { rows } = await db.query('select id from "user" where email = $1', [email]);
    return rows[0].id as string;
  } finally {
    await db.end();
  }
}

test("Reports page: generate a report, see it in Recent Reports, download it", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const email = `e2e-reports-${Date.now()}@example.com`;
  let userId: string | null = null;

  try {
    userId = await signUp(page, email);

    await page.goto("/reports");
    // The app-shell header mirrors the page title as its own <h1>, so "Reports"
    // matches multiple headings (header + page + "Recent Reports"); .first() just
    // confirms navigation landed on a page with a visible "Reports" heading.
    await expect(page.getByRole("heading", { name: "Reports" }).first()).toBeVisible();

    await page
      .getByText("Skin Assessment", { exact: true })
      .locator("..")
      .getByRole("button", { name: /generate report/i })
      .click();

    await expect(page.getByRole("row").filter({ hasText: "assessment" })).toBeVisible({
      timeout: 15_000,
    });

    // downloadReport() opens a blank tab synchronously (to survive the popup
    // blocker), then redirects it to the presigned URL once it resolves — so the
    // "popup" fires on `page` first, and Chromium's PDF-download interception then
    // fires "download" on that popup tab, not on `page` itself.
    const [popup] = await Promise.all([
      page.waitForEvent("popup", { timeout: 10_000 }),
      page.getByRole("button", { name: "Download assessment report" }).click(),
    ]);
    const download = await popup.waitForEvent("download", { timeout: 10_000 });
    expect(download.url()).toContain("reports/");
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});
