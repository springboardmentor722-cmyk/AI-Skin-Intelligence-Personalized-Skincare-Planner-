// Records a walkthrough of every appearance palette x light/dark mode: landing page
// intro, login, then per (palette, mode) combo apply it in Settings and slow-scroll
// both the dashboard and the landing page. Saves web/demo-recordings/<ts>/*.webm and
// converts to <repo-root>/themes_ui.mp4 via ffmpeg-static (Playwright's own bundled
// ffmpeg has no mp4 muxer).
//
// Usage: node scripts/themes-ui-record.js
// Requires: npm run dev already running on localhost:3000, credentials.md at repo root
// (gitignored — never hardcode the password here instead).

const { chromium } = require("@playwright/test");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const BASE_URL = "http://localhost:3000";
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const CREDS_PATH = path.join(REPO_ROOT, "credentials.md");
const OUT_MP4 = path.join(REPO_ROOT, "themes_ui.mp4");
const RECORDINGS_DIR = path.join(__dirname, "..", "demo-recordings", new Date().toISOString().replace(/[:.]/g, "-"));

const PALETTES = ["default", "emerald", "ocean", "lavender", "sunset", "slate", "rose", "forest"];
const PALETTE_LABEL = {
  default: "Skinlytics Default",
  emerald: "Emerald",
  ocean: "Ocean",
  lavender: "Lavender",
  sunset: "Sunset",
  slate: "Slate",
  rose: "Rose",
  forest: "Forest",
};
const MODES = ["light", "dark"];

function loadUserCreds() {
  const text = fs.readFileSync(CREDS_PATH, "utf8");
  const row = text.split("\n").find((line) => /^\|\s*user\s*\|/.test(line));
  const m = row && row.match(/^\|\s*user\s*\|\s*(\S+@\S+)\s*\|\s*(\S+)\s*\|/);
  if (!m) throw new Error(`Couldn't find the "user" row in ${CREDS_PATH}`);
  return { email: m[1], password: m[2] };
}

async function slowScroll(page, steps = 8, stepDelayMs = 450) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  if (height <= 0) return;
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "smooth" }), Math.round((height * i) / steps));
    await page.waitForTimeout(stepDelayMs);
  }
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
}

async function applyAppearance(page, palette, mode) {
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Appearance" }).waitFor();
  await page.getByRole("button", { name: mode === "dark" ? "Dark" : "Light", exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole("radio", { name: new RegExp(`^${PALETTE_LABEL[palette]}`) }).click();
  await page.waitForTimeout(600);
}

async function main() {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
  const { email, password } = loadUserCreds();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: RECORDINGS_DIR, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();

  console.log("Landing page, toggling theme...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Toggle theme" }).click(); // -> dark
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Toggle theme" }).click(); // -> light
  await page.waitForTimeout(1200);

  console.log("Login:", email);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
  await page.waitForTimeout(800);

  for (const palette of PALETTES) {
    for (const mode of MODES) {
      console.log(`Theme: ${PALETTE_LABEL[palette]} / ${mode}`);
      await applyAppearance(page, palette, mode);

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      await slowScroll(page);

      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      await slowScroll(page);
    }
  }

  await context.close();
  await browser.close();

  const files = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith(".webm"));
  if (files.length === 0) throw new Error(`No .webm recording found in ${RECORDINGS_DIR}`);
  const webmPath = path.join(RECORDINGS_DIR, files[0]);

  console.log(`Converting ${webmPath} -> ${OUT_MP4}...`);
  const ffmpeg = require("ffmpeg-static");
  execFileSync(ffmpeg, ["-y", "-i", webmPath, "-c:v", "libx264", "-pix_fmt", "yuv420p", OUT_MP4], {
    stdio: "inherit",
  });
  console.log("Saved:", OUT_MP4);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
