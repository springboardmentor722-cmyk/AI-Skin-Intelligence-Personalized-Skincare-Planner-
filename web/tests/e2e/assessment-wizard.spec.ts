import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool } from "./helpers";

// Milestone 2 P8 — the assessment wizard's own dedicated coverage
// (MILESTONE_2_MASTER_PROMPT.md P8: "full happy path ... validation blocks ...
// state surviving back-navigation and a page refresh"). Submits against a fixture
// (web/lib/fixtures/assessment-fixtures.ts), not the real backend — P9/P14 wire
// real persistence; this only proves the wizard UI/state machine/payload builder,
// not downstream dashboard/routine integration (user-journey.spec.ts covers that
// with a directly API-seeded profile instead of walking this wizard).
test.describe.configure({ mode: "serial" });

async function signUpToAssessment(page: import("@playwright/test").Page, email: string) {
  const password = "SuperSecret123!";
  await page.goto("/signup");
  await page.getByRole("radio", { name: "User" }).click();
  await page.fill("#firstName", "Wizard");
  await page.fill("#lastName", "Tester");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.getByRole("checkbox").click({ force: true });
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL("**/assessment", { timeout: 10_000 });
}

test("full happy path: type -> concerns -> severity -> lifestyle -> submit -> results", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const email = `e2e-wizard-happy-${Date.now()}@example.com`;
  let userId: string | null = null;

  try {
    await clearRateLimits();
    await signUpToAssessment(page, email);

    const db = pool();
    try {
      const { rows } = await db.query('select id from "user" where email = $1', [email]);
      userId = rows[0]?.id ?? null;
    } finally {
      await db.end();
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
    await page.getByRole("checkbox", { name: "Hyperpigmentation" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Guardrail: a severity slider appears only for a selected concern — exactly 2
    // sliders, one per selection, none for the other 8 seeded concerns.
    await page.waitForURL("**/assessment/severity");
    await expect(page.getByText("Acne Severity")).toBeVisible();
    await expect(page.getByText("Hyperpigmentation Severity")).toBeVisible();
    await expect(page.getByRole("slider")).toHaveCount(2);
    await page.getByRole("button", { name: "Continue" }).click();

    await page.waitForURL("**/assessment/lifestyle");
    await page.getByRole("radio", { name: "Moderate" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.waitForURL("**/assessment/results");
    await expect(page.getByRole("heading", { name: "Diagnostic overview" })).toBeVisible({
      timeout: 10_000,
    });
    for (const label of ["Condition", "Lifestyle", "Routine", "Sleep", "Hydration"]) {
      await expect(page.getByText(new RegExp(`${label} \\(\\d+%\\)`, "i"))).toBeVisible();
    }
    await expect(page.getByText("Acne", { exact: true })).toBeVisible();
    await expect(page.getByText("Hyperpigmentation", { exact: true })).toBeVisible();
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});

test("validation blocks advancement at each step", async ({ page }) => {
  test.setTimeout(90_000);
  const email = `e2e-wizard-validation-${Date.now()}@example.com`;
  let userId: string | null = null;

  try {
    await clearRateLimits();
    await signUpToAssessment(page, email);

    const db = pool();
    try {
      const { rows } = await db.query('select id from "user" where email = $1', [email]);
      userId = rows[0]?.id ?? null;
    } finally {
      await db.end();
    }

    await page.getByRole("button", { name: /begin assessment/i }).click();
    await page.waitForURL("**/assessment/basics");

    // No age group selected yet — Continue must not advance.
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(/select your age group/i)).toBeVisible();
    await expect(page).toHaveURL(/\/assessment\/basics$/);

    await page.getByRole("button", { name: "25-34" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/assessment/skin-type");

    // No skin type selected yet — Continue must not advance.
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(/select your skin type/i)).toBeVisible();
    await expect(page).toHaveURL(/\/assessment\/skin-type$/);

    await page.getByRole("radio", { name: "Dry" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/assessment/concerns");

    // No concern selected yet — Continue must not advance.
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(/select at least one concern/i)).toBeVisible();
    await expect(page).toHaveURL(/\/assessment\/concerns$/);
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});

test("back-navigation and a page refresh both preserve wizard state", async ({ page }) => {
  test.setTimeout(90_000);
  const email = `e2e-wizard-persist-${Date.now()}@example.com`;
  let userId: string | null = null;

  try {
    await clearRateLimits();
    await signUpToAssessment(page, email);

    const db = pool();
    try {
      const { rows } = await db.query('select id from "user" where email = $1', [email]);
      userId = rows[0]?.id ?? null;
    } finally {
      await db.end();
    }

    await page.getByRole("button", { name: /begin assessment/i }).click();
    await page.waitForURL("**/assessment/basics");
    await page.getByRole("button", { name: "25-34" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.waitForURL("**/assessment/skin-type");
    await page.getByRole("radio", { name: "Sensitive" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.waitForURL("**/assessment/concerns");
    await page.getByRole("checkbox", { name: "Redness" }).click();

    // A page refresh mid-step must not lose the earlier steps' answers —
    // sessionStorage-backed (lib/assessment/context.tsx), not component state.
    await page.reload();
    await expect(page.getByRole("checkbox", { name: "Redness" })).toHaveAttribute(
      "aria-checked",
      "true"
    );

    // Back-navigation to skin-type must still show the earlier real selection.
    await page.getByRole("button", { name: "Back" }).click();
    await page.waitForURL("**/assessment/skin-type");
    await expect(page.getByRole("radio", { name: "Sensitive" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});
