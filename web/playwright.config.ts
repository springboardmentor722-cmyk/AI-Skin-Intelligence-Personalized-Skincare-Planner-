import { defineConfig, devices } from "@playwright/test";

// e2e config for the M1 screens (docs/WIREFRAMES.md). Screens aren't built yet
// (PROGRESS.md) — only a scaffold smoke test exists in tests/e2e/ so far.
// Reduced-transparency emulation isn't a native Playwright context option;
// when the app shell/glass components land, cover it with a manual
// `prefers-reduced-transparency` media-query CSS check instead.
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
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
