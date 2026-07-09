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
  // Disable browser features this app doesn't use — narrows the attack surface for
  // any future third-party script without having to revisit this file.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
