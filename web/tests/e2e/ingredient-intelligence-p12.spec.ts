import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, promoteRole, signOut } from "./helpers";

// Milestone 2 P12 — Ingredient Intelligence (mile_2.docx §5). Covers the user-role
// "Ingredient Analyzer" (web/app/(user)/ingredients) and the shared "Ingredient
// Database" (consultant/dermatologist/admin, web/components/ingredients/), both
// already live-wired against the real GET /ingredients* surface (M3-B).

async function signUpAndPromote(
  page: import("@playwright/test").Page,
  email: string,
  role: string | null
): Promise<string> {
  const password = "SuperSecret123!";
  await clearRateLimits();
  await page.goto("/signup");
  await page.fill("#firstName", "Ingredient");
  await page.fill("#lastName", "Tester");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.getByRole("checkbox").click({ force: true });
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/assessment/, { timeout: 10_000 });

  const db = pool();
  let userId: string;
  try {
    const { rows } = await db.query('select id from "user" where email = $1', [email]);
    userId = rows[0].id as string;
  } finally {
    await db.end();
  }

  if (role) {
    await promoteRole(userId, role);
    await signOut(page.request);
    await clearRateLimits();
    await page.goto("/login");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL(new RegExp(`/${role}`), { timeout: 10_000 });
  }

  return userId;
}

test("user Ingredient Analyzer: search, view detail with a suitability verdict, check an interaction", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const email = `e2e-ingredients-user-${Date.now()}@example.com`;
  let userId: string | null = null;

  try {
    userId = await signUpAndPromote(page, email, null);

    await page.goto("/ingredients");
    await expect(page.getByRole("heading", { name: "Ingredient Library" })).toBeVisible();

    await page.getByPlaceholder(/Search by name or INCI/i).fill("Retinol");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByText("Retinol", { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    });

    await page.getByText("Retinol", { exact: true }).first().click();
    await page.waitForURL(/\/ingredients\/\d+/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Retinol" })).toBeVisible();
    // A suitability verdict card renders for the user role (per-profile check).
    await expect(
      page.getByText(/Suitable for your profile|Not recommended for your profile|allergy conflict/i)
    ).toBeVisible({ timeout: 10_000 });

    await page.goto("/ingredients");
    await page.getByRole("button", { name: "Check interactions" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});

for (const role of ["consultant", "dermatologist", "admin"] as const) {
  const basePath = role === "admin" ? "/admin/ingredients" : `/${role}/ingredient-database`;

  test(`${role} Ingredient Database: shared browse + detail view, no per-user suitability card`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const email = `e2e-ingredients-${role}-${Date.now()}@example.com`;
    let userId: string | null = null;

    try {
      userId = await signUpAndPromote(page, email, role);

      await page.goto(basePath);
      // Two "Ingredient Database" headings render: the topbar's page-title label
      // (nav-config's `label`) and the page content's own <h1> — assert the latter.
      await expect(
        page.getByRole("heading", { name: "Ingredient Database" }).last()
      ).toBeVisible();

      await page.getByPlaceholder(/Search by name or INCI/i).fill("Retinol");
      await page.getByRole("button", { name: "Search", exact: true }).click();
      await expect(page.getByText("Retinol", { exact: true }).first()).toBeVisible({
        timeout: 10_000,
      });

      await page.getByText("Retinol", { exact: true }).first().click();
      await page.waitForURL(new RegExp(`${basePath.replace(/\//g, "\\/")}/\\d+`), {
        timeout: 10_000,
      });
      await expect(page.getByRole("heading", { name: "Retinol" })).toBeVisible();
      // No suitability verdict card for a role with no skin profile of its own.
      await expect(
        page.getByText(/Suitable for your profile|Not recommended for your profile/i)
      ).toHaveCount(0);
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });
}
