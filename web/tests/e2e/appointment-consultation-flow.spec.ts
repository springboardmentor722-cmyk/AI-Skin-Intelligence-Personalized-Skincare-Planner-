import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, promoteRole, signOut } from "./helpers";

// The appointment/consultation flow (booking-panel.tsx, appointment-detail-dialog.tsx,
// use-appointments.ts) is fully implemented and backend-tested (91+28 backend tests,
// 47/47 real HTTP smoke test, real 3-role browser walkthrough) but had zero Playwright
// coverage before this file. One real, chained journey through real UI — same "single
// page, sequential signOut/signIn per role" shape as cross-role-verification-journey.spec.ts
// — rather than mocking. Provider setup (consultant_profiles + provider_availability)
// is seeded directly via SQL, same "direct DB write for test setup" pattern
// clinical-dashboard-p5.spec.ts already uses to reach an *approved* profile without
// re-walking the onboarding wizard + admin review UI (already covered by
// cross-role-verification-journey.spec.ts / consultant-onboarding.spec.ts).
test.describe.configure({ mode: "serial" });

const PASSWORD = "SuperSecret123!";
const MEETING_LINK = "https://meet.google.com/abc-defg-hij";

async function signUpUser(
  page: import("@playwright/test").Page,
  email: string,
  firstName: string,
  lastName: string
): Promise<string> {
  await clearRateLimits();
  await page.goto("/signup");
  await page.fill("#firstName", firstName);
  await page.fill("#lastName", lastName);
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.fill("#confirmPassword", PASSWORD);
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

// Direct DB write for test setup (see file header) — bypasses the full
// onboarding-wizard + admin-review UI, which is already covered elsewhere, and
// gives the provider wide-open availability so a "book tomorrow" test is never
// flaky depending on which weekday the suite happens to run.
async function makeApprovedProvider(
  page: import("@playwright/test").Page,
  email: string,
  firstName: string,
  lastName: string
): Promise<string> {
  const providerId = await signUpUser(page, email, firstName, lastName);
  await promoteRole(providerId, "consultant");
  const db = pool();
  try {
    await db.query(
      `insert into consultant_profiles (user_id, verification_status) values ($1, 'approved')`,
      [providerId]
    );
    for (let day = 0; day < 7; day++) {
      await db.query(
        `insert into provider_availability
           (provider_id, day_of_week, start_time, end_time, slot_duration_minutes)
         values ($1, $2, '00:00', '23:30', 30)`,
        [providerId, day]
      );
    }
  } finally {
    await db.end();
  }
  return providerId;
}

async function signIn(
  page: import("@playwright/test").Page,
  email: string
): Promise<void> {
  await clearRateLimits();
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/(dashboard|consultant|dermatologist)/, { timeout: 10_000 });
}

// The Calendar (components/ui/calendar.tsx, react-day-picker) exposes exactly
// one ARIA grid, containing only day-cell buttons (nav/prev/next live outside
// it) — `disabled={{ before: new Date() }}` means the first enabled day is
// always "today" and the second is always "tomorrow", so this sidesteps any
// locale-dependent date-string formatting entirely (data-day's
// `toLocaleDateString()` render format doesn't reliably match between the
// Node test process's locale and the browser's).
function tomorrowDayButton(page: import("@playwright/test").Page) {
  return page.locator('[role="grid"] button:not([disabled])').nth(1);
}

