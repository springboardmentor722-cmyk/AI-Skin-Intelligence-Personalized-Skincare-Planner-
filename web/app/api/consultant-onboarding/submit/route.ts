import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

interface SubmitBody {
  qualifications: string;
  yearsOfExperience: number | null;
  currentOrganization: string;
  licenseNumber: string;
  specializations: string[];
  areasOfExpertise: string[];
  languages: string[];
  consultationModes: string[];
  availability: string;
  biography: string;
  phone: string;
  location: string;
  clinicAddress: string;
  linkedinUrl: string;
  portfolioUrl: string;
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Orchestrates the two halves of "become a consultant" that no single system owns
// end to end (Branch 4, docs/DECISIONS.md professional-verification ADR): FastAPI's
// consultant_profiles is the system of record for the profile itself, but only
// Better Auth can change `user.role` — and Better Auth's own admin-gated `set-role`
// action (web/app/api/admin/set-role/route.ts) can't be used here since this is a
// *self*-service transition, not an admin one. `auth.$context.internalAdapter.
// updateUser` is the exact function Better Auth's own endpoints call internally
// (confirmed in node_modules/better-auth/dist/api/routes/update-user.mjs) — using it
// directly also refreshes the Redis-cached session (ADR-013's secondaryStorage),
// which a raw SQL UPDATE would not: confirmed live that a direct UPDATE leaves an
// already-signed-in session showing the stale role until sign-out/sign-in, while this
// path reflects immediately on the very next request.
export async function POST(request: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return errorResponse(401, "unauthenticated", "Sign in required");
  }
  if (session.user.role !== "user" && session.user.role !== "consultant") {
    return errorResponse(403, "forbidden", "This account can't apply as a consultant");
  }

  const body = (await request.json().catch(() => null)) as SubmitBody | null;
  if (!body) {
    return errorResponse(400, "validation_error", "Invalid request body");
  }

  const { token } = await auth.api.getToken({ headers: requestHeaders });
  const backendResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/consultant-profiles/me/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        qualifications: body.qualifications,
        years_of_experience: body.yearsOfExperience,
        current_organization: body.currentOrganization || null,
        license_number: body.licenseNumber || null,
        specializations: body.specializations,
        areas_of_expertise: body.areasOfExpertise.length > 0 ? body.areasOfExpertise : null,
        languages: body.languages,
        consultation_modes: body.consultationModes,
        availability: body.availability || null,
        biography: body.biography,
        linkedin_url: body.linkedinUrl || null,
        portfolio_url: body.portfolioUrl || null,
        clinic_address: body.clinicAddress || null,
        location: body.location || null,
        phone: body.phone,
      }),
    }
  );

  const backendData = await backendResponse.json();
  if (!backendResponse.ok) {
    return NextResponse.json(backendData, { status: backendResponse.status });
  }

  // Only the first-ever submission needs the role flip — a resubmission (rejected/
  // more_info_requested) already happened as a "consultant" account.
  if (session.user.role === "user") {
    const ctx = await auth.$context;
    await ctx.internalAdapter.updateUser(session.user.id, { role: "consultant" });
  }

  return NextResponse.json(backendData, { status: backendResponse.status });
}
