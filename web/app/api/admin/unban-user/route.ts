import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Same shape as ban-user/route.ts.
export async function POST(request: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session || session.user.role !== "admin") {
    return errorResponse(403, "forbidden", "Admin role required");
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : null;
  if (!userId) {
    return errorResponse(400, "validation_error", "userId is required");
  }

  const result = await auth.api.unbanUser({
    body: { userId },
    headers: requestHeaders,
  });

  await writeAdminAuditLog(requestHeaders, {
    action: "user_unbanned",
    target_type: "user",
    target_id: userId,
  });

  return NextResponse.json(result);
}
