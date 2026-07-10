import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool } from "./helpers";

// Phase 3 (theme system) — the real signup -> Settings > Appearance -> instant
// re-theme -> persists in Postgres -> survives reload journey, driven through the
// actual UI. Same real-account discipline as every other e2e spec here (serial,
// `clearRateLimits` before signup, `deleteTestUser` cleanup — user_appearance_
// preferences cascades via its own FK but helpers.ts also deletes it explicitly,
// matching this file's own established convention for every other per-user table).
test.describe.configure({ mode: "serial" });

test.describe("appearance settings", () => {
  test("switch palette and mode -> instant re-theme -> persists across reload", async ({
    page,
  }) => {
    const email = `e2e-appearance-${Date.now()}@example.com`;
    const password = "SuperSecret123!";
    let userId: string | null = null;

    try {
      await clearRateLimits();
      await page.goto("/signup");
      await page.fill("#firstName", "E2E");
      await page.fill("#lastName", "Appearance");
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

      await page.goto("/settings");
      await expect(page.getByRole("heading", { name: "Appearance" })).toBeVisible();

      // Default state: no data-palette attribute, "System" mode selected.
      const initialPalette = await page.evaluate(() =>
        document.documentElement.getAttribute("data-palette")
      );
      expect(initialPalette).toBeNull();

      // Force light mode explicitly — "system" resolves differently depending on
      // the browser context's emulated color scheme (chromium-dark's project
      // config), and the light-mode hex checks below need a deterministic start
      // regardless of which project runs this file.
      await page.getByRole("button", { name: "Light" }).click();
      await expect(page.locator("html")).not.toHaveClass(/dark/);

      // Switch palette -> applies instantly, no reload, no explicit save click.
      await page.getByRole("radio", { name: /^Rose/i }).click();
      await expect(page.getByText("Saved")).toBeVisible({ timeout: 5000 });
      const primaryAfterClick = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
      );
      expect(primaryAfterClick.toLowerCase()).toBe("#881337");

      // Persisted to Postgres, not just localStorage — direct DB check.
      const checkDb = pool();
      try {
        const { rows } = await checkDb.query(
          "select palette, theme_mode from user_appearance_preferences where user_id = $1",
          [userId]
        );
        expect(rows).toHaveLength(1);
        expect(rows[0].palette).toBe("rose");
      } finally {
        await checkDb.end();
      }

      // Switch mode to dark -> real next-themes .dark class, instantly.
      await page.getByRole("button", { name: "Dark" }).click();
      await expect(page.locator("html")).toHaveClass(/dark/);
      // Wait for the background PUT to actually land before reloading — otherwise
      // the reload can race ahead of the write, and the reload's own reconciliation
      // effect (components/app-shell/appearance-sync.tsx) would then "correctly"
      // pull back whatever Postgres still had from before this click.
      await expect(page.getByText("Saved")).toBeVisible({ timeout: 5000 });

      // Reload -> both preferences survive (Postgres reconciliation on load, not
      // just the localStorage cache a same-device reload could trivially pass).
      await page.reload();
      await page.waitForSelector('[data-slot="radio-group-item"][data-checked]');
      await expect(page.locator("html")).toHaveClass(/dark/);
      // Dark mode is active at this point, so --primary resolves to Rose's *dark*
      // value (app/globals.css's `[data-palette="rose"].dark`), not the light one
      // checked earlier.
      const primaryAfterReload = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
      );
      expect(primaryAfterReload.toLowerCase()).toBe("#fda4af");

      // Reset -> back to schema defaults, both locally and in Postgres. Confirmed
      // via a toast (Reset uses its own mutation, separate from the inline "Saved"
      // status text that only tracks palette/mode updates).
      await page.getByRole("button", { name: /reset to default/i }).click();
      await expect(page.getByText("Appearance reset to default.")).toBeVisible({
        timeout: 5000,
      });
      const paletteAfterReset = await page.evaluate(() =>
        document.documentElement.getAttribute("data-palette")
      );
      expect(paletteAfterReset).toBeNull();

      const resetDb = pool();
      try {
        const { rows } = await resetDb.query(
          "select palette, theme_mode from user_appearance_preferences where user_id = $1",
          [userId]
        );
        expect(rows[0].palette).toBe("default");
        expect(rows[0].theme_mode).toBe("system");
      } finally {
        await resetDb.end();
      }
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });
});
