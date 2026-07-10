import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, promoteRole } from "./helpers";

// feature/authenticated-landing-header — the public landing page's header
// (components/landing/landing-navbar.tsx) previously always showed Login/"Start free
// assessment" regardless of session state, so an already-authenticated visitor
// (e.g. clicking the sidebar's Skinlytics logo, which has always linked to "/") was
// asked to log in again despite holding a valid Better Auth session. useCurrentUser
// (lib/use-current-user.ts) is the same session hook GlassTopbar's and NavUser's
// account menus already use — extended with role/isPending, not duplicated — so
// this needed zero new authentication state.
test.describe.configure({ mode: "serial" });

test.describe("authenticated landing header", () => {
  test("unauthenticated visitor sees Login/Start free assessment, no console errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start free assessment" })).toBeVisible();

    await page.waitForTimeout(500);
    // Pre-existing, unrelated to this change: next/image optimization 400s on the
    // landing page's own hero/testimonial JPEGs (public/images/landing/*.jpg) —
    // reproduces with zero auth/session code involved at all. Filtered here so this
    // assertion covers what it's actually meant to (no *new* errors from the
    // session-aware header); tracked separately as its own follow-up.
    const relevantErrors = errors.filter((e) => !e.includes("400 (Bad Request)"));
    expect(relevantErrors).toEqual([]);
  });

  test("admin session: avatar menu replaces Login/Signup, role-appropriate items, sign out", async ({
    page,
  }) => {
    const email = `e2e-landing-admin-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      await clearRateLimits();
      await page.goto("/signup");
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "LandingAdmin");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);
      await page.getByRole("checkbox").click({ force: true });
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForURL(/\/assessment/, { timeout: 10_000 });

      const lookupDb = pool();
      try {
        const { rows } = await lookupDb.query('select id from "user" where email = $1', [email]);
        userId = rows[0]?.id ?? null;
      } finally {
        await lookupDb.end();
      }
      expect(userId).not.toBeNull();
      await promoteRole(userId as string, "admin");

      await page.request.post("/api/auth/sign-out");
      await clearRateLimits();
      await page.goto("/login");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.getByRole("button", { name: /^sign in$/i }).click();
      await page.waitForURL(/\/admin\/dashboard/, { timeout: 10_000 });

      // The sidebar's Skinlytics logo has always linked to "/" — this is the exact
      // flow the task description named as broken.
      await page.getByRole("link", { name: "Skinlytics" }).click();
      await page.waitForURL((url) => url.pathname === "/");

      await expect(page.getByRole("button", { name: "Login" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Start free assessment" })).toHaveCount(0);

      const trigger = page.getByRole("button", { name: /E2E LandingAdmin/i });
      await expect(trigger).toBeVisible();
      await trigger.click();

      await expect(page.getByText(email)).toBeVisible();
      await expect(page.getByRole("menuitem", { name: /dashboard/i })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: /settings/i })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: /sign out/i })).toBeVisible();
      // Admin has no skin profile/progress tracking — those are User-only routes,
      // shouldn't be offered to a role that can't reach them.
      await expect(page.getByRole("menuitem", { name: /skin profile/i })).toHaveCount(0);
      await expect(page.getByRole("menuitem", { name: /progress tracking/i })).toHaveCount(0);

      await page.getByRole("menuitem", { name: /sign out/i }).click();
      await expect(page.getByRole("button", { name: "Login" })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole("button", { name: "Start free assessment" })).toBeVisible();
      await expect(trigger).toHaveCount(0);

      // Session actually invalidated server-side, not just hidden client-side.
      await page.goto("/admin/dashboard");
      await page.waitForURL(/\/login/, { timeout: 5000 });
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test("user session: Skin Profile/Progress Tracking appear (resolves /profile's missing nav entry)", async ({
    page,
  }) => {
    const email = `e2e-landing-user-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      await clearRateLimits();
      await page.goto("/signup");
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "LandingUser");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);
      await page.getByRole("checkbox").click({ force: true });
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForURL(/\/assessment/, { timeout: 10_000 });

      const lookupDb = pool();
      try {
        const { rows } = await lookupDb.query('select id from "user" where email = $1', [email]);
        userId = rows[0]?.id ?? null;
      } finally {
        await lookupDb.end();
      }

      await page.goto("/");
      await page.getByRole("button", { name: /E2E LandingUser/i }).click();
      await expect(page.getByRole("menuitem", { name: /skin profile/i })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: /progress tracking/i })).toBeVisible();
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test("keyboard accessibility: Enter opens the menu, Escape closes it", async ({ page }) => {
    const email = `e2e-landing-kbd-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      await clearRateLimits();
      await page.goto("/signup");
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "LandingKbd");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);
      await page.getByRole("checkbox").click({ force: true });
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForURL(/\/assessment/, { timeout: 10_000 });

      const lookupDb = pool();
      try {
        const { rows } = await lookupDb.query('select id from "user" where email = $1', [email]);
        userId = rows[0]?.id ?? null;
      } finally {
        await lookupDb.end();
      }

      await page.goto("/");
      const trigger = page.getByRole("button", { name: /E2E LandingKbd/i });
      await trigger.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("menuitem", { name: /sign out/i })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menuitem", { name: /sign out/i })).toHaveCount(0);
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test("mobile: authenticated header is responsive, no horizontal overflow", async ({ page }) => {
    const email = `e2e-landing-mobile-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      await page.setViewportSize({ width: 375, height: 812 });
      await clearRateLimits();
      await page.goto("/signup");
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "LandingMobile");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);
      await page.getByRole("checkbox").click({ force: true });
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForURL(/\/assessment/, { timeout: 10_000 });

      const lookupDb = pool();
      try {
        const { rows } = await lookupDb.query('select id from "user" where email = $1', [email]);
        userId = rows[0]?.id ?? null;
      } finally {
        await lookupDb.end();
      }

      await page.goto("/");
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

      // At <sm the name text is hidden (only the avatar shows) — wait for the real
      // avatar to replace the loading skeleton, and scope to <header> so this can't
      // accidentally hit an unrelated button further down the long landing page.
      await page.locator("header").getByText("EL").waitFor();
      await page.locator("header").getByRole("button").last().click();
      await expect(page.getByRole("menuitem", { name: /sign out/i })).toBeVisible();
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test("hard refresh preserves the authenticated header, no flash to Login", async ({ page }) => {
    const email = `e2e-landing-refresh-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      await clearRateLimits();
      await page.goto("/signup");
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "LandingRefresh");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);
      await page.getByRole("checkbox").click({ force: true });
      await page.getByRole("button", { name: /create account/i }).click();
      await page.waitForURL(/\/assessment/, { timeout: 10_000 });

      const lookupDb = pool();
      try {
        const { rows } = await lookupDb.query('select id from "user" where email = $1', [email]);
        userId = rows[0]?.id ?? null;
      } finally {
        await lookupDb.end();
      }

      await page.goto("/");
      await expect(page.getByRole("button", { name: /E2E LandingRefresh/i })).toBeVisible();

      // A hard reload re-runs the cookie round trip from scratch (unlike an in-app
      // Link click, which shares Better Auth's already-resolved client state) — this
      // is the one path that can actually show isPending's loading skeleton.
      await page.reload();
      await expect(page.getByRole("button", { name: /E2E LandingRefresh/i })).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByRole("button", { name: "Login" })).toHaveCount(0);
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test("an invalid/garbage session cookie falls back to the unauthenticated view, no crash", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await context.addCookies([
      {
        name: "better-auth.session_token",
        value: "totally-invalid-garbage-token",
        domain: "localhost",
        path: "/",
      },
    ]);
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.reload();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "Start free assessment" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
