import { test, expect } from "@playwright/test";

// bugs_report.md 2026-07-26, bug #6 — every footer link used to be href="#". This
// locks in the fix: no footer link points at "#" anymore, and each stub destination
// actually renders (not a 404).
test("landing footer has zero dead links", async ({ page }) => {
  await page.goto("/");

  const footerLinks = page.locator("footer a");
  const count = await footerLinks.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const href = await footerLinks.nth(i).getAttribute("href");
    expect(href).not.toBe("#");
    expect(href).not.toBeNull();
  }
});

test("a footer stub page renders its title, not a 404", async ({ page }) => {
  await page.goto("/legal/privacy-policy");
  // Scoped to <main> — the page's own footer chrome also links to "Privacy Policy".
  await expect(page.getByRole("main").getByText("Privacy Policy")).toBeVisible();
  await expect(page.getByText("Not yet published.")).toBeVisible();
});

test("AI Diagnostic footer link points at the real assessment wizard, not a stub", async ({
  page,
}) => {
  // /assessment intentionally requires auth (backend requires a real user role to
  // submit one) — same funnel-into-signup pattern as every other landing-page CTA,
  // so this checks the link's target rather than the post-redirect URL a signed-out
  // click actually lands on.
  await page.goto("/");
  const href = await page.getByRole("link", { name: "AI Diagnostic" }).getAttribute("href");
  expect(href).toBe("/assessment");
});
