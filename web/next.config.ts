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

    // Say so out loud. A silent fallback would just hide the next drift.
    if (filled.length > 0 && process.env.NODE_ENV !== "production") {
      console.info(
        `[env] filled ${filled.length} key(s) from the repo-root .env that were ` +
          `missing or empty in web/.env: ${filled.join(", ")}`
      );
    }
  } catch (error) {
    // Never let env loading break the build — worst case we fall back to
    // exactly the behaviour that existed before this function.
    console.warn("[env] could not read the repo-root .env; continuing without it", error);
  }
}

loadRepoRootEnv();

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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
