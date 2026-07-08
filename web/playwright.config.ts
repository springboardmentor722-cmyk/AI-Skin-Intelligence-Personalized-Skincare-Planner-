import { defineConfig, devices } from "@playwright/test";

// e2e config for the M1 screens (docs/WIREFRAMES.md). Individual screens aren't built
// yet (PROGRESS.md) — the scaffold smoke test and the app-shell tests are what exist so
// far. Reduced-transparency emulation isn't a native Playwright context option; cover it
// with a manual `prefers-reduced-transparency` media-query CSS check instead.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-light",
      use: { ...devices["Desktop Chrome"], colorScheme: "light" },
    },
    {
      name: "chromium-dark",
      use: { ...devices["Desktop Chrome"], colorScheme: "dark" },
    },
  ],
  // Production build, not `next dev` — the dev-mode overlay (bottom-left "N" indicator)
  // physically overlaps fixed-position chrome like the sidebar's collapse toggle and
  // intercepts real Playwright clicks there, unrelated to any app bug.
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
