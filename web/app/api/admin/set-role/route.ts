import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";

const ASSIGNABLE_ROLES = ["user", "consultant", "dermatologist", "admin"] as const;
type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

function isAssignableRole(value: unknown): value is AssignableRole {
  return (
    typeof value === "string" && (ASSIGNABLE_ROLES as readonly string[]).includes(value)
  );
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Thin wrapper around Better Auth's admin-plugin `set-role` action (Branch 3,
// docs/DECISIONS.md's admin-verification-workflow ADR) — a future admin UI (Branch 6)
// calls this route, never `authClient.admin.setRole()` directly. Reason: Better
// Auth's own action has no audit trail; this route logs every role change to
// `audit_logs` via the FastAPI admin service, the single writer of that table
// (docs/CONVENTIONS.md's "single writer per fact"), so a role change is never silent.
export async function POST(request: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session || session.user.role !== "admin") {
    return errorResponse(403, "forbidden", "Admin role required");
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : null;
  const role = body?.role;
  const reason = typeof body?.reason === "string" ? body.reason : null;

  if (!userId || !isAssignableRole(role)) {
    return errorResponse(400, "validation_error", "userId and a valid role are required");
  }

  // Read the current role first so the audit entry records a real from -> to
  // transition, not just the destination.
  const targetUser = await auth.api
    .getUser({ query: { id: userId }, headers: requestHeaders })
    .catch(() => null);
  if (!targetUser) {
    return errorResponse(404, "not_found", "No user with that id");
  }
  const previousRole = targetUser.role ?? null;

  const result = await auth.api.setRole({
    body: { userId, role },
    headers: requestHeaders,
  });

  await writeAdminAuditLog(requestHeaders, {
    action: "role_changed",
    target_type: "user",
    target_id: userId,
    metadata: { from: previousRole, to: role, reason },
  });

  return NextResponse.json(result);
}
