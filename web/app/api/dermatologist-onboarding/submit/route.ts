import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

interface SubmitBody {
  medicalRegistrationNumber: string;
  medicalCouncil: string;
  hospitalClinic: string;
  yearsOfPractice: number | null;
  degrees: string[];
  boardCertifications: string[];
  specializations: string[];
  researchInterests: string;
  professionalBiography: string;
  phone: string;
  location: string;
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Mirrors web/app/api/consultant-onboarding/submit/route.ts exactly — see that
// file's comment (and docs/DECISIONS.md ADR-015) for the full reasoning on why the
// role flip goes through `auth.$context.internalAdapter.updateUser` rather than
// Better Auth's admin-gated `set-role` action or a raw SQL UPDATE.
export async function POST(request: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return errorResponse(401, "unauthenticated", "Sign in required");
  }
  if (session.user.role !== "user" && session.user.role !== "dermatologist") {
    return errorResponse(403, "forbidden", "This account can't apply as a dermatologist");
  }

  const body = (await request.json().catch(() => null)) as SubmitBody | null;
  if (!body) {
    return errorResponse(400, "validation_error", "Invalid request body");
  }

  const { token } = await auth.api.getToken({ headers: requestHeaders });
  const backendResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/dermatologist-profiles/me/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        medical_registration_number: body.medicalRegistrationNumber,
        medical_council: body.medicalCouncil,
        hospital_clinic: body.hospitalClinic || null,
        years_of_practice: body.yearsOfPractice,
        degrees: body.degrees,
        board_certifications:
          body.boardCertifications.length > 0 ? body.boardCertifications : null,
        specializations: body.specializations,
        research_interests: body.researchInterests || null,
        professional_biography: body.professionalBiography,
        phone: body.phone,
        location: body.location || null,
      }),
    }
  );

  const backendData = await backendResponse.json();
  if (!backendResponse.ok) {
    return NextResponse.json(backendData, { status: backendResponse.status });
  }

  // Only the first-ever submission needs the role flip — a resubmission (rejected/
  // more_info_requested) already happened as a "dermatologist" account.
  if (session.user.role === "user") {
    const ctx = await auth.$context;
    await ctx.internalAdapter.updateUser(session.user.id, { role: "dermatologist" });
  }

  return NextResponse.json(backendData, { status: backendResponse.status });
}
