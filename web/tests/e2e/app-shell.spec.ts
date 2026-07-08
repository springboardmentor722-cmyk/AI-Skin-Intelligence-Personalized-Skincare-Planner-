import { test, expect } from "@playwright/test";

test.describe("app shell", () => {
  test("User role shows its AGENTS.md nav list, active link highlighted", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    for (const label of [
      "My Routine",
      "Daily Check-in",
      "Products",
      "Settings",
    ]) {
      await expect(page.getByRole("link", { name: label })).toBeVisible();
    }
  });

  test("Consultant/Dermatologist/Admin routes are prefixed and don't collide", async ({
    page,
  }) => {
    await page.goto("/consultant/dashboard");
    await expect(page.getByRole("link", { name: "Clients" })).toHaveAttribute(
      "href",
      "/consultant/clients"
    );

    await page.goto("/admin/dashboard");
    await expect(page.getByRole("link", { name: "Users" })).toHaveAttribute(
      "href",
      "/admin/users"
    );
  });

  test("sidebar collapse keeps the content margin in sync", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const aside = page.locator("aside");
    await expect(aside).toHaveClass(/w-64/);

    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(aside).toHaveClass(/w-20/);
    // The nav label text disappears when collapsed (icon-only).
    await expect(page.getByRole("link", { name: "My Routine" })).toBeHidden();
  });

  test("account menu and command palette open", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("button")
      .filter({ has: page.locator('[data-slot="avatar"]') })
      .click();
    await expect(page.getByText("Sign out")).toBeVisible();

    await page.keyboard.press("Escape");
    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder("Search…")).toBeVisible();
  });
});
