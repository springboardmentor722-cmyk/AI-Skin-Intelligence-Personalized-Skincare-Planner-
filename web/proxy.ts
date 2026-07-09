import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Milestone 1 audit finding: no route protection existed at all — every protected
// route rendered a full 200 page shell (nav, layout, the layout's stub userName) for
// an unauthenticated visitor; only the data underneath would eventually 401 once a
// real API call replaced a stub. `getSessionCookie` is Better Auth's own documented
// Edge-safe check — it only confirms a session cookie is present, it does not verify
// the session against the database or decode role claims (that's not possible without
// a network round trip from the Edge runtime). Real authorization still happens where
// it always has: the backend's JWT/JWKS validation on every `/api/v1/*` call
// (`backend/app/core/security.py`). This file exists to stop serving page shells to
// signed-out visitors, not to replace backend enforcement.
//
// Named `proxy.ts` / exports `proxy`, not the older `middleware.ts` convention — Next
// 16.2 deprecated the latter (build warning: "The 'middleware' file convention is
// deprecated. Please use 'proxy' instead.").
const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/api/auth");
  if (isPublic) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, static assets, and the favicon — the allowlist
  // above (not this matcher) is what actually decides public vs protected.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
