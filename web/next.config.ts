import fs from "node:fs";
import path from "node:path";

import type { NextConfig } from "next";

// --- Repo-root .env fallback -------------------------------------------------
//
// web_run.py's header says this app "assumes the root `.env` (and the `web/.env`
// symlink)". That symlink is the weak point: Windows only creates symlinks with
// Developer Mode or admin rights, so on a Windows checkout `web/.env` silently
// becomes an independent *copy* instead. It then rots — both files are gitignored,
// so nothing keeps them in sync and nothing warns you.
//
// That is exactly what happened here: 8 keys (GOOGLE_CLIENT_ID,
// GOOGLE_CLIENT_SECRET, OPENWEATHER_API_KEY, OPENUV_API_KEY, S3_ACCESS_KEY_ID,
// S3_SECRET_ACCESS_KEY, FAISS_INDEX_DIR, AI_IMPL_EMBEDDER) had real values in the
// root .env and empty ones in web/.env, which is why Better Auth logged "Social
// provider google is missing clientId or clientSecret" on a machine where the
// Google credentials were, in fact, configured.
//
// Precedence is deliberately identical to what the symlink gave you:
//   real shell/CI env var  >  root .env  >  nothing
// A key that already holds a non-empty value is never touched, so CI's `env:`
// block (.github/workflows/e2e-ci.yml) still wins and this is a no-op there —
// the root .env is gitignored and doesn't exist on a runner. Only keys that are
// unset or empty get filled, which is precisely the stale-copy case.
function loadRepoRootEnv(): void {
  try {
    const rootEnvPath = path.resolve(__dirname, "..", ".env");
    if (!fs.existsSync(rootEnvPath)) return;

    const filled: string[] = [];
    for (const rawLine of fs.readFileSync(rootEnvPath, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim().replace(/^export\s+/, "");
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;

      const key = line.slice(0, eq).trim();
      if (!key) continue;

      let value = line.slice(eq + 1).trim();
      const quote = value[0];
      if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length > 1) {
        value = value.slice(1, -1);
      } else {
        // Strip a trailing ` # comment`, but only on unquoted values, so a '#'
        // that is genuinely part of a secret survives.
        value = value.replace(/\s+#.*$/, "");
      }
      if (!value) continue;

      const current = process.env[key];
      if (current === undefined || current === "") {
        process.env[key] = value;
        filled.push(key);
      }
    }

    // Say so out loud, but quietly — one count, not a key dump. Naming every key
    // was useful while diagnosing the drift; as steady-state startup noise it is
    // just a list of this app's secret names printed on every boot.
    if (filled.length > 0 && process.env.NODE_ENV !== "production") {
      console.info(`[env] loaded ${filled.length} variable(s) from the repo-root .env`);
    }
  } catch (error) {
    // Never let env loading break the build — worst case we fall back to
    // exactly the behaviour that existed before this function.
    console.warn("[env] could not read the repo-root .env; continuing without it", error);
  }
}

loadRepoRootEnv();

// Now that web/.env is gone and the repo-root .env is the single source of truth,
// the loader above is the ONLY thing putting env vars into this process — which
// makes NEXT_PUBLIC_* a genuine hazard rather than a detail.
//
// Next inlines NEXT_PUBLIC_* into the *client* bundle at compile time, and it
// collects them during its own env pass, which runs before this config module is
// evaluated. Server code (app/api/**/route.ts) reads process.env at request time
// and is fine either way, but browser code is not: web/lib/api.ts reads
// NEXT_PUBLIC_API_URL and web/lib/auth-client.ts reads NEXT_PUBLIC_APP_URL, and
// if those inline as `undefined` every client fetch silently targets
// "undefined/api/v1/..." and sign-in breaks — with no build error to warn you.
//
// Passing them through `env` closes that gap: this object is read off the
// exported config, i.e. strictly after the module body (and therefore after
// loadRepoRootEnv) has run, so whatever the loader put in process.env is what
// gets inlined. Collected dynamically rather than hardcoded so a NEXT_PUBLIC_*
// added to the root .env later is exposed automatically instead of silently
// missing from the browser bundle.
function publicRuntimeEnv(): Record<string, string> {
  const exposed: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("NEXT_PUBLIC_") && typeof value === "string" && value !== "") {
      exposed[key] = value;
    }
  }
  return exposed;
}

// Milestone 1 audit finding: docs/ARCHITECTURE.md §9 requires "security headers/CSP
// on the web app" — nothing was ever set, confirmed via curl (no
// X-Frame-Options/X-Content-Type-Options/etc. on any response). Applied via next.config's
// own `headers()` (runs for every route, including static assets) rather than proxy.ts,
// so a change here can't accidentally regress the route-protection logic that already
// lives there.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // This app is never legitimately framed by another origin.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // camera/microphone stay fully disabled — this app never uses either. geolocation
  // is scoped to `self`, not disabled: lib/hooks/use-weather-uv.ts's real
  // navigator.geolocation call (the topbar's weather/UV chip, built later than this
  // header) was silently broken by the original `geolocation=()` — confirmed live via
  // a real browser context (PERMISSION_DENIED, "Geolocation has been disabled in this
  // document by permissions policy"), not just inspection. `self` still blocks any
  // third-party-framed content from using it, same narrowed-attack-surface intent.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  // Next infers the workspace root by walking up for lockfiles, and on a machine
  // with a stray package-lock.json in the home directory it picked that instead
  // of this app — "We detected multiple lockfiles and selected the directory of
  // C:\\Users\\<user>\\package-lock.json as the root directory". A wrong root
  // changes which files Turbopack watches and traces for output file tracing, so
  // this is pinned explicitly rather than left to inference that varies per
  // developer machine.
  turbopack: { root: path.resolve(__dirname) },
  env: publicRuntimeEnv(),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
