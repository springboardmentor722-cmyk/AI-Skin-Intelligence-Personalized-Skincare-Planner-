import { test, expect } from "@playwright/test";

// Rewritten for Branch 8 (feature/testing) — this was a smoke test for a
// placeholder homepage that has since been fully replaced by the real public
// landing page ("feat(web): build the public landing page"). "Skin Health Score"
// and a "Primary action" button never existed on that real page; this checks the
// actual current content instead.
test("homepage renders the real public landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Skinlytics" }).first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /skincare intelligence, personalized to your skin/i })
  ).toBeVisible();
  // Rendered via Button's polymorphic `render={<Link>}` (components/ui/button.tsx) —
  // exposes as role="button" in the accessibility tree, not "link".
  await expect(page.getByRole("button", { name: "Get started free" }).first()).toBeVisible();
});
