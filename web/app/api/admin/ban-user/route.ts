import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Same shape as set-role/route.ts — a thin, audit-logged wrapper around Better
// Auth's admin-plugin `ban-user` action (Branch 6). The admin Users screen calls
// this, never `authClient.admin.banUser()` directly.
export async function POST(request: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session || session.user.role !== "admin") {
    return errorResponse(403, "forbidden", "Admin role required");
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : null;
  const banReason = typeof body?.banReason === "string" ? body.banReason : undefined;

  if (!userId) {
    return errorResponse(400, "validation_error", "userId is required");
  }

  const result = await auth.api.banUser({
    body: { userId, banReason },
    headers: requestHeaders,
  });

  await writeAdminAuditLog(requestHeaders, {
    action: "user_banned",
    target_type: "user",
    target_id: userId,
    metadata: { reason: banReason ?? null },
  });

  return NextResponse.json(result);
}
