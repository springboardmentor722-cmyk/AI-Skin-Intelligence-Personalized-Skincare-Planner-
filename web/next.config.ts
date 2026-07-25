import path from "node:path";

import type { NextConfig } from "next";

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
