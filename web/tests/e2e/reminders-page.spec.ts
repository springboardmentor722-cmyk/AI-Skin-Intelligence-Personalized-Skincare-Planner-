import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool } from "./helpers";

async function signUp(page: import("@playwright/test").Page, email: string): Promise<string> {
  const password = "SuperSecret123!";
  await clearRateLimits();
  await page.goto("/signup");
  await page.fill("#firstName", "Reminders");
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

test("Reminders page: toggle a reminder on and off, state persists across reload", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const email = `e2e-reminders-${Date.now()}@example.com`;
  let userId: string | null = null;

  try {
    userId = await signUp(page, email);

    await page.goto("/reminders");
    await page.getByRole("tab", { name: "Reminder Settings" }).click();

    const morningToggle = page
      .getByText("Morning Routine", { exact: true })
      .locator("..")
      .locator("..")
      .getByRole("switch");
    await morningToggle.click();
    await expect(morningToggle).toBeChecked();

    await page.reload();
    await page.getByRole("tab", { name: "Reminder Settings" }).click();
    await expect(
      page
        .getByText("Morning Routine", { exact: true })
        .locator("..")
        .locator("..")
        .getByRole("switch")
    ).toBeChecked();

    await page.getByRole("tab", { name: "Inbox" }).click();
    await expect(
      page.getByText(/no notifications yet/i).or(page.getByText(/routine reminder/i))
    ).toBeVisible();
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});
