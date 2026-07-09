import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const ROLES = ["user", "consultant", "dermatologist", "admin"] as const;

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Combines what each side actually owns (Branch 6): user-role counts come from
// Better Auth (identity tables, never read by FastAPI directly — ADR-014's
// precedent) via four filtered `listUsers` calls with limit=1 (only `total` is
// read); pending-verification counts and the recent audit-log activity come from
// FastAPI's GET /admin/dashboard-stats (docs/services/admin/schemas.py's
// DashboardStats — the tables it owns). The admin dashboard page calls this one
// route rather than juggling both sources itself.
export async function GET() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session || session.user.role !== "admin") {
    return errorResponse(403, "forbidden", "Admin role required");
  }

  const roleCountEntries = await Promise.all(
    ROLES.map(async (role) => {
      const result = await auth.api.listUsers({
        query: { filterField: "role", filterOperator: "eq", filterValue: role, limit: "1" },
        headers: requestHeaders,
      });
      return [role, result.total] as const;
    })
  );
  const userCountsByRole = Object.fromEntries(roleCountEntries);

  const { token } = await auth.api.getToken({ headers: requestHeaders });
  const backendResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/dashboard-stats`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const backendData = await backendResponse.json();
  if (!backendResponse.ok) {
    return NextResponse.json(backendData, { status: backendResponse.status });
  }

  return NextResponse.json({ userCountsByRole, ...backendData });
}
