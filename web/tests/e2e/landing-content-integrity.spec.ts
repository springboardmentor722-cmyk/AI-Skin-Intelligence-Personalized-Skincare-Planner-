import { test, expect } from "@playwright/test";

// Landing-page redesign (docs/superpowers/specs/2026-08-19-landing-page-redesign-design.md
// §2/§5) removed 3 fabricated-stat/testimonial locations (hero avatar row, final CTA,
// testimonials quotes) and replaced TestimonialsSection with TrustStrip's real
// capability statements. This locks in that none of them can silently come back.
test("landing page has no fabricated user-count or testimonial claims", async ({ page }) => {
  await page.goto("/");
  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toContain("12,000");
  expect(bodyText).not.toContain("Sarah Chen");
  expect(bodyText).not.toContain("Marcus Reed");
});

test("TrustStrip shows real capability statements", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByText("Skin Score weighted across 5 clinical dimensions")
  ).toBeVisible();
  await expect(page.getByText("Advisory AI, never a diagnosis")).toBeVisible();
});

test("RolesSection uses title-case role labels matching the wireframe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "For Individuals", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "For Consultants", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "For Dermatologists", exact: true })).toBeVisible();
});
