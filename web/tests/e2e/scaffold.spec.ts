import { test, expect } from "@playwright/test";

test("homepage renders the design-token smoke test", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Skinlytics" })).toBeVisible();
  await expect(page.getByText("Skin Health Score")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Primary action" })
  ).toBeVisible();
});
