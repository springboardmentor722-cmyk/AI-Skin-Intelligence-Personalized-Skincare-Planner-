import { auth } from "@/lib/auth";

// Shared by every /api/admin/* wrapper that mutates a user's account (set-role,
// ban-user, unban-user) — the single call site that reaches FastAPI's
// POST /admin/audit-logs, the one write path `audit_logs` has (docs/CONVENTIONS.md's
// single-writer rule; docs/DECISIONS.md ADR-014). Never called with a raw fetch
// inline in a route — one place to get this right.
export async function writeAdminAuditLog(
  requestHeaders: Headers,
  entry: {
    action: string;
    target_type?: string | null;
    target_id?: string | null;
    metadata?: Record<string, unknown> | null;
  }
): Promise<void> {
  const { token } = await auth.api.getToken({ headers: requestHeaders });
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/audit-logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entry),
  });
}