async function getToken(page: import("@playwright/test").Page): Promise<string> {
  const res = await page.request.get("/api/auth/token");
  const body = (await res.json()) as { token?: string };
  if (!body.token) throw new Error("Couldn't mint a JWT for the signed-in session.");
  return body.token;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

test("book -> provider confirms + sets meeting link -> user sees it; cross-provider and user-role edits are rejected", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const ts = Date.now();
  const userEmail = `e2e-appt-user-${ts}@example.com`;
  const providerAEmail = `e2e-appt-providera-${ts}@example.com`;
  const providerBEmail = `e2e-appt-providerb-${ts}@example.com`;
  const concernText = "Persistent redness on both cheeks after using a new cleanser.";
  const userPhone = "+91 98765 43210";

  let userId: string | null = null;
  let providerAId: string | null = null;
  let providerBId: string | null = null;

  try {
    // --- Setup: real user + two real, pre-approved consultants ---
    userId = await signUpUser(page, userEmail, "Journey", "Client");
    const setupDb = pool();
    try {
      await setupDb.query(
        `insert into user_profiles (user_id, phone_number) values ($1, $2)
         on conflict (user_id) do update set phone_number = excluded.phone_number`,
        [userId, userPhone]
      );
    } finally {
      await setupDb.end();
    }

    await signOut(page.request);
    providerAId = await makeApprovedProvider(page, providerAEmail, "Journey", "ProviderA");
    await signOut(page.request);
    providerBId = await makeApprovedProvider(page, providerBEmail, "Journey", "ProviderB");
    await signOut(page.request);

    // --- User: real booking through the UI ---
    await signIn(page, userEmail);
    await page.goto("/appointments");
    await page.getByRole("button", { name: "Journey ProviderA" }).click();
    await tomorrowDayButton(page).click();
    const slotButton = page.getByRole("button").filter({ hasText: /^\d{1,2}:\d{2}/ }).first();
    await expect(slotButton).toBeVisible({ timeout: 10_000 });
    await slotButton.click();
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.getByLabel("Describe your concern").fill(concernText);
    await page.getByRole("button", { name: /confirm booking/i }).click();
    await expect(page.getByText(/appointment booked/i)).toBeVisible({ timeout: 10_000 });

    const lookupDb = pool();
    let appointmentId: number;
    try {
      const { rows } = await lookupDb.query(
        "select appointment_id from appointments where user_id = $1 and provider_id = $2 order by appointment_id desc limit 1",
        [userId, providerAId]
      );
      appointmentId = rows[0].appointment_id as number;
    } finally {
      await lookupDb.end();
    }
    expect(appointmentId).toBeTruthy();

    await signOut(page.request);

    // --- Provider A (assigned): sees concern + client email/phone, confirms,
    // sets the meeting link ---
    await signIn(page, providerAEmail);
    await page.goto("/consultant/reminders");
    await page.getByRole("tab", { name: "Upcoming" }).click();
    await page.getByText("Journey Client").click();
    await expect(page.getByText(concernText)).toBeVisible();

    await page.getByRole("button", { name: /open profile/i }).click();
    await page.waitForURL(new RegExp(`/consultant/clients/${userId}`));
    await expect(page.getByText(userEmail)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(userPhone)).toBeVisible();

    await page.goto("/consultant/reminders");
    await page.getByRole("tab", { name: "Upcoming" }).click();
    await page.getByText("Journey Client").click();
    await page.getByRole("button", { name: /^confirm$/i }).click();
    await expect(page.getByText(/appointment confirmed/i)).toBeVisible({ timeout: 10_000 });

    await page.fill("#meeting-link-input", MEETING_LINK);
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText(/meeting link saved/i)).toBeVisible({ timeout: 10_000 });

    await signOut(page.request);

    // --- User: sees the concern (still) + the meeting link + a working Join link ---
    await signIn(page, userEmail);
    await page.goto("/appointments");
    await page.getByRole("tab", { name: "My appointments" }).click();
    await page.getByRole("tab", { name: "Upcoming" }).click();
    await page.getByText("Journey ProviderA").click();
    await expect(page.getByText(concernText)).toBeVisible();
    const joinLink = page.getByRole("link", { name: /join meeting/i });
    await expect(joinLink).toBeVisible();
    await expect(joinLink).toHaveAttribute("href", MEETING_LINK);
    // Negative (user role): the editable meeting-link control never renders for
    // a "user" viewer (appointment-detail-dialog.tsx's isProvider branch).
    await expect(page.locator("#meeting-link-input")).toHaveCount(0);

    // Negative (user role, direct API): PATCH the meeting link as the user —
    // require_role("consultant", "dermatologist") rejects it, 403.
    const userToken = await getToken(page);
    const userAttempt = await page.request.patch(
      `${API_BASE}/api/v1/appointments/${appointmentId}/meeting-link`,
      {
        headers: { Authorization: `Bearer ${userToken}` },
        data: { meeting_link: "https://evil.example.com" },
      }
    );
    expect(userAttempt.status()).toBe(403);

    await signOut(page.request);

    // --- Negative (different provider): Provider B has no visibility into this
    // appointment at all, and a direct API edit attempt is rejected as
    // "not found" (AppointmentOwnershipError -> 404), not just "forbidden" —
    // no existence leak. ---
    await signIn(page, providerBEmail);
    await page.goto("/consultant/reminders");
    await page.getByRole("tab", { name: "Upcoming" }).click();
    await expect(page.getByText(/no upcoming appointments/i)).toBeVisible();
    await expect(page.getByText("Journey Client")).not.toBeVisible();

    const providerBToken = await getToken(page);
    const providerBAttempt = await page.request.patch(
      `${API_BASE}/api/v1/appointments/${appointmentId}/meeting-link`,
      {
        headers: { Authorization: `Bearer ${providerBToken}` },
        data: { meeting_link: "https://evil.example.com" },
      }
    );
    expect(providerBAttempt.status()).toBe(404);

    // The real link Provider A set was never overwritten by either attempt.
    const finalDb = pool();
    try {
      const { rows } = await finalDb.query(
        "select meeting_link from appointments where appointment_id = $1",
        [appointmentId]
      );
      expect(rows[0].meeting_link).toBe(MEETING_LINK);
    } finally {
      await finalDb.end();
    }

    await signOut(page.request);
  } finally {
    if (userId) await deleteTestUser(userId);
    if (providerAId) await deleteTestUser(providerAId);
    if (providerBId) await deleteTestUser(providerBId);
  }
});
