import { defineConfig, devices } from "@playwright/test";

// e2e config for the M1 screens (docs/WIREFRAMES.md). Individual screens aren't built
// yet (PROGRESS.md) — the scaffold smoke test and the app-shell tests are what exist so
// far. Reduced-transparency emulation isn't a native Playwright context option; cover it
// with a manual `prefers-reduced-transparency` media-query CSS check instead.
export default defineConfig({
  testDir: "./tests/e2e",
  // Branch 8 (feature/testing) finding: this suite hits a real, shared backend —
  // Postgres, Redis, MinIO — not mocks (this project's established testing
  // philosophy). `fullyParallel` runs different *files* concurrently across
  // workers, and several files now sign real accounts up/in for real
  // (auth-hardening, admin-rbac, admin-panel, {consultant,dermatologist}-onboarding,
  // cross-role-verification-journey, app-shell) — all sharing the same IP-scoped
  // Redis rate-limit counters (ADR-013/createRateLimitKey, `{ip}|{path}`). Two
  // files' sign-ups landing in the same window can trip the general default
  // ceiling or each other's lockout-clearing, independent of each file's own
  // internal `serial` mode. `workers: 1` forces the whole suite sequential —
  // slower, but correctness over speed for a suite that deliberately exercises the
  // real stack. Confirmed live: the full suite is flaky under default parallel
  // workers and consistently clean under workers: 1.
  workers: 1,
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
